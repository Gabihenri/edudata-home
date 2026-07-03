from fastapi import FastAPI

from app.routers.health import router as health_router
from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.organization import router as organization_router
from app.routers.school_registry import router as school_registry_router
from app.routers.agenda import router as agenda_router
from app.routers.actions import router as actions_router
from app.routers.evidences import router as evidences_router
from app.routers.database import router as database_router
from app.routers.engine import router as engine_router


app = FastAPI(
    title="EduData IA API",
    version="1.0.0",
    description="API oficial da Plataforma EduData IA (Framework EDI)"
)

# ==========================================================
# HEALTH
# ==========================================================

app.include_router(health_router)

# ==========================================================
# CORE
# ==========================================================

app.include_router(auth_router, prefix="/api/v1")
app.include_router(users_router)

# ==========================================================
# ORGANIZAÇÕES
# ==========================================================

app.include_router(organization_router)

# ==========================================================
# SCHOOL REGISTRY
# ==========================================================

app.include_router(school_registry_router)

# ==========================================================
# AGENDA INTELIGENTE EDI
# ==========================================================

app.include_router(agenda_router)

# ==========================================================
# EDI INTELLIGENCE ENGINE
# ==========================================================

app.include_router(engine_router)

# ==========================================================
# PEDAGÓGICO
# ==========================================================

app.include_router(actions_router)
app.include_router(evidences_router)

# ==========================================================
# DATABASE
# ==========================================================

app.include_router(database_router)

# ==========================================================
# ROOT
# ==========================================================

@app.get("/")
def root():
    return {
        "platform": "EduData IA",
        "framework": "EDI",
        "engine": "EDI Intelligence Engine",
        "version": "1.0.0",
        "status": "online",
        "environment": "development"
    }


# ==========================================================
# HEALTH CHECK
# ==========================================================

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "EduData IA API",
        "version": "1.0.0"
    }
