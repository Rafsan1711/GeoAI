"""
Admin API — protected by Firebase auth token verification.
Only admin users (in admin_users table) can access.
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.supabase_service import SupabaseService
from app.utils.logger import setup_logger

logger = setup_logger(__name__)
router = APIRouter()
bearer = HTTPBearer()


async def verify_admin(credentials: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    """Verify Firebase ID token and check admin_users table."""
    try:
        import firebase_admin
        from firebase_admin import auth as fb_auth, credentials as fb_creds
        from app.core.config import settings
        import json

        # Initialize Firebase Admin SDK if not already
        if not firebase_admin._apps:
            sdk_json = settings.FIREBASE_ADMIN_SDK_JSON
            if sdk_json:
                cred = fb_creds.Certificate(json.loads(sdk_json))
                firebase_admin.initialize_app(cred)

        decoded = fb_auth.verify_id_token(credentials.credentials)
        uid   = decoded["uid"]
        email = decoded.get("email", "")

        admin = SupabaseService.get_or_create_admin(uid, email)
        return admin
    except Exception as e:
        logger.warning("Admin auth failed", error=str(e))
        raise HTTPException(401, "Unauthorized")


@router.get("/stats")
async def admin_stats(admin: dict = Depends(verify_admin)):
    analytics = SupabaseService.get_daily_analytics(30)
    return {"analytics": analytics, "admin": admin["email"]}


@router.get("/places/count")
async def places_count(admin: dict = Depends(verify_admin)):
    from app.services.supabase_service import get_client
    result = get_client().table("places").select("id", count="exact").eq("is_active", True).execute()
    return {"count": result.count}


@router.post("/atlasmind/generate")
async def generate_place(
    payload: dict,
    admin: dict = Depends(verify_admin),
):
    """
    AtlasMind: generate place data with Gemini and insert to Supabase.
    payload = { "place_name": "Machu Picchu", "type": "landmark" }
    Full implementation in ROADMAP-3.
    """
    return {"status": "coming_soon", "message": "AtlasMind full implementation in Phase 3"}