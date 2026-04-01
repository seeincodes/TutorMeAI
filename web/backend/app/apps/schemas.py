from pydantic import BaseModel


class ToolParameterSchema(BaseModel):
    name: str
    type: str
    description: str
    required: bool = True


class ToolSchema(BaseModel):
    name: str
    description: str
    parameters: list[ToolParameterSchema] = []


class RegisterAppRequest(BaseModel):
    app_id: str
    name: str
    description: str
    auth_type: str = "none"
    iframe_url: str
    tool_schemas: list[ToolSchema]
    age_rating: str = "all"


class UpdateAppStatusRequest(BaseModel):
    is_active: bool | None = None
    status: str | None = None


class AppResponse(BaseModel):
    id: str
    app_id: str
    name: str
    description: str
    auth_type: str
    iframe_url: str
    tool_schemas: list[dict]
    status: str
    age_rating: str
    is_active: bool

    model_config = {"from_attributes": True}


class InvokeToolRequest(BaseModel):
    tool: str
    params: dict = {}
    correlation_id: str | None = None
    conversation_id: str | None = None
