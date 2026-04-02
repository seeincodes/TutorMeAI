"""Tests for tier-specific system prompts."""

import pytest

from app.agent.prompts import (
    TIER_PROMPTS,
    LEVEL_UP_SAFETY_RULES,
    get_level_up_system_prompt,
)
from app.agent.scenarios import load_scenarios


def test_tier_prompts_all_tiers_present():
    """TIER_PROMPTS has entries for tiers 1 through 4."""
    for tier in (1, 2, 3, 4):
        assert tier in TIER_PROMPTS
        assert len(TIER_PROMPTS[tier]) > 0


def test_tier_prompts_are_distinct():
    """Each tier has a different prompt."""
    prompts = list(TIER_PROMPTS.values())
    assert len(set(prompts)) == 4


def test_safety_rules_present():
    """LEVEL_UP_SAFETY_RULES contains key safety phrases."""
    assert "Never simulate real financial transactions" in LEVEL_UP_SAFETY_RULES
    assert "Never collect or reference personal financial information" in LEVEL_UP_SAFETY_RULES
    assert "Never give actual financial, medical, or legal advice" in LEVEL_UP_SAFETY_RULES
    assert "positive framing" in LEVEL_UP_SAFETY_RULES.lower()


def test_get_level_up_system_prompt_contains_tier():
    """Generated prompt includes tier guidelines."""
    prompt = get_level_up_system_prompt(1, "tier1_toy_shop")
    assert "Tier 1" in prompt
    assert "K-2" in prompt


def test_get_level_up_system_prompt_contains_safety():
    """Generated prompt includes safety rules."""
    prompt = get_level_up_system_prompt(2, "tier1_toy_shop")
    assert "Safety Rules" in prompt


def test_get_level_up_system_prompt_contains_scenario_context():
    """Generated prompt includes scenario details when scenario exists."""
    load_scenarios.cache_clear()
    prompt = get_level_up_system_prompt(1, "tier1_toy_shop")
    assert "Toy Shop Choices" in prompt
    assert "money" in prompt.lower()
    assert "Learning objectives" in prompt


def test_get_level_up_system_prompt_missing_scenario():
    """Prompt still works even if scenario_id doesn't match."""
    load_scenarios.cache_clear()
    prompt = get_level_up_system_prompt(3, "nonexistent_scenario")
    assert "Tier 3" in prompt
    assert "Safety Rules" in prompt
    # No scenario context section
    assert "Active Scenario" not in prompt


def test_get_level_up_system_prompt_fallback_tier():
    """Unknown tier falls back to tier 1 prompt."""
    prompt = get_level_up_system_prompt(99, "tier1_toy_shop")
    assert "K-2" in prompt
