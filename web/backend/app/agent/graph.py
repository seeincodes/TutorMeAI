from typing import AsyncGenerator

from langchain_core.messages import AIMessageChunk, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import MessagesState, StateGraph, START, END

from app.agent.prompts import K12_SYSTEM_PROMPT
from app.config import settings


def build_chat_graph():
    llm = ChatOpenAI(
        model="gpt-4.1-mini",
        api_key=settings.openai_api_key,
        streaming=True,
    )

    async def chat_node(state: MessagesState):
        messages = [SystemMessage(content=K12_SYSTEM_PROMPT)] + state["messages"]
        response = await llm.ainvoke(messages)
        return {"messages": [response]}

    graph = StateGraph(MessagesState)
    graph.add_node("chat", chat_node)
    graph.add_edge(START, "chat")
    graph.add_edge("chat", END)

    return graph.compile()


async def stream_chat_response(
    messages: list[dict],
    openai_api_key: str | None = None,
) -> AsyncGenerator[str, None]:
    """Stream LLM response tokens as SSE-formatted strings."""
    llm = ChatOpenAI(
        model="gpt-4.1-mini",
        api_key=openai_api_key or settings.openai_api_key,
        streaming=True,
    )

    langchain_messages = [SystemMessage(content=K12_SYSTEM_PROMPT)]
    for msg in messages:
        if msg["role"] == "user":
            langchain_messages.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "assistant":
            from langchain_core.messages import AIMessage
            langchain_messages.append(AIMessage(content=msg["content"] or ""))

    async for chunk in llm.astream(langchain_messages):
        if isinstance(chunk, AIMessageChunk) and chunk.content:
            yield chunk.content
