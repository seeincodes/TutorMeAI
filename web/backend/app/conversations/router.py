import json

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from app.agent.content_filter import ContentBuffer
from app.agent.graph import classify_intent, stream_chat_with_tools, submit_tool_result
from app.agent.input_sanitizer import sanitize_student_input, is_safe_for_llm
from app.agent.prompts import get_level_up_system_prompt
from app.agent.scenarios import get_scenarios_for_tier, load_scenarios
from app.auth.dependencies import get_current_user
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

    async def event_generator():
        full_response = ""

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


class LevelUpLifeAction(BaseModel):
    action_type: str  # "scenario_selected" | "choice_made" | "slider_changed"
    scenario_id: str | None = None
    choice_id: str | None = None
    tier: int | None = None  # ignored — derived server-side
    value: float | None = None
    correlation_id: str | None = None
    field: str | None = None


@router.post("/{conversation_id}/level-up-life")
async def level_up_life_action(
    conversation_id: str,
    body: LevelUpLifeAction,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Dedicated endpoint for Level Up Life simulation actions.

    Derives tier server-side from the user profile. Streams SSE events
    including scenario_event, scenario_end, state_update, and tutor
    narration tokens filtered through ContentBuffer.
    """
    conversation = await _get_user_conversation(conversation_id, current_user, db)

    # Derive tier server-side — never trust the client
    tier = current_user.age_tier

    # Validate action_type
    if body.action_type not in ("scenario_selected", "choice_made", "slider_changed"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid action_type: {body.action_type}",
        )

    # Sanitize any text fields that might carry student input
    flags: list[str] = []
    if body.choice_id:
        sanitized, f = sanitize_student_input(body.choice_id)
        body.choice_id = sanitized
        flags.extend(f)
    if body.field:
        sanitized, f = sanitize_student_input(body.field)
        body.field = sanitized
        flags.extend(f)

    # Safety check
    for text_val in [body.choice_id, body.field, body.scenario_id]:
        if text_val and not is_safe_for_llm(text_val):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message contains inappropriate content.",
            )

    # Load scenario seed for scenario_selected
    scenario_seed = None
    if body.action_type == "scenario_selected" and body.scenario_id:
        scenarios = load_scenarios()
        scenario_seed = next((s for s in scenarios if s.id == body.scenario_id), None)
        if scenario_seed is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Scenario '{body.scenario_id}' not found",
            )

    # Load conversation history
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.asc())
    )
    history = [
        {"role": m.role, "content": m.content, "tool_call_id": m.tool_call_id}
        for m in result.scalars().all()
    ]

    async def event_generator():
        from langchain_core.messages import HumanMessage, SystemMessage, AIMessageChunk
        from langchain_openai import ChatOpenAI
        from app.config import settings

        content_buffer = ContentBuffer(tier=tier)

        # Build system prompt for this scenario session
        scenario_id = body.scenario_id or ""
        system_prompt = get_level_up_system_prompt(tier, scenario_id)

        # Build the user-facing action description for the LLM
        if body.action_type == "scenario_selected" and scenario_seed:
            user_action = (
                f"The student selected scenario: '{scenario_seed.title}' "
                f"(domain: {scenario_seed.domain}). "
                f"Initial state: {json.dumps(scenario_seed.initial_state)}. "
                f"Begin the scenario with an engaging opening and present the first decision point."
            )
            # Send scenario_event with initial scenario info
            yield {
                "event": "scenario_event",
                "data": json.dumps({
                    "scenarioId": scenario_seed.id,
                    "title": scenario_seed.title,
                    "domain": scenario_seed.domain,
                    "tier": tier,
                    "stepIndex": 0,
                    "prompt": scenario_seed.events[0].description if scenario_seed.events else "",
                    "choices": [
                        {"id": c.id, "label": c.label}
                        for c in (scenario_seed.events[0].choices or [])
                    ] if scenario_seed.events else [],
                }),
            }
        elif body.action_type == "choice_made":
            user_action = (
                f"The student chose option '{body.choice_id}'. "
                f"Continue the scenario with consequences and the next decision point."
            )
        elif body.action_type == "slider_changed":
            user_action = (
                f"The student adjusted '{body.field}' to value {body.value}. "
                f"Acknowledge the adjustment and continue."
            )
            # For slider changes, just acknowledge — no full narration needed
            yield {
                "event": "state_update",
                "data": json.dumps({
                    "field": body.field,
                    "value": body.value,
                }),
            }
        else:
            user_action = "Continue the scenario."

        # Build LLM messages
        langchain_messages = [SystemMessage(content=system_prompt)]
        for msg in history:
            if msg["role"] == "user":
                langchain_messages.append(HumanMessage(content=msg["content"] or ""))
        langchain_messages.append(HumanMessage(content=user_action))

        # Stream LLM narration through ContentBuffer
        llm = ChatOpenAI(
            model="gpt-4.1-mini",
            api_key=settings.openai_api_key,
            streaming=True,
        )

        full_response = ""
        try:
            async for chunk in llm.astream(langchain_messages):
                if isinstance(chunk, AIMessageChunk) and chunk.content:
                    ready = content_buffer.add(chunk.content)
                    if ready:
                        safe_text, _was_filtered = ready
                        full_response += safe_text
                        yield {
                            "event": "token",
                            "data": json.dumps({"content": safe_text}),
                        }

            # Flush remaining buffer
            remainder = content_buffer.flush()
            if remainder:
                safe_text, _was_filtered = remainder
                full_response += safe_text
                yield {
                    "event": "token",
                    "data": json.dumps({"content": safe_text}),
                }
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

                # Also save the user action as a user message for history
                user_msg = Message(
                    conversation_id=conversation.id,
                    role="user",
                    content=f"[Level Up Life action: {body.action_type}]",
                )
                save_db.add(user_msg)

                await save_db.commit()
                await save_db.refresh(assistant_msg)
                yield {
                    "event": "done",
                    "data": json.dumps({"message_id": str(assistant_msg.id)}),
                }
        except Exception:
            yield {"event": "done", "data": json.dumps({"message_id": ""})}

    return EventSourceResponse(event_generator())


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
