from typing import Any, Optional

from fastapi import APIRouter

from app.core.responses.api_response import ApiResponse
from app.engine.context import EngineContext
from app.engine.engine import EDIEngine
from app.engine.pipelines.pipeline_engine import PipelineEngine
from app.engine.recommendations.recommendation_engine import RecommendationEngine


router = APIRouter(
    prefix="/api/v1/engine",
    tags=["EDI Intelligence Engine"],
)


@router.get("/health")
def health() -> dict[str, Any]:
    return ApiResponse.success(
        data=EDIEngine.health(),
        message="EDI Intelligence Engine online.",
    )


@router.post("/analyze")
def analyze(payload: dict[str, Any]) -> dict[str, Any]:
    context = EngineContext(
        organization_id=payload.get("organization_id"),
        school_id=payload.get("school_id"),
        user_id=payload.get("user_id"),
        module=payload.get("module"),
        role=payload.get("role"),
        metadata=payload.get("metadata", {}),
    )

    result = EDIEngine.analyze(
        context=context,
        payload=payload,
    )

    return ApiResponse.success(
        data=result,
        message="Análise executada com sucesso.",
    )


@router.post("/recommend")
def recommend(payload: dict[str, Any]) -> dict[str, Any]:
    context = EngineContext(
        organization_id=payload.get("organization_id"),
        school_id=payload.get("school_id"),
        user_id=payload.get("user_id"),
        module=payload.get("module"),
        role=payload.get("role"),
        metadata=payload.get("metadata", {}),
    )

    result = RecommendationEngine.generate(
        context=context,
        payload=payload,
    )

    return ApiResponse.success(
        data=result,
        message="Recomendações geradas com sucesso.",
    )


@router.post("/pipeline")
def pipeline(payload: dict[str, Any]) -> dict[str, Any]:
    context = EngineContext(
        organization_id=payload.get("organization_id"),
        school_id=payload.get("school_id"),
        user_id=payload.get("user_id"),
        module=payload.get("module"),
        role=payload.get("role"),
        metadata=payload.get("metadata", {}),
    )

    result = PipelineEngine.execute(
        context=context,
        payload=payload,
    )

    return ApiResponse.success(
        data=result,
        message="Pipeline inteligente executado com sucesso.",
    )
