from typing import Any

from fastapi import APIRouter, HTTPException, Query

from app.core.exceptions.exceptions import EduDataException
from app.core.responses.api_response import ApiResponse
from app.schemas.school import SchoolCreate, SchoolUpdate
from app.services.school_service import SchoolService


router = APIRouter(
    prefix="/api/v1/school-registry",
    tags=["School Registry"],
)


@router.get("/search")
def search_schools(
    q: str = Query(..., min_length=2, description="Nome da escola ou Código INEP"),
    limit: int = Query(20, ge=1, le=50),
) -> dict[str, Any]:
    try:
        result = SchoolService.search(query=q, limit=limit)

        return ApiResponse.success(
            data=result,
            message="Pesquisa de escolas realizada com sucesso.",
        )

    except EduDataException as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.get("/inep/{inep_code}")
def get_school_by_inep(inep_code: str) -> dict[str, Any]:
    try:
        school = SchoolService.find_by_inep(inep_code)

        if not school:
            raise HTTPException(status_code=404, detail="Escola não encontrada.")

        return ApiResponse.success(
            data=school,
            message="Escola encontrada com sucesso.",
        )

    except EduDataException as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.get("/{school_id}")
def get_school_by_id(school_id: str) -> dict[str, Any]:
    try:
        school = SchoolService.find_by_id(school_id)

        if not school:
            raise HTTPException(status_code=404, detail="Escola não encontrada.")

        return ApiResponse.success(
            data=school,
            message="Escola encontrada com sucesso.",
        )

    except EduDataException as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.get("/organization/{organization_id}/schools")
def list_schools_by_organization(
    organization_id: str,
    limit: int = Query(100, ge=1, le=200),
) -> dict[str, Any]:
    try:
        schools = SchoolService.list_by_organization(
            organization_id=organization_id,
            limit=limit,
        )

        return ApiResponse.success(
            data={
                "total": len(schools),
                "items": schools,
            },
            message="Escolas da organização listadas com sucesso.",
        )

    except EduDataException as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.post("/")
def create_school(payload: SchoolCreate) -> dict[str, Any]:
    try:
        school = SchoolService.create(payload.model_dump())

        return ApiResponse.created(
            data=school,
            message="Escola criada com sucesso.",
        )

    except EduDataException as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.post("/manual")
def create_manual_school(payload: SchoolCreate) -> dict[str, Any]:
    try:
        school = SchoolService.create_manual_school(payload.model_dump())

        return ApiResponse.created(
            data=school,
            message="Escola manual cadastrada com sucesso.",
        )

    except EduDataException as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.put("/{school_id}")
def update_school(
    school_id: str,
    payload: SchoolUpdate,
) -> dict[str, Any]:
    try:
        school = SchoolService.update(
            record_id=school_id,
            data=payload.model_dump(exclude_unset=True),
        )

        if not school:
            raise HTTPException(status_code=404, detail="Escola não encontrada.")

        return ApiResponse.updated(
            data=school,
            message="Escola atualizada com sucesso.",
        )

    except EduDataException as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.patch("/{school_id}/deactivate")
def deactivate_school(school_id: str) -> dict[str, Any]:
    try:
        school = SchoolService.deactivate(school_id)

        if not school:
            raise HTTPException(status_code=404, detail="Escola não encontrada.")

        return ApiResponse.updated(
            data=school,
            message="Escola desativada com sucesso.",
        )

    except EduDataException as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.patch("/{school_id}/activate")
def activate_school(school_id: str) -> dict[str, Any]:
    try:
        school = SchoolService.activate(school_id)

        if not school:
            raise HTTPException(status_code=404, detail="Escola não encontrada.")

        return ApiResponse.updated(
            data=school,
            message="Escola ativada com sucesso.",
        )

    except EduDataException as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)
