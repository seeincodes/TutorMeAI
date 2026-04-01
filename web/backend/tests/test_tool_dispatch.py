import pytest

from app.agent.graph import (
    build_openai_tools,
    register_tool_call,
    submit_tool_result,
    get_tool_result,
    cleanup_tool_call,
)


def test_build_openai_tools():
    """Tool definitions are built correctly from app schemas."""
    apps = [{
        "app_id": "chess",
        "name": "Chess",
        "description": "Play chess",
        "tool_schemas": [
            {
                "name": "new_game",
                "description": "Start a new game",
                "parameters": [
                    {"name": "color", "type": "string", "description": "Player color", "required": False}
                ],
            },
            {
                "name": "make_move",
                "description": "Make a move",
                "parameters": [
                    {"name": "from", "type": "string", "description": "From square", "required": True},
                    {"name": "to", "type": "string", "description": "To square", "required": True},
                ],
            },
        ],
    }]

    tools = build_openai_tools(apps, "chess")
    assert len(tools) == 2
    assert tools[0]["function"]["name"] == "chess__new_game"
    assert tools[1]["function"]["name"] == "chess__make_move"
    assert "from" in tools[1]["function"]["parameters"]["required"]
    assert "to" in tools[1]["function"]["parameters"]["required"]
    assert "color" not in tools[0]["function"]["parameters"]["required"]


def test_build_openai_tools_filters_by_app():
    """Only builds tools for the target app."""
    apps = [
        {"app_id": "chess", "name": "Chess", "description": "Play chess", "tool_schemas": [
            {"name": "new_game", "description": "Start", "parameters": []},
        ]},
        {"app_id": "calculator", "name": "Calculator", "description": "Math", "tool_schemas": [
            {"name": "calculate", "description": "Calc", "parameters": []},
        ]},
    ]

    chess_tools = build_openai_tools(apps, "chess")
    assert len(chess_tools) == 1
    assert chess_tools[0]["function"]["name"] == "chess__new_game"

    calc_tools = build_openai_tools(apps, "calculator")
    assert len(calc_tools) == 1
    assert calc_tools[0]["function"]["name"] == "calculator__calculate"


@pytest.mark.asyncio
async def test_tool_result_callback():
    """Tool result submission unblocks the waiting event."""
    import asyncio

    correlation_id = "test-123"
    event = register_tool_call(correlation_id)

    # Submit result in a separate task
    async def submit():
        await asyncio.sleep(0.1)
        submit_tool_result(correlation_id, {"result": "checkmate"})

    asyncio.create_task(submit())

    await asyncio.wait_for(event.wait(), timeout=2.0)
    result = get_tool_result(correlation_id)
    assert result == {"result": "checkmate"}
    cleanup_tool_call(correlation_id)


@pytest.mark.asyncio
async def test_tool_result_timeout():
    """Tool call times out if no result submitted."""
    import asyncio

    correlation_id = "test-timeout"
    event = register_tool_call(correlation_id)

    with pytest.raises(asyncio.TimeoutError):
        await asyncio.wait_for(event.wait(), timeout=0.1)

    cleanup_tool_call(correlation_id)
