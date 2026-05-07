"""
Migrate questions.json → Supabase questions table.
Run: cd backend && python scripts/migrate_questions.py
Copy old questions.json to backend/scripts/questions_backup.json first.
"""

import json, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from supabase import create_client
from app.core.config import settings
from app.utils.logger import setup_logger

logger = setup_logger("migrate_questions")

DATA_FILE = Path(__file__).parent / "questions_backup.json"

# Stage map: which attribute asks at which stage
STAGE_MAP = {
    "continent": 0, "type": 0,
    "region": 1, "subRegion": 1, "subtype": 1,
    "isBalticState": 1,
    "hasCoast": 2, "landlocked": 2, "isIsland": 2, "isArchipelago": 2,
    "hasMountains": 2, "hasRivers": 2, "climate": 2, "avgTemperature": 2,
    "country": 2, "bordersRussia": 2, "bordersGermany": 2, "bordersChina": 2,
    "bordersIran": 2, "bordersPakistan": 2, "neighbors": 2,
    "population": 3, "size": 3,
    "government": 4, "mainReligion": 4, "driveSide": 4, "monarchyType": 4,
    "isEUMember": 4, "isNATOMember": 4, "isSchengen": 4, "isASEANMember": 4,
    "isFormerSoviet": 4, "isFormerBritishColony": 4, "colonizedBy": 4,
    "isOnlyChristianAsianNation": 4,
    "language": 5, "languageFamily": 5, "flagColors": 5, "formerColony": 5,
    "hasNobel": 5, "hasUNESCO": 5, "hasWonder": 5, "hostsMajorSportEvent": 5,
    "gdpLevel": 5,
    "exports": 6, "famousFor": 6, "famousPeople": 6,
    "capital": 7, "currency": 7, "nationalDish": 7,
}


def transform_question(q: dict) -> dict:
    attr  = q.get("attribute", "")
    stage = STAGE_MAP.get(attr, 5)
    return {
        "question_text":    q["question"],
        "attribute":        attr,
        "value":            q.get("value"),
        "applicable_types": ["country"],
        "stage":            stage,
        "base_weight":      q.get("weight", 1.0),
        "learned_weight":   q.get("weight", 1.0),
        "is_active":        True,
    }


def run():
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

    with open(DATA_FILE) as f:
        raw = json.load(f)

    # questions.json is {"country": [...]}
    questions = raw.get("country", raw) if isinstance(raw, dict) else raw

    # Deduplicate by question text
    seen, unique = set(), []
    for q in questions:
        txt = q.get("question", "")
        if txt and txt not in seen:
            seen.add(txt)
            unique.append(q)

    print(f"Migrating {len(unique)} questions...")
    ok = fail = 0

    for i in range(0, len(unique), 100):
        batch = [transform_question(q) for q in unique[i:i+100]]
        try:
            client.table("questions").upsert(
                batch, on_conflict="question_text"
            ).execute()
            ok += len(batch)
            print(f"  ✅ Batch {i//100+1}: {len(batch)} ok")
        except Exception as e:
            fail += len(batch)
            print(f"  ❌ Batch {i//100+1} failed: {e}")

    print(f"\nDone: {ok} success, {fail} failed")


if __name__ == "__main__":
    run()