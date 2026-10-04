from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.core.logging import logger
from backend.app.api.v1 import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager for startup and shutdown events.
    Guarantees clean startup: creates tables and initial seed data if fresh database.
    """
    try:
        from database.init_db import init_db
        init_db(drop_all=False)

        from database.session import SessionLocal
        from database.models import Campaign
        from database.seed_data import seed_database
        
        db = SessionLocal()
        try:
            if db.query(Campaign).count() == 0:
                logger.info("Clean environment detected. Auto-seeding initial baseline campaign data...")
                seed_database(reset=False)
        except Exception as e:
            logger.warning(f"Database bootstrap check: {e}")
        finally:
            db.close()

        from database.migrations import run_all_migrations
        run_all_migrations()
    except Exception as e:
        logger.warning(f"Database initialization lifecycle notice: {e}")

    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION} [{settings.ENVIRONMENT}]")
    logger.info(f"AI Provider initialized with: {settings.AI_PROVIDER}")
    logger.info(f"Target Registrations: {settings.CAMPAIGN_TARGET_REGISTRATIONS} across {settings.CAMPAIGN_DURATION_DAYS} days")
    yield
    logger.info(f"Shutting down {settings.APP_NAME}")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Backend API Gateway and Growth Engine for NxtWave Student Growth Challenge",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from backend.app.api.growth import router as growth_router

# Register API Routers
app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(growth_router, prefix="/api")
app.include_router(growth_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "docs": f"{settings.API_V1_STR}/docs",
        "health": f"{settings.API_V1_STR}/health"
    }


@app.get("/health")
async def health_alias():
    from backend.app.api.v1.health import health_check
    return await health_check()



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
