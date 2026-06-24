from pydantic import BaseModel

class UserBase(BaseModel):
    name: str
    email: str

class UserResponse(UserBase):
    id: str

    class Config:
        from_attributes = True
