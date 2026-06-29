from typing import Any

from fastapi import APIRouter, HTTPException, Query

from app.schemas.organization import (
    OrganizationCreate,
    OrganizationResponse,
    OrganizationUpdate,
)
from app.services.organization_service import OrganizationService


router = APIRouter(
    prefix="/api/v1/organizations",
    tags=["Organizations"],
)


@router.get("/")
def list_organizations(
    limit: int = Query(100, ge=1, le=200),
) -> dict[str, Any]:
    items = OrganizationService.list(limit=limit)

    return {
        "total": len(items),
        "items": items,
    }


@router.get("/{organization_id}")
def get_organization_by_id(organization_id: str) -> dict[str, Any]:
    organization = OrganizationService.find_by_id(organization_id)

    if not organization:
        raise HTTPException(
            status_code=404,
            detail="Organização não encontrada.",
        )

    return organization


@router.get("/slug/{slug}")
def get_organization_by_slug(slug: str) -> dict[str, Any]:
    organization = OrganizationService.find_by_slug(slug)

    if not organization:
        raise HTTPException(
            status_code=404,
            detail="Organização não encontrada.",
        )

    return organization


@router.post("/", response_model=OrganizationResponse)
def create_organization(payload: OrganizationCreate) -> dict[str, Any]:
    try:
        return OrganizationService.create(payload.model_dump())

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao criar organização: {str(exc)}",
        )


@router.put("/{organization_id}", response_model=OrganizationResponse)
def update_organization(
    organization_id: str,
    payload: OrganizationUpdate,
) -> dict[str, Any]:
    organization = OrganizationService.update(
        organization_id=organization_id,
        data=payload.model_dump(exclude_unset=True),
    )

    if not organization:
        raise HTTPException(
            status_code=404,
            detail="Organização não encontrada.",
        )

    return organization


@router.patch("/{organization_id}/activate")
def activate_organization(organization_id: str) -> dict[str, Any]:
    organization = OrganizationService.activate(organization_id)

    if not organization:
        raise HTTPException(
            status_code=404,
            detail="Organização não encontrada.",
        )

    return {
        "message": "Organização ativada com sucesso.",
        "organization": organization,
    }


@router.patch("/{organization_id}/deactivate")
def deactivate_organization(organization_id: str) -> dict[str, Any]:
    organization = OrganizationService.deactivate(organization_id)

    if not organization:
        raise HTTPException(
            status_code=404,
            detail="Organização não encontrada.",
        )

    return {
        "message": "Organização desativada com sucesso.",
        "organization": organization,
    }
