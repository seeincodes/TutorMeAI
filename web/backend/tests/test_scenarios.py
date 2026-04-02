"""Tests for scenario seed schema and loader."""

import pytest

from app.agent.scenarios import (
    ChoiceTemplate,
    EventTemplate,
    ScenarioSeed,
    load_scenarios,
    get_scenarios_for_tier,
)


def test_load_scenarios_returns_tuple():
    """load_scenarios returns a non-empty tuple of ScenarioSeed."""
    # Clear cache so we get fresh results
    load_scenarios.cache_clear()
    scenarios = load_scenarios()
    assert isinstance(scenarios, tuple)
    assert len(scenarios) >= 2


def test_load_scenarios_cached():
    """Second call returns the exact same object (lru_cache)."""
    load_scenarios.cache_clear()
    first = load_scenarios()
    second = load_scenarios()
    assert first is second


def test_scenario_seed_fields():
    """Each loaded scenario has the expected fields and types."""
    load_scenarios.cache_clear()
    for s in load_scenarios():
        assert isinstance(s, ScenarioSeed)
        assert s.id
        assert s.title
        assert s.tier >= 1
        assert s.domain
        assert len(s.learning_objectives) > 0
        assert isinstance(s.initial_state, dict)
        assert len(s.events) > 0
        assert s.max_turns > 0
        for event in s.events:
            assert isinstance(event, EventTemplate)
            if event.choices:
                for c in event.choices:
                    assert isinstance(c, ChoiceTemplate)
                    assert c.id
                    assert c.label


def test_get_scenarios_for_tier():
    """Filtering by tier returns only matching scenarios."""
    load_scenarios.cache_clear()
    tier1 = get_scenarios_for_tier(1)
    assert len(tier1) >= 2
    for s in tier1:
        assert s.tier == 1

    # Tier 99 should return empty
    assert get_scenarios_for_tier(99) == []


def test_get_scenarios_for_tier_with_domain():
    """Filtering by tier and domain narrows results."""
    load_scenarios.cache_clear()
    money = get_scenarios_for_tier(1, domain="money")
    assert len(money) >= 2
    for s in money:
        assert s.tier == 1
        assert s.domain == "money"

    # Non-existent domain
    assert get_scenarios_for_tier(1, domain="quantum_physics") == []
