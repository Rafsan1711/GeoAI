"""
Migrate countries.json → Supabase places table.
Run: cd backend && python scripts/migrate_seed_data.py
Copy your old countries.json to backend/scripts/countries_backup.json first.
"""
import json, os, sys
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()
sys.path.insert(0, str(Path(__file__).parent.parent))
from supabase import create_client
from app.core.config import settings

DATA_FILE = Path(__file__).parent / "countries_backup.json"
SKIP_KEYS = {'id','name','emoji','info','funFact','interestingFacts'}

def transform(country: dict) -> dict:
    attrs = {k: v for k, v in country.items() if k not in SKIP_KEYS}
    return {
        "name": country["name"],
        "type": "country",
        "emoji": country.get("emoji"),
        "description": country.get("info",""),
        "fun_fact": country.get("funFact"),
        "interesting_facts": country.get("interestingFacts", []),
        "attributes": attrs,
        "data_quality_score": 0.85,
        "is_active": True,
        "is_verified": True,
        "created_by": "migration_v1"
    }

def run():
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    with open(DATA_FILE) as f:
        countries = json.load(f)

    seen, unique = set(), []
    for c in countries:
        if c["name"] not in seen:
            seen.add(c["name"])
            unique.append(c)

    print(f"Migrating {len(unique)} countries...")
    ok = fail = 0
    for i in range(0, len(unique), 50):
        batch = [transform(c) for c in unique[i:i+50]]
        try:
            client.table("places").upsert(batch, on_conflict="name").execute()
            ok += len(batch)
            print(f"  ✅ Batch {i//50+1}: {len(batch)} ok")
        except Exception as e:
            fail += len(batch)
            print(f"  ❌ Batch {i//50+1} failed: {e}")

    print(f"\nDone: {ok} success, {fail} failed")

if __name__ == "__main__":
    run()