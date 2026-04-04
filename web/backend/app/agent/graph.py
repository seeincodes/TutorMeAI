import asyncio
import json
from typing import AsyncGenerator

from langchain_core.messages import AIMessage, AIMessageChunk, HumanMessage, SystemMessage, ToolMessage
from langchain_openai import ChatOpenAI

from app.agent.prompts import K12_SYSTEM_PROMPT, INTENT_CLASSIFICATION_PROMPT
from app.config import settings


def _build_llm(streaming: bool = True) -> ChatOpenAI:
    return ChatOpenAI(
        model="gpt-4.1-mini",
        api_key=settings.openai_api_key,
        streaming=streaming,
    )


def build_openai_tools(app_schemas: list[dict], target_app_id: str | None = None) -> list[dict]:
    """Build OpenAI function-calling tool definitions from app schemas."""
    tools = []
    for app in app_schemas:
        if target_app_id and app["app_id"] != target_app_id:
            continue
        app_id = app["app_id"]
        for ts in app.get("tool_schemas", []):
            properties = {}
            required = []
            for param in ts.get("parameters", []):
                prop_type = param.get("type", "string")
                # Map non-standard types to JSON schema
                if prop_type in ("number", "integer"):
                    json_type = "number"
                elif prop_type == "array":
                    json_type = "array"
                elif prop_type == "object":
                    json_type = "object"
                else:
                    json_type = "string"

                properties[param["name"]] = {
                    "type": json_type,
                    "description": param.get("description", ""),
                }
                if param.get("required", True):
                    required.append(param["name"])

            tool_def = {
                "type": "function",
                "function": {
                    "name": f"{app_id}__{ts['name']}",
                    "description": f"[{app['name']}] {ts['description']}",
                    "parameters": {
                        "type": "object",
                        "properties": properties,
                        "required": required,
                    },
                },
            }
            tools.append(tool_def)
    return tools


async def classify_intent(
    user_message: str,
    available_apps: list[dict],
) -> str | None:
    """Phase 1: Lightweight intent classification. Returns app_id or None."""
    if not available_apps:
        return None

    app_descriptions = "\n".join(
        f"- {app['app_id']}: {app['name']} — {app['description']}"
        for app in available_apps
    )

    llm = _build_llm(streaming=False)
    response = await llm.ainvoke([
        SystemMessage(content=INTENT_CLASSIFICATION_PROMPT.format(app_descriptions=app_descriptions)),
        HumanMessage(content=user_message),
    ])

    result = response.content.strip().lower()
    for app in available_apps:
        if app["app_id"].lower() in result:
            return app["app_id"]
    return None


# --- Tool result callback mechanism ---
# When the LLM makes a tool call, the backend yields a tool_call SSE event and waits.
# The frontend executes it on the iframe and POSTs the result back.
# This dict holds asyncio Events keyed by correlation_id.
_tool_result_store: dict[str, asyncio.Event] = {}
_tool_result_data: dict[str, dict] = {}


def register_tool_call(correlation_id: str) -> asyncio.Event:
    """Register a pending tool call. Returns an Event to await."""
    event = asyncio.Event()
    _tool_result_store[correlation_id] = event
    return event


def submit_tool_result(correlation_id: str, result: dict):
    """Submit a tool result from the frontend. Unblocks the waiting generator."""
    _tool_result_data[correlation_id] = result
    event = _tool_result_store.get(correlation_id)
    if event:
        event.set()


def get_tool_result(correlation_id: str) -> dict | None:
    """Get the tool result after the event fires."""
    return _tool_result_data.pop(correlation_id, None)


def cleanup_tool_call(correlation_id: str):
    """Clean up after a tool call completes or times out."""
    _tool_result_store.pop(correlation_id, None)
    _tool_result_data.pop(correlation_id, None)


async def stream_chat_with_tools(
    messages: list[dict],
    available_apps: list[dict] | None = None,
    target_app_id: str | None = None,
    student_grade: int | None = None,
) -> AsyncGenerator[dict, None]:
    """
    Stream LLM response with real tool calling.

    Yields dicts with type:
    - {"type": "token", "content": "..."}
    - {"type": "tool_call", "app_id": "...", "tool": "...", "params": {...}, "correlation_id": "..."}
    - {"type": "tool_result_text", "content": "..."} — LLM's response after getting tool result
    - {"type": "done"}
    - {"type": "error", "detail": "..."}
    """
    llm = _build_llm(streaming=True)

    # Build tools for function calling
    tools = []
    if available_apps and target_app_id:
        tools = build_openai_tools(available_apps, target_app_id)

    if tools:
        llm = llm.bind_tools(tools)

    # Build system prompt
    system_content = K12_SYSTEM_PROMPT
    if available_apps:
        app_list = ", ".join(a["name"] for a in available_apps)
        system_content += f"\n\nAvailable apps: {app_list}"
        if target_app_id:
            target_app = next((a for a in available_apps if a["app_id"] == target_app_id), None)
            if target_app:
                system_content += f"\n\nActive app: {target_app['name']} ({target_app_id}). Use the available tools to interact with this app when the user wants to use it."

    # Grade-aware explanation style
    if student_grade is not None:
        if student_grade <= 2:
            system_content += "\n\n## Student Level: Grades K-2 (ages 5-8)\n- Use very simple words and short sentences.\n- Explain with real-world examples kids know (fingers, toys, snacks).\n- After giving an answer, ALWAYS explain HOW to get it step by step.\n- Use encouraging language: 'Great question!', 'You can do this!'\n- For math: show counting, use pictures/emojis if helpful."
        elif student_grade <= 5:
            system_content += "\n\n## Student Level: Grades 3-5 (ages 8-11)\n- Use age-appropriate vocabulary, explain new words briefly.\n- After giving an answer, explain the method so the student learns.\n- For math: show the steps and name the operation (addition, multiplication, etc.).\n- Ask follow-up questions to check understanding: 'Does that make sense?'"
        elif student_grade <= 8:
            system_content += "\n\n## Student Level: Grades 6-8 (ages 11-14)\n- Use grade-level vocabulary and introduce proper terminology.\n- Explain the reasoning, not just the answer.\n- For math: reference formulas and properties by name.\n- Encourage the student to try solving similar problems on their own."
        else:
            system_content += "\n\n## Student Level: Grades 9-12 (ages 14-18)\n- Use mature vocabulary and proper academic terminology.\n- Provide thorough explanations with underlying concepts.\n- For math: reference theorems, show algebraic reasoning.\n- Challenge the student to think deeper: 'Why do you think this works?'"

    langchain_messages = [SystemMessage(content=system_content)]
    for msg in messages:
        if msg["role"] == "user":
            langchain_messages.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "assistant":
            langchain_messages.append(AIMessage(content=msg["content"] or ""))
        elif msg["role"] == "tool":
            langchain_messages.append(ToolMessage(
                content=msg["content"] or "",
                tool_call_id=msg.get("tool_call_id", ""),
            ))

    # Stream the LLM response
    full_content = ""
    tool_calls_accumulated: list[dict] = []

    async for chunk in llm.astream(langchain_messages):
        if isinstance(chunk, AIMessageChunk):
            # Text content
            if chunk.content:
                full_content += chunk.content
                yield {"type": "token", "content": chunk.content}

            # Tool calls (accumulated across chunks)
            if chunk.tool_call_chunks:
                for tc_chunk in chunk.tool_call_chunks:
                    # Find or create the tool call entry
                    idx = tc_chunk.get("index", 0)
                    while len(tool_calls_accumulated) <= idx:
                        tool_calls_accumulated.append({"id": "", "name": "", "args": ""})
                    tc = tool_calls_accumulated[idx]
                    if tc_chunk.get("id"):
                        tc["id"] = tc_chunk["id"]
                    if tc_chunk.get("name"):
                        tc["name"] = tc_chunk["name"]
                    if tc_chunk.get("args"):
                        tc["args"] += tc_chunk["args"]

    # If the LLM made tool calls, process them
    if tool_calls_accumulated and tool_calls_accumulated[0]["name"]:
        for tc in tool_calls_accumulated:
            if not tc["name"]:
                continue

            # Parse app_id and tool name from "app_id__tool_name" format
            parts = tc["name"].split("__", 1)
            if len(parts) != 2:
                continue
            app_id, tool_name = parts

            # Parse args
            try:
                params = json.loads(tc["args"]) if tc["args"] else {}
            except json.JSONDecodeError:
                params = {}

            import uuid
            correlation_id = str(uuid.uuid4())

            # Yield tool_call event for frontend to execute
            yield {
                "type": "tool_call",
                "app_id": app_id,
                "tool": tool_name,
                "params": params,
                "correlation_id": correlation_id,
                "tool_call_id": tc["id"],
            }

            # Wait for frontend to POST the result back (with timeout)
            event = register_tool_call(correlation_id)
            try:
                await asyncio.wait_for(event.wait(), timeout=30.0)
                result = get_tool_result(correlation_id)
            except asyncio.TimeoutError:
                result = {"error": "Tool execution timed out"}
            finally:
                cleanup_tool_call(correlation_id)

            # Add the tool call and result to messages, then get LLM's follow-up
            tool_result_str = json.dumps(result) if result else '{"status": "completed"}'

            langchain_messages.append(AIMessage(
                content=full_content,
                tool_calls=[{"id": tc["id"], "name": tc["name"], "args": params}],
            ))
            langchain_messages.append(ToolMessage(
                content=f"[TOOL_RESULT_START]{tool_result_str}[TOOL_RESULT_END]",
                tool_call_id=tc["id"],
            ))

            # Stream the LLM's follow-up response after seeing the tool result
            full_content = ""
            async for follow_chunk in llm.astream(langchain_messages):
                if isinstance(follow_chunk, AIMessageChunk) and follow_chunk.content:
                    full_content += follow_chunk.content
                    yield {"type": "token", "content": follow_chunk.content}

    yield {"type": "done", "full_content": full_content}


# ---------------------------------------------------------------------------
# Level Up Life — age-tier tool gating
# ---------------------------------------------------------------------------

TIER_ALLOWED_TOOLS: dict[int, list[str]] = {
    1: ["life_skills__start_scenario", "life_skills__make_choice", "life_skills__get_recap"],
    2: [
        "life_skills__start_scenario", "life_skills__make_choice", "life_skills__get_recap",
        "calculator__calculate",
        "google-classroom__list_courses", "google-classroom__list_assignments", "google-classroom__get_assignment",
    ],
    3: [
        "life_skills__start_scenario", "life_skills__make_choice", "life_skills__get_recap",
        "calculator__calculate", "dictionary__lookup",
        "google-classroom__list_courses", "google-classroom__list_assignments", "google-classroom__get_assignment",
    ],
    4: [
        "life_skills__start_scenario", "life_skills__make_choice", "life_skills__get_recap",
        "calculator__calculate", "dictionary__lookup", "weather__get_forecast",
        "google-classroom__list_courses", "google-classroom__list_assignments", "google-classroom__get_assignment",
        "google-classroom__list_submissions", "google-classroom__create_assignment",
    ],
}


def get_allowed_tools_for_tier(tier: int) -> list[str]:
    """Return the list of tool names a student at the given tier may use."""
    return TIER_ALLOWED_TOOLS.get(tier, TIER_ALLOWED_TOOLS[1])
