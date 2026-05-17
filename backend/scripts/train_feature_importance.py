"""
Train feature importance from real game session data.

Uses scikit-learn Random Forest on historical game answers.
Updates feature_importance table in Supabase.

Run:
  python scripts/train_feature_importance.py
  
Schedule: weekly via GitHub Actions (after enough game data accumulates).
Minimum games needed: 200 (otherwise skip training, keep current scores).
"""

import sys, json
import numpy as np
from pathlib import Path
from collections import defaultdict
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.supabase_service import get_client, SupabaseService
from app.utils.logger import setup_logger

logger = setup_logger("ml_trainer")

MIN_GAMES_FOR_TRAINING = 200


def load_training_data() -> tuple[list[dict], list[int]]:
    """
    Load game answers as features, game outcome as label.
    
    Feature vector per game: dict of {attribute: answer_score}
      answer_score: yes=1.0, probably=0.5, dontknow=0.0, probablynot=-0.5, no=-1.0
    Label: 1 = correct guess, 0 = incorrect
    """
    client = get_client()

    # Load completed sessions
    sessions = client.table("game_sessions").select(
        "id, status, target_place_id"
    ).in_("status", ["correct", "incorrect"]).execute().data or []

    if len(sessions) < MIN_GAMES_FOR_TRAINING:
        logger.warning(
            f"Only {len(sessions)} games — need {MIN_GAMES_FOR_TRAINING} for training. Skipping."
        )
        return [], []

    logger.info(f"Loading {len(sessions)} game sessions for training...")

    ANSWER_SCORES = {
        "yes": 1.0, "probably": 0.5, "dontknow": 0.0,
        "probablynot": -0.5, "no": -1.0
    }

    X: list[dict] = []
    y: list[int]  = []

    for session in sessions:
        sid = session["id"]

        # Load answers for this session
        answers = client.table("game_answers").select(
            "attribute, answer"
        ).eq("session_id", sid).execute().data or []

        if not answers:
            continue

        # Build feature dict
        features = defaultdict(float)
        attr_counts: dict[str, int] = defaultdict(int)

        for ans in answers:
            attr  = ans["attribute"]
            score = ANSWER_SCORES.get(ans["answer"], 0.0)
            features[attr]     += score
            attr_counts[attr]  += 1

        # Normalize by count (avg answer per attribute)
        for attr in features:
            if attr_counts[attr] > 1:
                features[attr] /= attr_counts[attr]

        X.append(dict(features))
        y.append(1 if session["status"] == "correct" else 0)

    logger.info(f"Training samples: {len(X)} | Correct: {sum(y)} | Incorrect: {len(y)-sum(y)}")
    return X, y


def vectorize(X: list[dict], all_attrs: list[str]) -> np.ndarray:
    """Convert list of feature dicts to numpy matrix."""
    matrix = np.zeros((len(X), len(all_attrs)), dtype=np.float32)
    for i, features in enumerate(X):
        for j, attr in enumerate(all_attrs):
            matrix[i, j] = features.get(attr, 0.0)
    return matrix


def train_and_update():
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import cross_val_score
    from sklearn.preprocessing import StandardScaler

    X_raw, y = load_training_data()
    if not X_raw:
        return

    # Collect all attributes seen in training data
    all_attrs = sorted(set(attr for features in X_raw for attr in features))
    logger.info(f"Attributes in training data: {len(all_attrs)}")

    X = vectorize(X_raw, all_attrs)

    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Train Random Forest
    rf = RandomForestClassifier(
        n_estimators=200,
        max_depth=8,
        min_samples_leaf=3,
        class_weight="balanced",   # handle class imbalance
        random_state=42,
        n_jobs=-1,
    )

    # Cross-validation to check quality
    cv_scores = cross_val_score(rf, X_scaled, y, cv=5, scoring="accuracy")
    logger.info(f"CV Accuracy: {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")

    if cv_scores.mean() < 0.55:
        logger.warning("Model accuracy too low — not updating feature importance")
        return

    # Fit on full data
    rf.fit(X_scaled, y)

    # Extract feature importances
    importances = rf.feature_importances_
    attr_importance = dict(zip(all_attrs, importances.tolist()))

    # Normalize to 0-1 range
    max_imp = max(attr_importance.values()) if attr_importance else 1.0
    if max_imp > 0:
        attr_importance = {k: v / max_imp for k, v in attr_importance.items()}

    logger.info("Top 10 most important attributes:")
    for attr, score in sorted(attr_importance.items(), key=lambda x: -x[1])[:10]:
        logger.info(f"  {attr}: {score:.4f}")

    # Update Supabase
    client = get_client()
    updated = 0
    for attr, score in attr_importance.items():
        try:
            client.table("feature_importance").upsert({
                "attribute":       attr,
                "place_type":      "all",
                "importance_score": round(score, 4),
            }, on_conflict="attribute,place_type").execute()
            updated += 1
        except Exception as e:
            logger.warning(f"Failed to update {attr}: {e}")

    logger.info(f"Updated {updated} feature importance scores in Supabase ✅")

    # Reload into running engine cache via API if backend is running
    try:
        import httpx
        r = httpx.post("http://localhost:7860/api/admin/engine/reload-fi", timeout=5)
        if r.status_code == 200:
            logger.info("Engine feature importance cache reloaded ✅")
    except Exception:
        logger.info("Engine reload skipped (run separately or restart backend)")


if __name__ == "__main__":
    train_and_update()