"""Scenario seed schema and loader for Level Up Life."""

import json
from functools import lru_cache
from pathlib import Path

from pydantic import BaseModel


class ChoiceTemplate(BaseModel):
    id: str
    label: str
    icon: str
    cost: int | None = None
    effect: str | None = None


class EventTemplate(BaseModel):
    description: str
    event_type: str
    choices: list[ChoiceTemplate] | None = None


class ScenarioSeed(BaseModel):
    id: str
    title: str
    tier: int
    domain: str
    icon: str
    learning_objectives: list[str]
    initial_state: dict
    events: list[EventTemplate]
    recap_template: str
    positive_framing_rules: list[str]
    ai_variation_allowed: list[str]
    max_turns: int


SCENARIO_SEEDS_DIR = Path(__file__).parent / "scenario_seeds"


@lru_cache(maxsize=1)
def load_scenarios() -> tuple[ScenarioSeed, ...]:
    """Load all scenario seeds from JSON files. Cached after first call."""
    scenarios: list[ScenarioSeed] = []
    if not SCENARIO_SEEDS_DIR.exists():
        return tuple()
    for json_file in sorted(SCENARIO_SEEDS_DIR.glob("*.json")):
        with open(json_file) as f:
            data = json.load(f)
        if isinstance(data, list):
            for item in data:
                scenarios.append(ScenarioSeed.model_validate(item))
        else:
            scenarios.append(ScenarioSeed.model_validate(data))
    return tuple(scenarios)


def get_scenarios_for_tier(tier: int, domain: str | None = None) -> list[ScenarioSeed]:
    """Filter loaded scenarios by tier and optionally by domain."""
    scenarios = load_scenarios()
    results = [s for s in scenarios if s.tier == tier]
    if domain is not None:
        results = [s for s in results if s.domain == domain]
    return results
