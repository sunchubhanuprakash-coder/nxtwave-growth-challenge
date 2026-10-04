from datetime import datetime, timezone
from fastapi import APIRouter
from sqlalchemy import text
from backend.app.config import settings
from database.session import SessionLocal

router = APIRouter()


@router.get("/health", tags=["System Health"])
async def health_check():
    """
    Health check endpoint returning system status, version, database connectivity, and active provider info.
    Complies with container orchestration liveness and readiness probe specifications.
    """
    db_status = "connected"
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    is_healthy = db_status == "connected"

    return {
        "status": "healthy" if is_healthy else "degraded",
        "database": db_status,
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "ai_provider": settings.AI_PROVIDER,
        "campaign": {
            "target": settings.CAMPAIGN_TARGET_REGISTRATIONS,
            "budget_inr": settings.CAMPAIGN_BUDGET_INR,
            "duration_days": settings.CAMPAIGN_DURATION_DAYS,
            "workshop": settings.WORKSHOP_TITLE,
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
