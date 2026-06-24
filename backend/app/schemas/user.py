from pydantic import BaseModel

class UserBase(BaseModel):
    name: str
    email: str

class UserResponse(UserBase):
    id: str
