from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.exceptions.exceptions import EduDataException
from app.core.responses.api_response import ApiResponse
from app.core.security.agenda_authorization import require_membership
from app.core.security.supabase_user import get_supabase_user
from app.schemas.organization import (
    OrganizationCreate,
    OrganizationUpdate,
)
from app.services.organization_service import OrganizationService


router = APIRouter(
    prefix="/api/v1/organizations",
    tags=["Organizations"],
)


def _require_organization_scope(
    organization_id: str,
    actor: dict[str, Any],
) -> None:
    user_id = actor.get("id")
    if not isinstance(user_id, str) or not user_id.strip():
        raise HTTPException(
            status_code=401,
            detail="Identidade autenticada inválida.",
        )

    # Resolve the requested organization against a current database-backed
    # membership. Roles and organization IDs supplied by clients are not
    # treated as authorization evidence.
    require_membership(
        user_id=user_id,
        organization_id=organization_id,
        school_id=None,
    )


def _management_not_ready() -> None:
    # Fail closed until a database-backed organization-management permission
    # is defined and validated. Authentication alone does not grant admin.
    raise HTTPException(
        status_code=403,
        detail=(
            "Gestão de organizações indisponível até a validação "
            "do escopo administrativo."
        ),
    )


@router.get("/")
def list_organizations(
    limit: int = Query(100, ge=1, le=200),
    actor: dict[str, Any] = Depends(get_supabase_user),
) -> dict[str, Any]:
    # The current data model has no safe resolver for listing every
    # organization a user can access. Do not expose an unscoped global list.
    _management_not_ready()


@router.get("/{organization_id}")
def get_organization_by_id(
    organization_id: str,
    actor: dict[str, Any] = Depends(get_supabase_user),
) -> dict[str, Any]:
    try:
        _require_organization_scope(organization_id, actor)
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
    actor: dict[str, Any] = Depends(get_supabase_user),
) -> dict[str, Any]:
    try:
        # Authenticate before lookup; after resolving the slug, verify the
        # caller's current membership before returning organization details.
        organization = OrganizationService.find_by_slug(slug)
        if not organization:
            raise HTTPException(
                status_code=404,
                detail="Organização não encontrada.",
            )

        organization_id = organization.get("id")
        if not isinstance(organization_id, str) or not organization_id.strip():
            raise HTTPException(
                status_code=503,
                detail="Não foi possível validar o escopo da organização.",
            )

        _require_organization_scope(organization_id, actor)
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
    actor: dict[str, Any] = Depends(get_supabase_user),
) -> dict[str, Any]:
    _management_not_ready()


@router.put("/{organization_id}")
def update_organization(
    organization_id: str,
    payload: OrganizationUpdate,
    actor: dict[str, Any] = Depends(get_supabase_user),
) -> dict[str, Any]:
    _management_not_ready()


@router.patch("/{organization_id}/activate")
def activate_organization(
    organization_id: str,
    actor: dict[str, Any] = Depends(get_supabase_user),
) -> dict[str, Any]:
    _management_not_ready()


@router.patch("/{organization_id}/deactivate")
def deactivate_organization(
    organization_id: str,
    actor: dict[str, Any] = Depends(get_supabase_user),
) -> dict[str, Any]:
    _management_not_ready()
