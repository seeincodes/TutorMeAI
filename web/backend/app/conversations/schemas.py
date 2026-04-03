import uuid
from datetime import datetime

from pydantic import BaseModel


class CreateConversationRequest(BaseModel):
    title: str | None = None


class ConversationResponse(BaseModel):
    id: uuid.UUID
    title: str | None
    active_app_id: str | None
    starred: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UpdateConversationRequest(BaseModel):
    title: str | None = None
    starred: bool | None = None


class MessageResponse(BaseModel):
    id: uuid.UUID
    role: str
    content: str | None
    tool_call_id: str | None
    tool_name: str | None
    metadata_: dict | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class SendMessageRequest(BaseModel):
    content: str
