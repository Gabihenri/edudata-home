from typing import Any

from fastapi import APIRouter, HTTPException, Query

from app.core.exceptions.exceptions import EduDataException
from app.core.responses.api_response import ApiResponse
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
    try:
        organizations = OrganizationService.list(limit=limit)

        return ApiResponse.success(
            data={
                "total": len(organizations),
                "items": organizations,
            },
            message="Organizações listadas com sucesso.",
        )

    except EduDataException as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
        )


@router.get("/{organization_id}")
def get_organization_by_id(
    organization_id: str,
) -> dict[str, Any]:
    try:
        organization = OrganizationService.find_by_id(organization_id)

        if not organization:
            raise HTTPException(
                status_code=404,
                detail="Organização não encontrada.",
            )

        return ApiResponse.success(
            data=organization,
            message="Organização encontrada com sucesso.",
        )

    except EduDataException as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
        )


@router.get("/slug/{slug}")
def get_organization_by_slug(
    slug: str,
) -> dict[str, Any]:
    try:
        organization = OrganizationService.find_by_slug(slug)

        if not organization:
            raise HTTPException(
                status_code=404,
                detail="Organização não encontrada.",
            )

        return ApiResponse.success(
            data=organization,
            message="Organização encontrada com sucesso.",
        )

    except EduDataException as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
        )


@router.post("/", response_model=None)
def create_organization(
    payload: OrganizationCreate,
) -> dict[str, Any]:
    try:
        organization = OrganizationService.create(
            payload.model_dump()
        )

        return ApiResponse.created(
            data=organization,
            message="Organização criada com sucesso.",
        )

    except EduDataException as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
        )


@router.put("/{organization_id}")
def update_organization(
    organization_id: str,
    payload: OrganizationUpdate,
) -> dict[str, Any]:
    try:
        organization = OrganizationService.update(
            record_id=organization_id,
            data=payload.model_dump(exclude_unset=True),
        )

        if not organization:
            raise HTTPException(
                status_code=404,
                detail="Organização não encontrada.",
            )

        return ApiResponse.updated(
            data=organization,
            message="Organização atualizada com sucesso.",
        )

    except EduDataException as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
        )


@router.patch("/{organization_id}/activate")
def activate_organization(
    organization_id: str,
) -> dict[str, Any]:
    try:
        organization = OrganizationService.activate(
            organization_id
        )

        if not organization:
            raise HTTPException(
                status_code=404,
                detail="Organização não encontrada.",
            )

        return ApiResponse.updated(
            data=organization,
            message="Organização ativada com sucesso.",
        )

    except EduDataException as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
        )


@router.patch("/{organization_id}/deactivate")
def deactivate_organization(
    organization_id: str,
) -> dict[str, Any]:
    try:
        organization = OrganizationService.deactivate(
            organization_id
        )

        if not organization:
            raise HTTPException(
                status_code=404,
                detail="Organização não encontrada.",
            )

        return ApiResponse.updated(
            data=organization,
            message="Organização desativada com sucesso.",
        )

    except EduDataException as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
        )