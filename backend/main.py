from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI

from app.routers.actions import router as actions_router
from app.routers.agenda import router as agenda_router
from app.routers.auth import router as auth_router
from app.routers.calendar_intelligence import (
    router as calendar_intelligence_router,
)
from app.routers.database import router as database_router
from app.routers.engine import router as engine_router
from app.routers.evidence_intelligence import (
    router as evidence_intelligence_router,
)
from app.routers.evidences import router as evidences_router
from app.routers.health import router as health_router
from app.routers.intelligence import router as intelligence_router
from app.routers.organization import router as organization_router
from app.routers.planning_intelligence import (
    router as planning_intelligence_router,
)
from app.routers.school_registry import router as school_registry_router
from app.routers.task_intelligence import (
    router as task_intelligence_router,
)
from app.routers.teacher_intelligence import (
    router as teacher_intelligence_router,
)
from app.routers.users import router as users_router
from app.services.capabilities.bootstrap import (
    capability_bootstrap,
)


@asynccontextmanager
async def lifespan(
    _app: FastAPI,
) -> AsyncIterator[None]:
    """
    Ciclo oficial de inicialização da API EduData IA.

    Durante o startup:

    - descobre os módulos oficiais de capacidades;
    - registra os contratos no Capability Registry;
    - registra os handlers no Capability Dispatcher;
    - valida a consistência inicial do ECP.

    O bootstrap não:

    - executa capacidades;
    - acessa banco de dados;
    - chama o Pipeline;
    - altera registros;
    - substitui autenticação ou autorização.

    Se o ECP não puder ser inicializado corretamente, a API
    não deve iniciar de forma parcialmente funcional.
    """

    bootstrap_report = (
        capability_bootstrap.initialize()
    )

    if not bootstrap_report.success:
        raise RuntimeError(
            (
                "A Educational Capability Platform "
                "não foi inicializada de forma consistente."
            ),
        )

    print(
        "[EDUDATA_API_STARTUP_COMPLETED]",
        {
            "ecp_initialized": True,
            "registry_total": (
                bootstrap_report.registry_total
            ),
            "registered_handlers": (
                len(
                    bootstrap_report
                    .registered_handlers,
                )
            ),
        },
    )

    yield

    print(
        "[EDUDATA_API_SHUTDOWN_COMPLETED]",
        {
            "ecp_initialized": True,
        },
    )


app = FastAPI(
    title="EduData IA API",
    version="1.0.0",
    description=(
        "API oficial da Plataforma EduData IA "
        "(Framework EDI)"
    ),
    lifespan=lifespan,
)


# ==========================================================
# HEALTH
# ==========================================================

app.include_router(
    health_router,
)


# ==========================================================
# CORE
# ==========================================================

app.include_router(
    auth_router,
    prefix="/api/v1",
)

app.include_router(
    users_router,
)


# ==========================================================
# ORGANIZAÇÕES
# ==========================================================

app.include_router(
    organization_router,
)


# ==========================================================
# SCHOOL REGISTRY
# ==========================================================

app.include_router(
    school_registry_router,
)


# ==========================================================
# AGENDA INTELIGENTE EDI
# ==========================================================

app.include_router(
    agenda_router,
)


# ==========================================================
# EDI INTELLIGENCE ENGINE
# ==========================================================

app.include_router(
    engine_router,
)

app.include_router(
    intelligence_router,
)

app.include_router(
    planning_intelligence_router,
)

app.include_router(
    evidence_intelligence_router,
)

app.include_router(
    task_intelligence_router,
)

app.include_router(
    calendar_intelligence_router,
)

app.include_router(
    teacher_intelligence_router,
)


# ==========================================================
# PEDAGÓGICO
# ==========================================================

app.include_router(
    actions_router,
)

app.include_router(
    evidences_router,
)


# ==========================================================
# DATABASE
# ==========================================================

app.include_router(
    database_router,
)


# ==========================================================
# ROOT
# ==========================================================

@app.get("/")
def root() -> dict[str, str]:
    return {
        "platform": "EduData IA",
        "framework": "EDI",
        "engine": "EDI Intelligence Engine",
        "capability_platform": "ECP",
        "version": "1.0.0",
        "status": "online",
        "environment": "development",
    }


# ==========================================================
# HEALTH CHECK
# ==========================================================

@app.get("/health")
def health() -> dict[str, str | bool | int]:
    ecp_status = (
        capability_bootstrap.status()
    )

    return {
        "status": "healthy",
        "service": "EduData IA API",
        "version": "1.0.0",
        "ecp_initialized": bool(
            ecp_status.get(
                "initialized",
                False,
            ),
        ),
        "registered_capabilities": int(
            ecp_status.get(
                "registry_total",
                0,
            ),
        ),
    }