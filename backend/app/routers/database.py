from fastapi import APIRouter

from app.services.supabase_service import supabase

router = APIRouter(
    prefix="/api/v1/database",
    tags=["Database"]
)

@router.get("/status")
def status():
    return {
        "database": "Supabase",
        "status": "connected"
    }