from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class SchoolBase(BaseModel):
    organization_id: str

    inep_code: Optional[str] = Field(default=None, max_length=20)
    name: str = Field(..., min_length=2, max_length=255)
    short_name: Optional[str] = Field(default=None, max_length=150)
    code: Optional[str] = Field(default=None, max_length=50)

    address: Optional[str] = None
    neighborhood: Optional[str] = Field(default=None, max_length=150)
    city: Optional[str] = Field(default=None, max_length=100)
    state: Optional[str] = Field(default=None, max_length=2)
    zip_code: Optional[str] = Field(default=None, max_length=20)

    latitude: Optional[float] = None
    longitude: Optional[float] = None

    administrative_dependency: Optional[str] = Field(default=None, max_length=100)
    school_type: Optional[str] = Field(default=None, max_length=100)
    location_type: Optional[str] = Field(default=None, max_length=50)

    official_registry: bool = True
    manually_created: bool = False
    pending_validation: bool = False
    active: bool = True

    phone: Optional[str] = Field(default=None, max_length=50)
    email: Optional[str] = Field(default=None, max_length=255)
    website: Optional[str] = Field(default=None, max_length=255)


class SchoolCreate(SchoolBase):
    pass


class SchoolUpdate(BaseModel):
    inep_code: Optional[str] = Field(default=None, max_length=20)
    name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    short_name: Optional[str] = Field(default=None, max_length=150)
    code: Optional[str] = Field(default=None, max_length=50)

    address: Optional[str] = None
    neighborhood: Optional[str] = Field(default=None, max_length=150)
    city: Optional[str] = Field(default=None, max_length=100)
    state: Optional[str] = Field(default=None, max_length=2)
    zip_code: Optional[str] = Field(default=None, max_length=20)

    latitude: Optional[float] = None
    longitude: Optional[float] = None

    administrative_dependency: Optional[str] = Field(default=None, max_length=100)
    school_type: Optional[str] = Field(default=None, max_length=100)
    location_type: Optional[str] = Field(default=None, max_length=50)

    official_registry: Optional[bool] = None
    manually_created: Optional[bool] = None
    pending_validation: Optional[bool] = None
    active: Optional[bool] = None

    phone: Optional[str] = Field(default=None, max_length=50)
    email: Optional[str] = Field(default=None, max_length=255)
    website: Optional[str] = Field(default=None, max_length=255)


class SchoolResponse(SchoolBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SchoolSearchResult(BaseModel):
    id: str
    inep_code: Optional[str] = None
    name: str
    city: Optional[str] = None
    state: Optional[str] = None
    administrative_dependency: Optional[str] = None
    official_registry: bool = True


class SchoolList(BaseModel):
    total: int
    items: list[SchoolResponse]
