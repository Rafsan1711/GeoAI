"""
Accuracy Bot — simulates games for all active places and logs results.
Run manually: python scripts/run_accuracy_test.py
Scheduled: daily via GitHub Actions (ROADMAP-3).
"""

import sys, os, asyncio, json
from pathlib import Path
from datetime import date

sys.path.insert(0, str(Path(__file__).parent.parent))

from atlas_engine.inference_engine import InferenceEngine
from app.services.supabase_service import SupabaseService
from app.utils.logger import setup_logger

logger = setup_logger("accuracy_bot")


def bot_answer(place: dict, question: dict) -> str:
    """Give the correct answer for a place-question pair."""
    attr  = question["attribute"]
    value = question.get("value")
    iv    = place.get("attributes", {}).get(attr)

    if iv is None:
        return "dontknow"
    if isinstance(iv, bool) or isinstance(value, bool):
        return "yes" if bool(iv) == bool(value) else "no"
    if isinstance(iv, list):
        iv_norm = {str(x).lower().strip() for x in iv}
        v_norm  = str(value).lower().strip()
        if v_norm in iv_norm:
            return "yes"
        # Fuzzy: partial match → probably
        if any(v_norm in x or x in v_norm for x in iv_norm):
            return "probably"
        return "no"

    iv_norm = str(iv).lower().strip()
    v_norm  = str(value).lower().strip()
    if iv_norm == v_norm:
        return "yes"
    return "no"


def run_test():
    logger.info("=== Atlas Accuracy Bot Starting ===")

    places    = SupabaseService.get_all_active_places()
    questions = SupabaseService.get_all_questions()
    fi_scores = SupabaseService.get_feature_importance()

    if not places or not questions:
        logger.error("No data found — aborting")
        return

    engine = InferenceEngine()
    engine.load_feature_importance(fi_scores)

    total   = len(places)
    correct = wrong = 0
    total_q = 0
    confused_pairs: dict[str, str] = {}

    logger.info(f"Testing {total} places...")

    for place in places:
        session = engine.start_game(places, questions)
        target_name = place["name"]
        guessed_name = None

        for _ in range(200):  # max 200 questions per game
            question = engine.get_next_question(session)
            if question is None:
                break
            answer = bot_answer(place, question)
            result = engine.process_answer(session, answer)
            if result["should_stop"]:
                break

        pred_result = engine.get_prediction(session)
        total_q += pred_result["questions_asked"]

        if pred_result["prediction"]:
            guessed_name = pred_result["prediction"]["name"]

        is_correct = (guessed_name and guessed_name.lower() == target_name.lower())
        if is_correct:
            correct += 1
        else:
            wrong += 1
            if guessed_name:
                confused_pairs[target_name] = guessed_name
            logger.warning(
                "Wrong guess",
                target=target_name,
                guessed=guessed_name,
                questions=pred_result["questions_asked"],
            )

    accuracy  = (correct / total * 100) if total else 0
    avg_q     = (total_q / total) if total else 0

    logger.info("=== Results ===")
    logger.info(f"Accuracy: {accuracy:.2f}% ({correct}/{total})")
    logger.info(f"Avg Questions: {avg_q:.1f}")

    # Save to Supabase
    SupabaseService.upsert_daily_analytics(str(date.today()), {
        "bot_test_accuracy":       round(accuracy, 2),
        "bot_test_total":          total,
        "bot_test_correct":        correct,
        "bot_test_avg_questions":  round(avg_q, 1),
        "confusion_pairs":         json.dumps([
            {"actual": k, "guessed": v} for k, v in confused_pairs.items()
        ]),
    })
    logger.info("Results saved to analytics_daily")


if __name__ == "__main__":
    run_test()