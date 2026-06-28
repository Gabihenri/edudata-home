from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class OrganizationBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    slug: str = Field(..., min_length=2, max_length=255)
    organization_type: str = Field(default="school", max_length=50)

    cnpj: Optional[str] = Field(default=None, max_length=20)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(default=None, max_length=30)
    website: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = None
    active: bool = True


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    slug: Optional[str] = Field(default=None, min_length=2, max_length=255)
    organization_type: Optional[str] = Field(default=None, max_length=50)

    cnpj: Optional[str] = Field(default=None, max_length=20)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(default=None, max_length=30)
    website: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = None
    active: Optional[bool] = None


class OrganizationResponse(OrganizationBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OrganizationList(BaseModel):
    total: int
    items: list[OrganizationResponse]
