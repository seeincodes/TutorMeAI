import uuid

from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: uuid.UUID
    username: str
    display_name: str | None
    role: str
    grade: int | None = None
    allowed_levels: list[str] | None = None

    model_config = {"from_attributes": True}
