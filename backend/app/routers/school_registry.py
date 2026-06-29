from typing import Any

from fastapi import APIRouter, HTTPException, Query

from app.schemas.school import SchoolCreate, SchoolResponse, SchoolUpdate
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
        return SchoolService.search(query=q, limit=limit)

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao pesquisar escolas: {str(exc)}",
        )


@router.get("/inep/{inep_code}")
def get_school_by_inep(inep_code: str) -> dict[str, Any]:
    school = SchoolService.find_by_inep(inep_code)

    if not school:
        raise HTTPException(
            status_code=404,
            detail="Escola não encontrada.",
        )

    return school


@router.get("/{school_id}")
def get_school_by_id(school_id: str) -> dict[str, Any]:
    school = SchoolService.find_by_id(school_id)

    if not school:
        raise HTTPException(
            status_code=404,
            detail="Escola não encontrada.",
        )

    return school


@router.get("/organization/{organization_id}/schools")
def list_schools_by_organization(
    organization_id: str,
    limit: int = Query(100, ge=1, le=200),
) -> dict[str, Any]:
    items = SchoolService.list_by_organization(
        organization_id=organization_id,
        limit=limit,
    )

    return {
        "total": len(items),
        "items": items,
    }


@router.post("/", response_model=SchoolResponse)
def create_school(payload: SchoolCreate) -> dict[str, Any]:
    try:
        return SchoolService.create(payload.model_dump())

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao criar escola: {str(exc)}",
        )


@router.post("/manual", response_model=SchoolResponse)
def create_manual_school(payload: SchoolCreate) -> dict[str, Any]:
    try:
        return SchoolService.create_manual_school(payload.model_dump())

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao cadastrar escola manual: {str(exc)}",
        )


@router.put("/{school_id}", response_model=SchoolResponse)
def update_school(
    school_id: str,
    payload: SchoolUpdate,
) -> dict[str, Any]:
    data = payload.model_dump(exclude_unset=True)

    school = SchoolService.update(
        school_id=school_id,
        data=data,
    )

    if not school:
        raise HTTPException(
            status_code=404,
            detail="Escola não encontrada.",
        )

    return school


@router.patch("/{school_id}/deactivate")
def deactivate_school(school_id: str) -> dict[str, Any]:
    school = SchoolService.deactivate(school_id)

    if not school:
        raise HTTPException(
            status_code=404,
            detail="Escola não encontrada.",
        )

    return {
        "message": "Escola desativada com sucesso.",
        "school": school,
    }


@router.patch("/{school_id}/activate")
def activate_school(school_id: str) -> dict[str, Any]:
    school = SchoolService.activate(school_id)

    if not school:
        raise HTTPException(
            status_code=404,
            detail="Escola não encontrada.",
        )

    return {
        "message": "Escola ativada com sucesso.",
        "school": school,
    }
