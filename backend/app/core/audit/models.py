from typing import Any, Optional

from pydantic import BaseModel


class AuditLogCreate(BaseModel):
    action: str
    entity: str

    user_id: Optional[str] = None
    organization_id: Optional[str] = None
    school_id: Optional[str] = None
    entity_id: Optional[str] = None

    old_value: Optional[dict[str, Any]] = None
    new_value: Optional[dict[str, Any]] = None
    metadata: Optional[dict[str, Any]] = None

    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    request_id: Optional[str] = None
    session_id: Optional[str] = None
