from typing import Optional, Any
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.services.supabase_service import supabase


router = APIRouter(
    prefix="/api/v1/school-registry",
    tags=["School Registry"],
)


class ManualSchoolCreate(BaseModel):
    name: str = Field(..., min_length=3)
    uf: Optional[str] = None
    municipality: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    administrative_dependency: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_by_user_id: Optional[str] = None


class OrganizationSchoolLink(BaseModel):
    organization_id: str
    school_registry_id: Optional[str] = None
    manual_school_id: Optional[str] = None
    role: Optional[str] = "main"


@router.get("/search")
def search_schools(
    q: str = Query(..., min_length=2, description="Nome da escola ou Código INEP"),
    limit: int = Query(20, ge=1, le=50),
) -> dict[str, Any]:
    """
    Pesquisa escolas oficiais da base INEP por Código INEP ou nome.
    """

    query = q.strip()

    try:
        if query.isdigit():
            response = (
                supabase.table("school_registry")
                .select("*")
                .eq("inep_code", query)
                .limit(limit)
                .execute()
            )
        else:
            response = (
                supabase.table("school_registry")
                .select("*")
                .ilike("name", f"%{query}%")
                .limit(limit)
                .execute()
            )

        return {
            "query": query,
            "total": len(response.data or []),
            "results": response.data or [],
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao pesquisar escolas: {str(exc)}",
        )


@router.get("/inep/{inep_code}")
def get_school_by_inep(inep_code: str) -> dict[str, Any]:
    """
    Busca uma escola oficial pelo Código INEP.
    """

    try:
        response = (
            supabase.table("school_registry")
            .select("*")
            .eq("inep_code", inep_code)
            .limit(1)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Escola não encontrada na base oficial INEP.",
            )

        return response.data[0]

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao buscar escola: {str(exc)}",
        )


@router.post("/manual")
def create_manual_school(payload: ManualSchoolCreate) -> dict[str, Any]:
    """
    Cadastra uma escola manualmente quando ela não for encontrada na base INEP.
    A escola entra como pendente de validação.
    """

    data = {
        "name": payload.name,
        "uf": payload.uf,
        "municipality": payload.municipality,
        "address": payload.address,
        "phone": payload.phone,
        "administrative_dependency": payload.administrative_dependency,
        "location": payload.location,
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "source": "MANUAL",
        "review_status": "pending",
        "verified": False,
        "created_by_user_id": payload.created_by_user_id,
    }

    try:
        response = (
            supabase.table("manual_schools")
            .insert(data)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=500,
                detail="Não foi possível cadastrar a escola manual.",
            )

        return {
            "message": "Escola cadastrada manualmente e aguardando validação.",
            "school": response.data[0],
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao cadastrar escola manual: {str(exc)}",
        )


@router.post("/link-organization")
def link_school_to_organization(payload: OrganizationSchoolLink) -> dict[str, Any]:
    """
    Vincula uma escola oficial ou manual a uma organização da EduData IA.
    """

    if not payload.school_registry_id and not payload.manual_school_id:
        raise HTTPException(
            status_code=400,
            detail="Informe school_registry_id ou manual_school_id.",
        )

    if payload.school_registry_id and payload.manual_school_id:
        raise HTTPException(
            status_code=400,
            detail="Informe apenas uma origem: escola oficial ou escola manual.",
        )

    data = {
        "organization_id": payload.organization_id,
        "school_registry_id": payload.school_registry_id,
        "manual_school_id": payload.manual_school_id,
        "role": payload.role,
        "active": True,
    }

    try:
        response = (
            supabase.table("organization_schools")
            .insert(data)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=500,
                detail="Não foi possível vincular a escola à organização.",
            )

        return {
            "message": "Escola vinculada à organização com sucesso.",
            "link": response.data[0],
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao vincular escola à organização: {str(exc)}",
        )


@router.get("/manual/pending")
def list_pending_manual_schools(limit: int = Query(50, ge=1, le=100)) -> dict[str, Any]:
    """
    Lista escolas cadastradas manualmente aguardando validação.
    """

    try:
        response = (
            supabase.table("manual_schools")
            .select("*")
            .eq("review_status", "pending")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )

        return {
            "total": len(response.data or []),
            "results": response.data or [],
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao listar escolas pendentes: {str(exc)}",
        )
