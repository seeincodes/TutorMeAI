import pytest

from app.agent.graph import (
    build_openai_tools,
    register_tool_call,
    submit_tool_result,
    get_tool_result,
    cleanup_tool_call,
    get_allowed_tools_for_tier,
    TIER_ALLOWED_TOOLS,
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


# ---------------------------------------------------------------------------
# Age-tier tool gating tests
# ---------------------------------------------------------------------------


def test_tier_allowed_tools_all_tiers_defined():
    """TIER_ALLOWED_TOOLS has entries for tiers 1-4."""
    for tier in (1, 2, 3, 4):
        assert tier in TIER_ALLOWED_TOOLS
        assert len(TIER_ALLOWED_TOOLS[tier]) > 0


def test_get_allowed_tools_tier1():
    """Tier 1 only has life_skills tools."""
    tools = get_allowed_tools_for_tier(1)
    assert "life_skills__start_scenario" in tools
    assert "life_skills__make_choice" in tools
    assert "life_skills__get_recap" in tools
    assert "calculator__calculate" not in tools


def test_get_allowed_tools_tier2():
    """Tier 2 adds calculator to life_skills tools."""
    tools = get_allowed_tools_for_tier(2)
    assert "life_skills__start_scenario" in tools
    assert "calculator__calculate" in tools
    assert "dictionary__lookup" not in tools


def test_get_allowed_tools_tier3():
    """Tier 3 adds dictionary to tier 2 tools."""
    tools = get_allowed_tools_for_tier(3)
    assert "calculator__calculate" in tools
    assert "dictionary__lookup" in tools
    assert "weather__get_forecast" not in tools


def test_get_allowed_tools_tier4():
    """Tier 4 has the most tools including weather."""
    tools = get_allowed_tools_for_tier(4)
    assert "calculator__calculate" in tools
    assert "dictionary__lookup" in tools
    assert "weather__get_forecast" in tools


def test_get_allowed_tools_unknown_tier_defaults():
    """Unknown tier defaults to tier 1 tools."""
    tools = get_allowed_tools_for_tier(99)
    assert tools == get_allowed_tools_for_tier(1)


def test_tiers_are_progressive():
    """Each tier includes at least all tools from the previous tier."""
    for tier in (2, 3, 4):
        prev_tools = set(get_allowed_tools_for_tier(tier - 1))
        curr_tools = set(get_allowed_tools_for_tier(tier))
        assert prev_tools.issubset(curr_tools), f"Tier {tier} missing tools from tier {tier - 1}"
