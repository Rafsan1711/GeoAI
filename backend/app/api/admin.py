"""
Admin API — Firebase auth protected.
Includes: AtlasMind (Gemini data gen), Accuracy stats, Place management.
"""

import json
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional

from app.services.supabase_service import SupabaseService
from app.utils.logger import setup_logger
from app.core.config import settings

logger = setup_logger(__name__)
router = APIRouter()
bearer = HTTPBearer()


# ── Auth ──────────────────────────────────────────────────────

async def verify_admin(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
) -> dict:
    try:
        import firebase_admin
        from firebase_admin import auth as fb_auth, credentials as fb_creds

        if not firebase_admin._apps:
            sdk_json = settings.FIREBASE_ADMIN_SDK_JSON
            if not sdk_json:
                raise ValueError("FIREBASE_ADMIN_SDK_JSON not set")
            cred = fb_creds.Certificate(json.loads(sdk_json))
            firebase_admin.initialize_app(cred)

        decoded = fb_auth.verify_id_token(credentials.credentials)
        admin   = SupabaseService.get_or_create_admin(
            decoded["uid"], decoded.get("email", "")
        )
        return admin
    except Exception as e:
        logger.warning("Admin auth failed", error=str(e))
        raise HTTPException(401, "Unauthorized")


# ── Stats ─────────────────────────────────────────────────────

@router.get("/stats")
async def admin_stats(admin: dict = Depends(verify_admin)):
    analytics = SupabaseService.get_daily_analytics(30)
    client    = _get_client()

    places_count    = client.table("places").select("id", count="exact").eq("is_active", True).execute().count
    questions_count = client.table("questions").select("id", count="exact").eq("is_active", True).execute().count

    return {
        "admin":           admin["email"],
        "places_count":    places_count,
        "questions_count": questions_count,
        "analytics":       analytics,
    }


# ── Accuracy ──────────────────────────────────────────────────

@router.get("/accuracy")
async def get_accuracy_history(admin: dict = Depends(verify_admin)):
    """Returns last 60 days of daily analytics for graph."""
    analytics = SupabaseService.get_daily_analytics(60)
    return {"data": analytics}


@router.post("/accuracy/run")
async def trigger_accuracy_test(admin: dict = Depends(verify_admin)):
    """Trigger accuracy bot manually (runs in background)."""
    import asyncio, subprocess, sys
    try:
        subprocess.Popen(
            [sys.executable, "scripts/run_accuracy_test.py"],
            cwd="/app",
        )
        return {"status": "started", "message": "Accuracy test running in background."}
    except Exception as e:
        raise HTTPException(500, f"Failed to start test: {e}")


# ── AtlasMind ─────────────────────────────────────────────────

class AtlasMindRequest(BaseModel):
    place_names: list[str]           # ["Machu Picchu", "Borobudur"]
    place_type:  str = "landmark"    # country, city, landmark, natural, etc.


class AtlasMindCheckRequest(BaseModel):
    place_names: list[str]


@router.post("/atlasmind/check")
async def check_places_exist(
    req: AtlasMindCheckRequest,
    admin: dict = Depends(verify_admin),
):
    """
    Check which place names already exist in DB.
    Returns: {name: "exists" | "new"}
    """
    client = _get_client()
    result = {}
    for name in req.place_names:
        existing = client.table("places").select("id").ilike("name", name).limit(1).execute()
        result[name] = "exists" if existing.data else "new"
    return {"status": result}


@router.post("/atlasmind/generate")
async def generate_places(
    req: AtlasMindRequest,
    admin: dict = Depends(verify_admin),
):
    """
    Generate place data using Gemini and insert into Supabase.
    Only generates for names not already in DB.
    """
    if not settings.GEMINI_API_KEY:
        raise HTTPException(400, "GEMINI_API_KEY not configured.")

    import google.generativeai as genai
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel(settings.GEMINI_MODEL)

    results = {"generated": [], "skipped": [], "failed": []}

    for place_name in req.place_names:
        # Skip if already exists
        existing = SupabaseService.get_place_by_name(place_name)
        if existing:
            results["skipped"].append(place_name)
            continue

        prompt = _build_atlasmind_prompt(place_name, req.place_type)

        try:
            response = model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.2,
                    response_mime_type="application/json",
                ),
            )
            raw_json = response.text.strip()
            place_data = json.loads(raw_json)

            # Validate required fields
            if "name" not in place_data or "attributes" not in place_data:
                raise ValueError("Missing required fields in Gemini response")

            place_data["type"]       = req.place_type
            place_data["is_active"]  = True
            place_data["is_verified"]= False
            place_data["created_by"] = f"atlasmind:{admin['email']}"

            inserted = SupabaseService.upsert_place(place_data)
            if inserted:
                results["generated"].append(place_name)
                logger.info("AtlasMind generated", place=place_name, type=req.place_type)
            else:
                results["failed"].append(place_name)
        except Exception as e:
            logger.error("AtlasMind generation failed", place=place_name, error=str(e))
            results["failed"].append(place_name)

    return results


def _build_atlasmind_prompt(place_name: str, place_type: str) -> str:
    return f"""You are AtlasMind, a geographic data generator for a guessing game called GuessMyPlace.

Generate comprehensive JSON data for: "{place_name}" (type: {place_type})

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{{
  "name": "{place_name}",
  "emoji": "🏛️",
  "description": "One sentence description for the game.",
  "fun_fact": "One amazing fact that makes this place memorable.",
  "interesting_facts": [
    "Fact 1 — specific and surprising",
    "Fact 2 — specific and surprising",
    "Fact 3 — specific and surprising",
    "Fact 4 — specific and surprising",
    "Fact 5 — specific and surprising"
  ],
  "attributes": {{
    "continent": "asia",
    "subRegion": "southeast asia",
    "country": "indonesia",
    "type": "{place_type}",
    "subtype": "temple",
    "climate": "tropical",
    "famousFor": ["buddhism", "largest buddhist temple", "java island"],
    "hasUNESCO": true,
    "hasWonder": false,
    "mainReligion": "buddhism",
    "isNatural": false,
    "isReligious": true,
    "builtYear": 800,
    "area_km2": 0.02,
    "elevation_m": 265
  }}
}}

Rules:
- All string values must be lowercase except proper nouns
- continent must be one of: asia, europe, africa, northamerica, southamerica, oceania
- Include ALL relevant attributes you know about this place
- famousFor must be an array of 3-8 strings
- Be specific and accurate — this is used in a geography game
- Do NOT include any text outside the JSON"""


def _get_client():
    from app.services.supabase_service import get_client
    return get_client()