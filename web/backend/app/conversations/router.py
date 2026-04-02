import json

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from app.agent.graph import classify_intent, stream_chat_with_tools, submit_tool_result
from app.auth.dependencies import get_current_user
from app.oauth.router import get_oauth_token
from app.conversations.schemas import (
    ConversationResponse,
    CreateConversationRequest,
    MessageResponse,
    SendMessageRequest,
)
from app.database import get_db, get_session_factory
from app.models import AppRegistration, Conversation, Message, User

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


@router.get("")
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ConversationResponse]:
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
    )
    conversations = result.scalars().all()
    return [ConversationResponse.model_validate(c) for c in conversations]


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_conversation(
    body: CreateConversationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ConversationResponse:
    conversation = Conversation(
        user_id=current_user.id,
        title=body.title or "New conversation",
    )
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)
    return ConversationResponse.model_validate(conversation)


@router.get("/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ConversationResponse:
    conversation = await _get_user_conversation(conversation_id, current_user, db)
    return ConversationResponse.model_validate(conversation)


@router.get("/{conversation_id}/messages")
async def get_messages(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[MessageResponse]:
    await _get_user_conversation(conversation_id, current_user, db)
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
    )
    messages = result.scalars().all()
    return [MessageResponse.model_validate(m) for m in messages]


@router.post("/{conversation_id}/messages")
async def send_message(
    conversation_id: str,
    body: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conversation = await _get_user_conversation(conversation_id, current_user, db)

    # Save user message
    user_msg = Message(
        conversation_id=conversation.id,
        role="user",
        content=body.content,
    )
    db.add(user_msg)
    await db.commit()

    # Load conversation history
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.asc())
    )
    history = [{"role": m.role, "content": m.content, "tool_call_id": m.tool_call_id} for m in result.scalars().all()]

    # Load available apps
    apps_result = await db.execute(
        select(AppRegistration).where(AppRegistration.is_active == True)  # noqa: E712
    )
    available_apps = [
        {
            "app_id": a.app_id,
            "name": a.name,
            "description": a.description,
            "tool_schemas": a.tool_schemas,
        }
        for a in apps_result.scalars().all()
    ]

    # Phase 1: Intent classification
    target_app_id = None
    if available_apps:
        try:
            target_app_id = await classify_intent(body.content, available_apps)
        except Exception:
            pass

    # Check if target app needs OAuth and user isn't connected
    oauth_needed = None
    if target_app_id:
        target_app = next((a for a in available_apps if a["app_id"] == target_app_id), None)
        if target_app:
            app_reg = await db.execute(
                select(AppRegistration).where(AppRegistration.app_id == target_app_id)
            )
            app_obj = app_reg.scalar_one_or_none()
            if app_obj and app_obj.auth_type == "oauth2":
                token = await get_oauth_token(str(current_user.id), target_app_id, db)
                if not token:
                    oauth_needed = target_app_id

    async def event_generator():
        full_response = ""

        # If OAuth is needed, send prompt and skip tool calls entirely
        if oauth_needed:
            yield {"event": "oauth_prompt", "data": json.dumps({
                "app_id": oauth_needed,
                "message": "Connect your Google Classroom account to access your courses and assignments.",
            })}
            connect_msg = "I can help with that! First, you'll need to connect your Google Classroom account. Click the button above to get started."
            yield {"event": "token", "data": json.dumps({"content": connect_msg})}
            # Save assistant message
            try:
                session_factory = get_session_factory()
                async with session_factory() as save_db:
                    assistant_msg = Message(
                        conversation_id=conversation.id,
                        role="assistant",
                        content=connect_msg,
                    )
                    save_db.add(assistant_msg)
                    await save_db.commit()
                    await save_db.refresh(assistant_msg)
                    yield {"event": "done", "data": json.dumps({"message_id": str(assistant_msg.id)})}
            except Exception:
                yield {"event": "done", "data": json.dumps({"message_id": ""})}
            return

        # Send intent classification result to frontend
        if target_app_id:
            yield {"event": "intent", "data": json.dumps({"app_id": target_app_id})}

        try:
            async for event in stream_chat_with_tools(history, available_apps, target_app_id):
                if event["type"] == "token":
                    full_response += event["content"]
                    yield {"event": "token", "data": json.dumps({"content": event["content"]})}

                elif event["type"] == "tool_call":
                    # Send tool call to frontend for iframe execution
                    yield {"event": "tool_call", "data": json.dumps({
                        "app_id": event["app_id"],
                        "tool": event["tool"],
                        "params": event["params"],
                        "correlation_id": event["correlation_id"],
                    })}

                elif event["type"] == "done":
                    full_response = event.get("full_content", full_response)

                elif event["type"] == "error":
                    yield {"event": "error", "data": json.dumps({"detail": event["detail"]})}
                    return

        except Exception as e:
            yield {"event": "error", "data": json.dumps({"detail": str(e)})}
            return

        # Save assistant message
        try:
            session_factory = get_session_factory()
            async with session_factory() as save_db:
                assistant_msg = Message(
                    conversation_id=conversation.id,
                    role="assistant",
                    content=full_response,
                )
                save_db.add(assistant_msg)
                await save_db.commit()
                await save_db.refresh(assistant_msg)
                yield {"event": "done", "data": json.dumps({"message_id": str(assistant_msg.id)})}
        except Exception:
            yield {"event": "done", "data": json.dumps({"message_id": ""})}

    return EventSourceResponse(event_generator())


class ToolResultRequest(BaseModel):
    correlation_id: str
    result: dict


@router.post("/{conversation_id}/tool-result")
async def post_tool_result(
    conversation_id: str,
    body: ToolResultRequest,
    current_user: User = Depends(get_current_user),
):
    """Frontend POSTs tool results here after iframe execution. Unblocks the SSE generator."""
    submit_tool_result(body.correlation_id, body.result)
    return {"status": "received"}


@router.post("/{conversation_id}/app-state")
async def save_app_state(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    body: dict = {},
):
    conversation = await _get_user_conversation(conversation_id, current_user, db)

    result = await db.execute(
        select(Message).where(
            Message.conversation_id == conversation.id,
            Message.role == "system",
            Message.tool_name == "app_state",
        )
    )
    existing = result.scalar_one_or_none()

    state_json = json.dumps(body)

    if existing:
        existing.content = state_json
    else:
        msg = Message(
            conversation_id=conversation.id,
            role="system",
            content=state_json,
            tool_name="app_state",
        )
        db.add(msg)

    await db.commit()
    return {"status": "saved"}


async def _get_user_conversation(
    conversation_id: str, user: User, db: AsyncSession
) -> Conversation:
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user.id,
        )
    )
    conversation = result.scalar_one_or_none()
    if conversation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return conversation
