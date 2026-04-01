from typing import AsyncGenerator

from langchain_core.messages import AIMessage, AIMessageChunk, HumanMessage, SystemMessage
from langchain_core.tools import StructuredTool
from langchain_openai import ChatOpenAI

from app.agent.prompts import K12_SYSTEM_PROMPT, INTENT_CLASSIFICATION_PROMPT
from app.config import settings


def _build_llm(streaming: bool = True) -> ChatOpenAI:
    return ChatOpenAI(
        model="gpt-4.1-mini",
        api_key=settings.openai_api_key,
        streaming=streaming,
    )


def build_tools_from_schemas(app_schemas: list[dict]) -> list[StructuredTool]:
    """Convert registered app tool schemas into LangChain tools for the LLM."""
    tools = []
    for app in app_schemas:
        app_id = app["app_id"]
        for ts in app.get("tool_schemas", []):
            # Build parameter schema from tool definition
            properties = {}
            required = []
            for param in ts.get("parameters", []):
                properties[param["name"]] = {
                    "type": param.get("type", "string"),
                    "description": param.get("description", ""),
                }
                if param.get("required", True):
                    required.append(param["name"])

            tool = StructuredTool.from_function(
                func=lambda **kwargs: kwargs,  # Placeholder — actual execution happens via postMessage
                name=f"{app_id}__{ts['name']}",
                description=f"[{app['name']}] {ts['description']}",
                args_schema=None,
            )
            tools.append(tool)
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

    # Match against known app IDs
    for app in available_apps:
        if app["app_id"].lower() in result:
            return app["app_id"]

    if "none" in result:
        return None

    return None


async def stream_chat_response(
    messages: list[dict],
    available_apps: list[dict] | None = None,
    target_app_id: str | None = None,
) -> AsyncGenerator[str, None]:
    """Stream LLM response tokens. If target_app_id is set, inject that app's tool schemas."""
    llm = _build_llm(streaming=True)

    # Build system prompt with app context
    system_content = K12_SYSTEM_PROMPT
    if available_apps:
        app_list = ", ".join(a["name"] for a in available_apps)
        system_content += f"\n\nAvailable apps: {app_list}"

        if target_app_id:
            target_app = next((a for a in available_apps if a["app_id"] == target_app_id), None)
            if target_app:
                tool_names = [ts["name"] for ts in target_app.get("tool_schemas", [])]
                system_content += (
                    f"\n\nActive app: {target_app['name']} ({target_app_id})"
                    f"\nAvailable tools: {', '.join(tool_names)}"
                    f"\nWhen the user wants to use this app, describe what you would do with the tools."
                )

    langchain_messages = [SystemMessage(content=system_content)]
    for msg in messages:
        if msg["role"] == "user":
            langchain_messages.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "assistant":
            langchain_messages.append(AIMessage(content=msg["content"] or ""))

    async for chunk in llm.astream(langchain_messages):
        if isinstance(chunk, AIMessageChunk) and chunk.content:
            yield chunk.content
