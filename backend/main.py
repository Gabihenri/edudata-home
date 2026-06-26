from fastapi import FastAPI

from app.routers.health import router as health_router
from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.agenda import router as agenda_router
from app.routers.actions import router as actions_router
from app.routers.evidences import router as evidences_router
from app.routers import database

app = FastAPI(
    title="EduData IA API",
    version="1.0.0"
)

app.include_router(health_router)
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(users_router, prefix="/api/v1/users", tags=["Users"])
app.include_router(agenda_router, prefix="/api/v1/agenda", tags=["Agenda EDI"])
app.include_router(actions_router, prefix="/api/v1/actions", tags=["Pedagogical Actions"])
app.include_router(evidences_router, prefix="/api/v1/evidences", tags=["Evidence Ledger"])
app.include_router(database.router)

@app.get("/")
def root():
    return {
        "plataforma": "EduData IA",
        "status": "online",
        "versao": "1.0.0"
    }