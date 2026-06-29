from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    organization_id: str
    school_id: str

    full_name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr

    phone: Optional[str] = Field(default=None, max_length=30)
    avatar_url: Optional[str] = Field(default=None, max_length=500)

    role: str = Field(default="teacher", max_length=50)

    auth_provider: str = Field(default="supabase", max_length=50)
    auth_provider_id: Optional[str] = Field(default=None, max_length=255)

    active: bool = True
    email_verified: bool = False


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=30)
    avatar_url: Optional[str] = Field(default=None, max_length=500)
    role: Optional[str] = Field(default=None, max_length=50)
    active: Optional[bool] = None


class UserResponse(UserBase):
    id: str

    last_login: Optional[datetime] = None

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserList(BaseModel):
    total: int
    items: list[UserResponse]
