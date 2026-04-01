# Level Up Life Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Life Skills Toolkit (3 form-based calculators) into Level Up Life — a four-tier, four-domain interactive simulation engine driven by the AI tutor.

**Architecture:** Five phases in dependency order: (1) PostMessage protocol upgrade, (2) Backend age-tier gating + scenario engine, (3) Iframe component rebuild, (4) Platform integration, (5) Scenario seed content. Each phase produces working, testable software.

**Tech Stack:** React 18 + TypeScript (iframe app), Python FastAPI + LangGraph (backend agent), PostgreSQL + SQLAlchemy + Alembic (data), Vite (build), pnpm (packages)

**Spec:** `docs/superpowers/specs/2026-04-01-level-up-life-design.md`

---

## Phase 1: PostMessage Protocol Upgrade

### Task 1: Extend PostMessage Types

**Files:**
- Modify: `web/frontend/src/lib/postMessage.ts`
- Test: `web/frontend/src/lib/__tests__/postMessage.test.ts`

- [ ] **Step 1: Create test file for new message types**

```typescript
// web/frontend/src/lib/__tests__/postMessage.test.ts
import { describe, it, expect } from 'vitest'
import {
  isPlatformMessage,
  isAppMessage,
  isLevelUpPlatformMessage,
  isLevelUpAppMessage,
} from '../postMessage'

describe('isLevelUpPlatformMessage', () => {
  it('validates scenario_start message', () => {
    const msg = {
      type: 'scenario_start',
      correlationId: 'abc-123',
      tier: 1,
      scenarios: [{ id: 's1', title: 'Test', domain: 'money', icon: 'coin', description: 'A test' }],
    }
    expect(isLevelUpPlatformMessage(msg)).toBe(true)
  })

  it('validates scenario_event message', () => {
    const msg = {
      type: 'scenario_event',
      correlationId: 'abc-123',
      eventType: 'choice',
      description: 'Pick one',
      visualUpdate: { scene: 'shop', balance: 5 },
    }
    expect(isLevelUpPlatformMessage(msg)).toBe(true)
  })

  it('validates state_update message', () => {
    const msg = { type: 'state_update', correlationId: 'abc-123', balance: 10 }
    expect(isLevelUpPlatformMessage(msg)).toBe(true)
  })

  it('validates scenario_end message', () => {
    const msg = {
      type: 'scenario_end',
      correlationId: 'abc-123',
      summary: {
        domain: 'money',
        scenarioTitle: 'Test',
        decisions: [],
        takeaway: 'Good job!',
        illustration: 'recap_shop',
      },
    }
    expect(isLevelUpPlatformMessage(msg)).toBe(true)
  })

  it('rejects invalid messages', () => {
    expect(isLevelUpPlatformMessage({ type: 'invalid' })).toBe(false)
    expect(isLevelUpPlatformMessage(null)).toBe(false)
    expect(isLevelUpPlatformMessage({})).toBe(false)
  })
})

describe('isLevelUpAppMessage', () => {
  it('validates scenario_selected message', () => {
    const msg = { type: 'scenario_selected', scenarioId: 's1', tier: 1 }
    expect(isLevelUpAppMessage(msg)).toBe(true)
  })

  it('validates choice_made message', () => {
    const msg = { type: 'choice_made', correlationId: 'abc-123', choiceId: 'c1' }
    expect(isLevelUpAppMessage(msg)).toBe(true)
  })

  it('validates slider_changed message', () => {
    const msg = { type: 'slider_changed', correlationId: 'abc-123', field: 'amount', value: 50 }
    expect(isLevelUpAppMessage(msg)).toBe(true)
  })

  it('still validates legacy app messages', () => {
    const msg = { type: 'ui_ready' }
    expect(isAppMessage(msg)).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web/frontend && pnpm vitest run src/lib/__tests__/postMessage.test.ts`
Expected: FAIL — `isLevelUpPlatformMessage` and `isLevelUpAppMessage` not exported

- [ ] **Step 3: Add Level Up Life message types to postMessage.ts**

```typescript
// Append to web/frontend/src/lib/postMessage.ts

// --- Level Up Life Protocol ---

export type Domain = 'money' | 'time' | 'health' | 'social' | 'combo'
export type Tier = 1 | 2 | 3 | 4

export interface ScenarioInfo {
  id: string
  title: string
  domain: Domain
  icon: string
  description: string
}

export interface ChoiceOption {
  id: string
  label: string
  icon: string
  cost?: number
  effect?: string
}

export interface VisualUpdate {
  scene: string
  balance?: number
  items?: string[]
  progress?: number
  animationCue?: string
}

export interface DecisionRecord {
  turn: number
  choice: string
  outcome: string
}

// Platform → Level Up Life iframe
export interface ScenarioStartMessage {
  type: 'scenario_start'
  correlationId: string
  tier: Tier
  scenarios: ScenarioInfo[]
}

export interface ScenarioEventMessage {
  type: 'scenario_event'
  correlationId: string
  eventType: 'choice' | 'info' | 'surprise'
  description: string
  choices?: ChoiceOption[]
  visualUpdate: VisualUpdate
}

export interface LevelUpStateUpdate {
  type: 'state_update'
  correlationId: string
  balance?: number
  items?: string[]
  progress?: number
  visualCue?: string
}

export interface ScenarioEndMessage {
  type: 'scenario_end'
  correlationId: string
  summary: {
    domain: string
    scenarioTitle: string
    decisions: DecisionRecord[]
    takeaway: string
    illustration: string
  }
}

export type LevelUpPlatformMessage =
  | ScenarioStartMessage
  | ScenarioEventMessage
  | LevelUpStateUpdate
  | ScenarioEndMessage

// Level Up Life iframe → Platform
export interface ScenarioSelectedMessage {
  type: 'scenario_selected'
  scenarioId: string
  tier: Tier
}

export interface ChoiceMadeMessage {
  type: 'choice_made'
  correlationId: string
  choiceId: string
  value?: number
  context?: string
}

export interface SliderChangedMessage {
  type: 'slider_changed'
  correlationId: string
  field: string
  value: number
}

export type LevelUpAppMessage =
  | ScenarioSelectedMessage
  | ChoiceMadeMessage
  | SliderChangedMessage

const LEVEL_UP_PLATFORM_TYPES = ['scenario_start', 'scenario_event', 'state_update', 'scenario_end']
const LEVEL_UP_APP_TYPES = ['scenario_selected', 'choice_made', 'slider_changed']

export function isLevelUpPlatformMessage(msg: unknown): msg is LevelUpPlatformMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    typeof (msg as { type: string }).type === 'string' &&
    LEVEL_UP_PLATFORM_TYPES.includes((msg as { type: string }).type)
  )
}

export function isLevelUpAppMessage(msg: unknown): msg is LevelUpAppMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    typeof (msg as { type: string }).type === 'string' &&
    LEVEL_UP_APP_TYPES.includes((msg as { type: string }).type)
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web/frontend && pnpm vitest run src/lib/__tests__/postMessage.test.ts`
Expected: PASS — all assertions pass

- [ ] **Step 5: Commit**

```bash
git add web/frontend/src/lib/postMessage.ts web/frontend/src/lib/__tests__/postMessage.test.ts
git commit -m "feat(protocol): add Level Up Life PostMessage types"
```

---

## Phase 2: Backend — Age-Tier Gating & Scenario Engine

### Task 2: Add capability_tier_override to User Model

**Files:**
- Modify: `web/backend/app/models.py:20-38`
- Create: `web/backend/alembic/versions/xxxx_add_capability_tier_override.py`
- Test: `web/backend/tests/test_models.py`

- [ ] **Step 1: Write failing test**

```python
# web/backend/tests/test_models.py
import pytest
from app.models import User

def test_user_has_capability_tier_override():
    user = User(
        username="test_tier",
        password_hash="fake",
        role="student",
        grade=8,
        capability_tier_override=3,
    )
    assert user.capability_tier_override == 3

def test_user_capability_tier_override_defaults_none():
    user = User(username="test_no_tier", password_hash="fake", role="student")
    assert user.capability_tier_override is None

def test_get_age_tier_from_grade():
    """grade → default tier: K-1 (5-6)=1, 2-4 (7-9)=2, 5-6 (10-11)=3, 7+ (12+)=4"""
    # Tier 1: grades K-1 (grade 0-1)
    u1 = User(username="t1", password_hash="x", role="student", grade=1)
    assert u1.age_tier == 1

    # Tier 2: grades 2-4
    u2 = User(username="t2", password_hash="x", role="student", grade=3)
    assert u2.age_tier == 2

    # Tier 3: grades 5-6
    u3 = User(username="t3", password_hash="x", role="student", grade=5)
    assert u3.age_tier == 3

    # Tier 4: grades 7+
    u4 = User(username="t4", password_hash="x", role="student", grade=9)
    assert u4.age_tier == 4

    # With override
    u5 = User(username="t5", password_hash="x", role="student", grade=3, capability_tier_override=3)
    assert u5.age_tier == 3

    # No grade defaults to tier 2
    u6 = User(username="t6", password_hash="x", role="student", grade=None)
    assert u6.age_tier == 2
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web/backend && python -m pytest tests/test_models.py -v`
Expected: FAIL — `capability_tier_override` not a column, `age_tier` not a property

- [ ] **Step 3: Add column and property to User model**

Add to `web/backend/app/models.py` inside the `User` class, after line 30 (`allowed_levels`):

```python
    capability_tier_override: Mapped[int | None] = mapped_column(Integer)

    @property
    def age_tier(self) -> int:
        """Return effective tier: override if set, else derive from grade."""
        if self.capability_tier_override is not None:
            return self.capability_tier_override
        if self.grade is None:
            return 2  # safe default
        if self.grade <= 1:
            return 1
        if self.grade <= 4:
            return 2
        if self.grade <= 6:
            return 3
        return 4
```

- [ ] **Step 4: Generate Alembic migration**

Run: `cd web/backend && alembic revision --autogenerate -m "add capability_tier_override to users"`

- [ ] **Step 5: Run migration**

Run: `cd web/backend && alembic upgrade head`

- [ ] **Step 6: Run test to verify it passes**

Run: `cd web/backend && python -m pytest tests/test_models.py -v`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add web/backend/app/models.py web/backend/alembic/versions/ web/backend/tests/test_models.py
git commit -m "feat(models): add capability_tier_override and age_tier property to User"
```

### Task 3: Create Scenario Seed Schema and Loader

**Files:**
- Create: `web/backend/app/agent/scenarios.py`
- Create: `web/backend/app/agent/scenario_seeds/tier1_money.json`
- Test: `web/backend/tests/test_scenarios.py`

- [ ] **Step 1: Write failing test**

```python
# web/backend/tests/test_scenarios.py
import pytest
from app.agent.scenarios import load_scenarios, get_scenarios_for_tier, ScenarioSeed

def test_scenario_seed_schema():
    seed = ScenarioSeed(
        id="toy_shop",
        title="Toy Shop Choices",
        tier=1,
        domain="money",
        icon="toy",
        learning_objectives=["wants vs needs", "choosing within limits"],
        initial_state={"balance": 5, "items": []},
        events=[
            {
                "description": "You have 5 coins! The teddy bear costs 4, the ball costs 2.",
                "event_type": "choice",
                "choices": [
                    {"id": "teddy", "label": "Teddy Bear", "icon": "bear", "cost": 4},
                    {"id": "ball", "label": "Bouncy Ball", "icon": "ball", "cost": 2},
                ],
            }
        ],
        recap_template="You visited the toy shop and chose {choices}!",
        positive_framing_rules=["Never say 'you can't afford it'", "Use 'you've used your coins for now'"],
        ai_variation_allowed=["item names", "flavor text"],
        max_turns=4,
    )
    assert seed.id == "toy_shop"
    assert seed.tier == 1
    assert seed.domain == "money"
    assert len(seed.events) == 1

def test_load_scenarios():
    scenarios = load_scenarios()
    assert len(scenarios) > 0
    assert all(isinstance(s, ScenarioSeed) for s in scenarios)

def test_get_scenarios_for_tier():
    tier1 = get_scenarios_for_tier(1)
    assert len(tier1) > 0
    assert all(s.tier == 1 for s in tier1)

def test_get_scenarios_for_tier_and_domain():
    tier1_money = get_scenarios_for_tier(1, domain="money")
    assert len(tier1_money) > 0
    assert all(s.tier == 1 and s.domain == "money" for s in tier1_money)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web/backend && python -m pytest tests/test_scenarios.py -v`
Expected: FAIL — module not found

- [ ] **Step 3: Create scenarios module with Pydantic schema**

```python
# web/backend/app/agent/scenarios.py
from __future__ import annotations

import json
from pathlib import Path
from functools import lru_cache
from pydantic import BaseModel


class ChoiceTemplate(BaseModel):
    id: str
    label: str
    icon: str
    cost: int | None = None
    effect: str | None = None


class EventTemplate(BaseModel):
    description: str
    event_type: str  # "choice" | "info" | "surprise"
    choices: list[ChoiceTemplate] | None = None


class ScenarioSeed(BaseModel):
    id: str
    title: str
    tier: int  # 1-4
    domain: str  # money | time | health | social | combo
    icon: str
    learning_objectives: list[str]
    initial_state: dict
    events: list[EventTemplate]
    recap_template: str
    positive_framing_rules: list[str]
    ai_variation_allowed: list[str]
    max_turns: int


SEEDS_DIR = Path(__file__).parent / "scenario_seeds"


@lru_cache(maxsize=1)
def load_scenarios() -> tuple[ScenarioSeed, ...]:
    """Load all scenario seeds from JSON files."""
    seeds: list[ScenarioSeed] = []
    if not SEEDS_DIR.exists():
        return tuple(seeds)
    for path in sorted(SEEDS_DIR.glob("*.json")):
        with open(path) as f:
            data = json.load(f)
        if isinstance(data, list):
            seeds.extend(ScenarioSeed(**item) for item in data)
        else:
            seeds.append(ScenarioSeed(**data))
    return tuple(seeds)


def get_scenarios_for_tier(
    tier: int, *, domain: str | None = None
) -> list[ScenarioSeed]:
    """Return scenarios filtered by tier and optionally domain."""
    scenarios = load_scenarios()
    result = [s for s in scenarios if s.tier == tier]
    if domain is not None:
        result = [s for s in result if s.domain == domain]
    return result
```

- [ ] **Step 4: Create first scenario seed file (Tier 1 Money)**

```json
// web/backend/app/agent/scenario_seeds/tier1_money.json
[
  {
    "id": "toy_shop",
    "title": "Toy Shop Choices",
    "tier": 1,
    "domain": "money",
    "icon": "toy",
    "learning_objectives": ["wants vs needs", "choosing within limits"],
    "initial_state": {"balance": 5, "items": []},
    "events": [
      {
        "description": "Welcome to the Toy Shop! You have 5 coins. The teddy bear costs 4 coins and the bouncy ball costs 2 coins.",
        "event_type": "choice",
        "choices": [
          {"id": "teddy", "label": "Teddy Bear", "icon": "bear", "cost": 4},
          {"id": "ball", "label": "Bouncy Ball", "icon": "ball", "cost": 2}
        ]
      },
      {
        "description": "Oh look! There's also a shiny sticker for 1 coin!",
        "event_type": "choice",
        "choices": [
          {"id": "sticker", "label": "Get Sticker", "icon": "star", "cost": 1},
          {"id": "save", "label": "Save Coins", "icon": "jar", "cost": 0}
        ]
      },
      {
        "description": "Time to head home! Let's see what you got.",
        "event_type": "info"
      }
    ],
    "recap_template": "You visited the Toy Shop with 5 coins and chose {choices}! You have {balance} coins left.",
    "positive_framing_rules": [
      "Never say 'you cant afford it'",
      "Use 'you have used your coins for now'",
      "Every choice is valid — no wrong answers"
    ],
    "ai_variation_allowed": ["toy names", "flavor text around choices"],
    "max_turns": 3
  },
  {
    "id": "lemonade_stand",
    "title": "Lemonade Stand",
    "tier": 1,
    "domain": "money",
    "icon": "lemon",
    "learning_objectives": ["earning through effort", "spending to earn"],
    "initial_state": {"balance": 5, "items": []},
    "events": [
      {
        "description": "You want to sell lemonade! You need lemons (3 coins) and cups (2 coins). Which do you buy first?",
        "event_type": "choice",
        "choices": [
          {"id": "lemons", "label": "Lemons", "icon": "lemon", "cost": 3},
          {"id": "cups", "label": "Cups", "icon": "cup", "cost": 2}
        ]
      },
      {
        "description": "A customer walks up! They want lemonade. Do you charge 1 coin or 2 coins?",
        "event_type": "choice",
        "choices": [
          {"id": "price_low", "label": "1 Coin", "icon": "coin", "effect": "More customers come!"},
          {"id": "price_high", "label": "2 Coins", "icon": "coins", "effect": "Fewer customers but more coins each."}
        ]
      },
      {
        "description": "Oh no! It started raining! Do you close up or keep selling?",
        "event_type": "surprise",
        "choices": [
          {"id": "close", "label": "Close Up", "icon": "house"},
          {"id": "stay", "label": "Keep Selling", "icon": "umbrella"}
        ]
      }
    ],
    "recap_template": "You ran a lemonade stand! You started with {initial_balance} coins and ended with {balance}.",
    "positive_framing_rules": [
      "Rain is an adventure, not a failure",
      "Both pricing choices lead to earning — just different amounts"
    ],
    "ai_variation_allowed": ["drink type", "weather event", "customer descriptions"],
    "max_turns": 4
  }
]
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd web/backend && python -m pytest tests/test_scenarios.py -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add web/backend/app/agent/scenarios.py web/backend/app/agent/scenario_seeds/ web/backend/tests/test_scenarios.py
git commit -m "feat(scenarios): add scenario seed schema, loader, and first Tier 1 money seeds"
```

### Task 4: Add Tier-Specific System Prompts

**Files:**
- Modify: `web/backend/app/agent/prompts.py`
- Test: `web/backend/tests/test_prompts.py`

- [ ] **Step 1: Write failing test**

```python
# web/backend/tests/test_prompts.py
from app.agent.prompts import get_level_up_system_prompt, TIER_PROMPTS

def test_tier_prompts_exist():
    assert 1 in TIER_PROMPTS
    assert 2 in TIER_PROMPTS
    assert 3 in TIER_PROMPTS
    assert 4 in TIER_PROMPTS

def test_tier1_prompt_constraints():
    prompt = TIER_PROMPTS[1]
    assert "15 words" in prompt
    assert "emoji" in prompt.lower()
    assert "percentages" in prompt

def test_tier4_prompt_allows_compound():
    prompt = TIER_PROMPTS[4]
    assert "compound" in prompt.lower()
    assert "formulas" in prompt.lower()

def test_get_level_up_system_prompt():
    prompt = get_level_up_system_prompt(tier=1, scenario_id="toy_shop")
    assert "Level Up Life" in prompt
    assert "15 words" in prompt
    assert "toy_shop" in prompt
    assert "positive" in prompt.lower()

def test_get_level_up_system_prompt_includes_safety():
    prompt = get_level_up_system_prompt(tier=2, scenario_id="weekly_allowance")
    assert "never say" in prompt.lower() or "broke" in prompt.lower()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web/backend && python -m pytest tests/test_prompts.py -v`
Expected: FAIL — imports not found

- [ ] **Step 3: Add tier prompts to prompts.py**

Append to `web/backend/app/agent/prompts.py`:

```python
# --- Level Up Life Tier Prompts ---

TIER_PROMPTS: dict[int, str] = {
    1: (
        "Use short sentences. Max 15 words per message. Use emoji. "
        "Never mention percentages or decimals. Frame all outcomes positively. "
        "Use story language ('Once upon a time...', 'Oh no! It started raining!'). "
        "Only use single-digit numbers and whole coins."
    ),
    2: (
        "Use whole dollar amounts only. Explain trade-offs simply. "
        "Ask 'why did you choose that?' after each decision. "
        "No compound interest concepts. "
        "Encourage tracking ('Let's see how much you've spent so far')."
    ),
    3: (
        "Introduce real-world framing. Use percentages where appropriate. "
        "Ask Socratic follow-up questions. "
        "Encourage comparison ('Which option gives you more value?'). "
        "Introduce opportunity cost language."
    ),
    4: (
        "Teach concepts as they arise. Use real-world amounts. "
        "Introduce compound growth, risk/reward, and long-term projection. "
        "Ask 'what would happen if...?' questions. Reference formulas when relevant."
    ),
}

LEVEL_UP_SAFETY_RULES = (
    "SAFETY RULES FOR LEVEL UP LIFE:\n"
    "- Never say 'you're broke', 'you can't afford it', or 'you failed'. "
    "Use 'you've used your coins for now' or 'you're saving toward something bigger'.\n"
    "- Never reference family income, neighborhood, or economic status.\n"
    "- Never say 'healthy vs unhealthy' food. Use 'foods that give you energy'.\n"
    "- Never create deadline anxiety. Use 'let's figure out a plan'.\n"
    "- Never use peer pressure framing like 'everyone else is doing X'.\n"
    "- Every scenario must end with a positive learning moment.\n"
    "- Never ask for real names, schools, addresses, or family details.\n"
    "- You may swap item names and flavor text, but never change the scenario structure, "
    "stakes, or introduce concepts beyond the student's tier level.\n"
)


def get_level_up_system_prompt(tier: int, scenario_id: str) -> str:
    """Build the full Level Up Life system prompt for a given tier and scenario."""
    tier_rules = TIER_PROMPTS.get(tier, TIER_PROMPTS[2])
    return (
        f"You are the narrator for Level Up Life, an interactive life skills simulation.\n\n"
        f"CURRENT SCENARIO: {scenario_id}\n"
        f"STUDENT TIER: {tier}\n\n"
        f"TIER-SPECIFIC RULES:\n{tier_rules}\n\n"
        f"{LEVEL_UP_SAFETY_RULES}\n"
        f"INTERACTION PATTERN:\n"
        f"- Present choices from the scenario seed events.\n"
        f"- After each student choice, narrate the consequence positively.\n"
        f"- Send scenario_event messages to the iframe to update visuals.\n"
        f"- At the end, generate a recap summarizing what the student practiced.\n"
    )
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web/backend && python -m pytest tests/test_prompts.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web/backend/app/agent/prompts.py web/backend/tests/test_prompts.py
git commit -m "feat(prompts): add tier-specific system prompts and safety rules for Level Up Life"
```

### Task 5: Add Age-Tier Gating to Agent Graph

**Files:**
- Modify: `web/backend/app/agent/graph.py:125-258`
- Test: `web/backend/tests/test_tool_dispatch.py`

- [ ] **Step 1: Write failing test**

```python
# Append to web/backend/tests/test_tool_dispatch.py

from app.agent.graph import get_allowed_tools_for_tier

def test_tier1_blocks_all_tools():
    allowed = get_allowed_tools_for_tier(1)
    assert allowed == []

def test_tier2_allows_only_plan_budget():
    allowed = get_allowed_tools_for_tier(2)
    assert allowed == ["plan_budget"]

def test_tier3_allows_budget_and_schedule():
    allowed = get_allowed_tools_for_tier(3)
    assert "plan_budget" in allowed
    assert "optimize_schedule" in allowed
    assert "calculate_interest" not in allowed

def test_tier4_allows_all():
    allowed = get_allowed_tools_for_tier(4)
    assert "plan_budget" in allowed
    assert "calculate_interest" in allowed
    assert "optimize_schedule" in allowed
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web/backend && python -m pytest tests/test_tool_dispatch.py::test_tier1_blocks_all_tools -v`
Expected: FAIL — `get_allowed_tools_for_tier` not found

- [ ] **Step 3: Add tier gating function to graph.py**

Add to `web/backend/app/agent/graph.py` after the `classify_intent` function (after line 88):

```python
TIER_ALLOWED_TOOLS: dict[int, list[str]] = {
    1: [],
    2: ["plan_budget"],
    3: ["plan_budget", "optimize_schedule"],
    4: ["plan_budget", "calculate_interest", "optimize_schedule", "decision_matrix", "plan_meals"],
}


def get_allowed_tools_for_tier(tier: int) -> list[str]:
    """Return list of life-skills tool names allowed for a given tier."""
    return TIER_ALLOWED_TOOLS.get(tier, [])
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web/backend && python -m pytest tests/test_tool_dispatch.py -v`
Expected: PASS — all tests including new ones

- [ ] **Step 5: Commit**

```bash
git add web/backend/app/agent/graph.py web/backend/tests/test_tool_dispatch.py
git commit -m "feat(agent): add age-tier gating for Level Up Life tool dispatch"
```

### Task 6: Update App Registration for Level Up Life

**Files:**
- Create: `web/backend/alembic/versions/xxxx_update_life_skills_to_level_up_life.py`

- [ ] **Step 1: Create migration to update app registration**

Run: `cd web/backend && alembic revision -m "update life-skills to level-up-life"`

Then edit the generated file:

```python
"""update life-skills to level-up-life"""

from alembic import op

# revision identifiers
revision = "GENERATED_ID"
down_revision = "PREVIOUS_ID"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        UPDATE app_registrations
        SET name = 'Level Up Life',
            description = 'Interactive life skills simulation: money, time, health, and social skills across four age tiers.',
            iframe_url = '/apps/life-skills/index.html'
        WHERE app_id = 'life-skills'
    """)


def downgrade() -> None:
    op.execute("""
        UPDATE app_registrations
        SET name = 'Life Skills Toolkit',
            description = 'Practical life skills tools: budget planner, compound interest calculator, decision matrix, meal planner, schedule optimizer.',
            iframe_url = '/apps/life-skills/index.html'
        WHERE app_id = 'life-skills'
    """)
```

- [ ] **Step 2: Run migration**

Run: `cd web/backend && alembic upgrade head`

- [ ] **Step 3: Commit**

```bash
git add web/backend/alembic/versions/
git commit -m "feat(db): update life-skills app registration to Level Up Life"
```

---

## Phase 3: Iframe Component Rebuild

### Task 7: Scaffold New App Structure

**Files:**
- Create: `apps/life-skills/src/types.ts`
- Create: `apps/life-skills/src/LevelUpLifeApp.tsx`
- Modify: `apps/life-skills/src/main.tsx`

- [ ] **Step 1: Create shared types file**

```typescript
// apps/life-skills/src/types.ts
export type Domain = 'money' | 'time' | 'health' | 'social' | 'combo'
export type Tier = 1 | 2 | 3 | 4
export type Screen = 'picker' | 'simulation' | 'recap'

export interface ScenarioInfo {
  id: string
  title: string
  domain: Domain
  icon: string
  description: string
}

export interface ChoiceOption {
  id: string
  label: string
  icon: string
  cost?: number
  effect?: string
}

export interface VisualUpdate {
  scene: string
  balance?: number
  items?: string[]
  progress?: number
  animationCue?: string
}

export interface DecisionRecord {
  turn: number
  choice: string
  outcome: string
}

export interface RecapSummary {
  domain: string
  scenarioTitle: string
  decisions: DecisionRecord[]
  takeaway: string
  illustration: string
}

export interface SimulationState {
  scenarioId: string
  tier: Tier
  domain: Domain
  balance: number
  items: string[]
  progress: number
  currentScene: string
  description: string
  choices: ChoiceOption[]
  eventType: 'choice' | 'info' | 'surprise' | null
}
```

- [ ] **Step 2: Create root app component with message router**

```tsx
// apps/life-skills/src/LevelUpLifeApp.tsx
import { useState, useEffect, useCallback } from 'react'
import type { Screen, Tier, ScenarioInfo, SimulationState, RecapSummary } from './types'

export default function LevelUpLifeApp() {
  const [screen, setScreen] = useState<Screen>('picker')
  const [tier, setTier] = useState<Tier>(2)
  const [scenarios, setScenarios] = useState<ScenarioInfo[]>([])
  const [simState, setSimState] = useState<SimulationState | null>(null)
  const [recap, setRecap] = useState<RecapSummary | null>(null)
  const [correlationId, setCorrelationId] = useState<string>('')

  const sendMessage = useCallback((msg: Record<string, unknown>) => {
    window.parent.postMessage(msg, '*')
  }, [])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data
      if (!msg || typeof msg.type !== 'string') return

      switch (msg.type) {
        case 'scenario_start':
          setTier(msg.tier)
          setScenarios(msg.scenarios)
          setCorrelationId(msg.correlationId)
          setScreen('picker')
          break

        case 'scenario_event':
          setCorrelationId(msg.correlationId)
          setSimState(prev => ({
            scenarioId: prev?.scenarioId ?? '',
            tier: prev?.tier ?? tier,
            domain: prev?.domain ?? 'money',
            balance: msg.visualUpdate?.balance ?? prev?.balance ?? 0,
            items: msg.visualUpdate?.items ?? prev?.items ?? [],
            progress: msg.visualUpdate?.progress ?? prev?.progress ?? 0,
            currentScene: msg.visualUpdate?.scene ?? prev?.currentScene ?? '',
            description: msg.description,
            choices: msg.choices ?? [],
            eventType: msg.eventType,
          }))
          if (screen !== 'simulation') setScreen('simulation')
          break

        case 'state_update':
          setSimState(prev => prev ? {
            ...prev,
            balance: msg.balance ?? prev.balance,
            items: msg.items ?? prev.items,
            progress: msg.progress ?? prev.progress,
            currentScene: msg.visualCue ?? prev.currentScene,
          } : prev)
          break

        case 'scenario_end':
          setRecap(msg.summary)
          setScreen('recap')
          break
      }
    }

    window.addEventListener('message', handleMessage)
    sendMessage({ type: 'ui_ready' })

    return () => window.removeEventListener('message', handleMessage)
  }, [sendMessage, screen, tier])

  const handleScenarioSelect = (scenarioId: string) => {
    sendMessage({ type: 'scenario_selected', scenarioId, tier })
  }

  const handleChoice = (choiceId: string, value?: number) => {
    sendMessage({ type: 'choice_made', correlationId, choiceId, value })
  }

  const handleSlider = (field: string, value: number) => {
    sendMessage({ type: 'slider_changed', correlationId, field, value })
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 480, margin: '0 auto', padding: 16 }}>
      {screen === 'picker' && (
        <ScenarioPickerPlaceholder
          scenarios={scenarios}
          tier={tier}
          onSelect={handleScenarioSelect}
        />
      )}
      {screen === 'simulation' && simState && (
        <SimulationPlaceholder
          state={simState}
          tier={tier}
          onChoice={handleChoice}
          onSlider={handleSlider}
        />
      )}
      {screen === 'recap' && recap && (
        <RecapPlaceholder summary={recap} tier={tier} />
      )}
    </div>
  )
}

// Minimal placeholders — will be replaced by full components in Tasks 8-10
function ScenarioPickerPlaceholder({ scenarios, tier, onSelect }: {
  scenarios: ScenarioInfo[], tier: Tier, onSelect: (id: string) => void
}) {
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, textAlign: 'center' }}>Level Up Life</h1>
      <p style={{ textAlign: 'center', color: '#6b7280' }}>Tier {tier} — Pick a scenario</p>
      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        {scenarios.map(s => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            style={{
              padding: 16, borderRadius: 12, border: '2px solid #e5e7eb',
              background: '#fff', cursor: 'pointer', textAlign: 'left',
            }}
          >
            <div style={{ fontSize: 18 }}>{s.icon} {s.title}</div>
            <div style={{ fontSize: 14, color: '#6b7280' }}>{s.description}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

function SimulationPlaceholder({ state, tier, onChoice, onSlider }: {
  state: SimulationState, tier: Tier,
  onChoice: (id: string, value?: number) => void,
  onSlider: (field: string, value: number) => void
}) {
  return (
    <div>
      <div style={{ background: '#f3f4f6', borderRadius: 12, padding: 16, marginBottom: 12 }}>
        <div style={{ fontSize: 24, fontWeight: 700 }}>
          {tier === 1 ? '🪙' : '$'}{state.balance}
        </div>
        {state.progress > 0 && (
          <div style={{ background: '#e5e7eb', borderRadius: 8, height: 8, marginTop: 8 }}>
            <div style={{
              background: '#3b82f6', borderRadius: 8, height: 8,
              width: `${state.progress}%`, transition: 'width 0.5s ease',
            }} />
          </div>
        )}
      </div>
      <div style={{ background: '#fffbeb', borderRadius: 12, padding: 16, marginBottom: 12 }}>
        <p>{state.description}</p>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {state.choices.map(c => (
          <button
            key={c.id}
            onClick={() => onChoice(c.id)}
            style={{
              padding: tier === 1 ? 20 : 14,
              fontSize: tier === 1 ? 18 : 15,
              borderRadius: 12, border: '2px solid #3b82f6',
              background: '#eff6ff', cursor: 'pointer',
              minHeight: tier === 1 ? 64 : 44,
            }}
          >
            {c.icon} {c.label}
            {c.cost != null && <span style={{ color: '#6b7280' }}> ({c.cost} {tier === 1 ? 'coins' : '$'})</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

function RecapPlaceholder({ summary, tier }: { summary: RecapSummary, tier: Tier }) {
  return (
    <div style={{ background: '#f0fdf4', borderRadius: 16, padding: 24, textAlign: 'center' }}>
      <h2 style={{ fontSize: 20, color: '#166534' }}>What You Practiced Today</h2>
      <p style={{ fontSize: 16, marginTop: 8 }}>{summary.scenarioTitle}</p>
      <div style={{ marginTop: 16, textAlign: 'left' }}>
        {summary.decisions.map((d, i) => (
          <div key={i} style={{ padding: 8, borderBottom: '1px solid #dcfce7' }}>
            <strong>Turn {d.turn}:</strong> {d.choice} → {d.outcome}
          </div>
        ))}
      </div>
      <div style={{
        marginTop: 16, padding: 16, background: '#dcfce7',
        borderRadius: 12, fontSize: 18, fontWeight: 600, color: '#166534',
      }}>
        {summary.takeaway}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Update main.tsx to use new component**

```tsx
// apps/life-skills/src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import LevelUpLifeApp from './LevelUpLifeApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LevelUpLifeApp />
  </StrictMode>
)
```

- [ ] **Step 4: Build and verify**

Run: `cd apps/life-skills && pnpm build`
Expected: Build succeeds with no errors

- [ ] **Step 5: Commit**

```bash
git add apps/life-skills/src/
git commit -m "feat(iframe): scaffold LevelUpLifeApp with message router and placeholder screens"
```

### Task 8: Build Scenario Picker Screen

**Files:**
- Create: `apps/life-skills/src/components/ScenarioPickerScreen.tsx`
- Create: `apps/life-skills/src/components/ScenarioCard.tsx`
- Create: `apps/life-skills/src/components/DomainTab.tsx`

- [ ] **Step 1: Create DomainTab component**

```tsx
// apps/life-skills/src/components/DomainTab.tsx
import type { Domain } from '../types'

const DOMAIN_CONFIG: Record<Domain, { label: string; icon: string; color: string }> = {
  money: { label: 'Money', icon: '💰', color: '#f59e0b' },
  time: { label: 'Time', icon: '⏰', color: '#3b82f6' },
  health: { label: 'Health', icon: '🥗', color: '#22c55e' },
  social: { label: 'Social', icon: '🤝', color: '#a855f7' },
  combo: { label: 'Combo', icon: '⭐', color: '#ef4444' },
}

interface DomainTabProps {
  domains: Domain[]
  active: Domain | null
  onSelect: (domain: Domain | null) => void
}

export default function DomainTab({ domains, active, onSelect }: DomainTabProps) {
  return (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8 }}>
      <button
        onClick={() => onSelect(null)}
        style={{
          padding: '6px 14px', borderRadius: 20, border: '2px solid',
          borderColor: active === null ? '#1a1a2e' : '#e5e7eb',
          background: active === null ? '#1a1a2e' : '#fff',
          color: active === null ? '#fff' : '#374151',
          fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        All
      </button>
      {domains.map(d => {
        const cfg = DOMAIN_CONFIG[d]
        const isActive = active === d
        return (
          <button
            key={d}
            onClick={() => onSelect(d)}
            style={{
              padding: '6px 14px', borderRadius: 20, border: '2px solid',
              borderColor: isActive ? cfg.color : '#e5e7eb',
              background: isActive ? cfg.color : '#fff',
              color: isActive ? '#fff' : '#374151',
              fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {cfg.icon} {cfg.label}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Create ScenarioCard component**

```tsx
// apps/life-skills/src/components/ScenarioCard.tsx
import type { ScenarioInfo, Tier } from '../types'

const DOMAIN_COLORS: Record<string, string> = {
  money: '#fef3c7', time: '#dbeafe', health: '#dcfce7', social: '#f3e8ff', combo: '#fee2e2',
}

interface ScenarioCardProps {
  scenario: ScenarioInfo
  tier: Tier
  onSelect: (id: string) => void
}

export default function ScenarioCard({ scenario, tier, onSelect }: ScenarioCardProps) {
  const bgColor = DOMAIN_COLORS[scenario.domain] ?? '#f3f4f6'
  const isYoungTier = tier <= 2

  return (
    <button
      onClick={() => onSelect(scenario.id)}
      style={{
        padding: isYoungTier ? 20 : 16,
        borderRadius: 16,
        border: '2px solid #e5e7eb',
        background: bgColor,
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        minHeight: isYoungTier ? 80 : 60,
        transition: 'transform 0.1s ease, box-shadow 0.1s ease',
      }}
      onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
      onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
    >
      <div style={{ fontSize: isYoungTier ? 28 : 20, marginBottom: 4 }}>
        {scenario.icon}
      </div>
      <div style={{ fontSize: isYoungTier ? 18 : 15, fontWeight: 700, color: '#1a1a2e' }}>
        {scenario.title}
      </div>
      {tier >= 2 && (
        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
          {scenario.description}
        </div>
      )}
    </button>
  )
}
```

- [ ] **Step 3: Create ScenarioPickerScreen**

```tsx
// apps/life-skills/src/components/ScenarioPickerScreen.tsx
import { useState, useMemo } from 'react'
import type { ScenarioInfo, Tier, Domain } from '../types'
import DomainTab from './DomainTab'
import ScenarioCard from './ScenarioCard'

interface ScenarioPickerScreenProps {
  scenarios: ScenarioInfo[]
  tier: Tier
  onSelect: (id: string) => void
}

export default function ScenarioPickerScreen({ scenarios, tier, onSelect }: ScenarioPickerScreenProps) {
  const [activeDomain, setActiveDomain] = useState<Domain | null>(null)

  const availableDomains = useMemo(() => {
    const domains = new Set(scenarios.map(s => s.domain))
    return Array.from(domains) as Domain[]
  }, [scenarios])

  const filtered = activeDomain
    ? scenarios.filter(s => s.domain === activeDomain)
    : scenarios

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <h1 style={{
          fontSize: tier <= 2 ? 28 : 22,
          fontWeight: 800,
          color: '#1a1a2e',
          margin: 0,
        }}>
          {tier === 1 ? '🌟 ' : ''}Level Up Life{tier === 1 ? ' 🌟' : ''}
        </h1>
        <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
          {tier === 1 ? 'Pick an adventure!' : 'Choose a scenario to practice'}
        </p>
      </div>

      <DomainTab domains={availableDomains} active={activeDomain} onSelect={setActiveDomain} />

      <div style={{
        display: 'grid',
        gridTemplateColumns: tier === 1 ? '1fr' : '1fr 1fr',
        gap: 10,
        marginTop: 12,
      }}>
        {filtered.map(s => (
          <ScenarioCard key={s.id} scenario={s} tier={tier} onSelect={onSelect} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Update LevelUpLifeApp to use new component**

Replace the `ScenarioPickerPlaceholder` usage in `LevelUpLifeApp.tsx`:

```tsx
// At top of LevelUpLifeApp.tsx, replace placeholder import with:
import ScenarioPickerScreen from './components/ScenarioPickerScreen'

// In the render, replace ScenarioPickerPlaceholder with:
{screen === 'picker' && (
  <ScenarioPickerScreen
    scenarios={scenarios}
    tier={tier}
    onSelect={handleScenarioSelect}
  />
)}
```

Remove the `ScenarioPickerPlaceholder` function.

- [ ] **Step 5: Build and verify**

Run: `cd apps/life-skills && pnpm build`
Expected: Build succeeds

- [ ] **Step 6: Commit**

```bash
git add apps/life-skills/src/
git commit -m "feat(iframe): build ScenarioPickerScreen with DomainTab and ScenarioCard"
```

### Task 9: Build Simulation Screen with Tier-Specific Visuals

**Files:**
- Create: `apps/life-skills/src/components/SimulationScreen.tsx`
- Create: `apps/life-skills/src/components/StatusBar.tsx`
- Create: `apps/life-skills/src/components/ChoicePanel.tsx`
- Create: `apps/life-skills/src/components/EventBubble.tsx`
- Create: `apps/life-skills/src/components/CoinJar.tsx`

- [ ] **Step 1: Create CoinJar (Tier 1 animated SVG)**

```tsx
// apps/life-skills/src/components/CoinJar.tsx
interface CoinJarProps {
  balance: number
  maxBalance?: number
}

export default function CoinJar({ balance, maxBalance = 10 }: CoinJarProps) {
  const fillPct = Math.min(100, (balance / maxBalance) * 100)
  return (
    <div style={{ textAlign: 'center' }}>
      <svg viewBox="0 0 100 120" width="100" height="120">
        {/* Jar body */}
        <rect x="20" y="30" width="60" height="80" rx="10" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="2" />
        {/* Jar neck */}
        <rect x="30" y="20" width="40" height="15" rx="4" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="2" />
        {/* Fill level */}
        <rect
          x="22" y={110 - fillPct * 0.78}
          width="56" height={fillPct * 0.78}
          rx="8" fill="#fbbf24"
          style={{ transition: 'height 0.6s ease, y 0.6s ease' }}
        />
        {/* Coins inside */}
        {Array.from({ length: Math.min(balance, 8) }).map((_, i) => (
          <circle
            key={i}
            cx={35 + (i % 3) * 15}
            cy={100 - i * 8}
            r="6"
            fill="#f59e0b"
            stroke="#d97706"
            strokeWidth="1"
            style={{
              animation: `coinDrop 0.4s ease ${i * 0.1}s both`,
            }}
          />
        ))}
      </svg>
      <div style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b', marginTop: 4 }}>
        {balance} 🪙
      </div>
      <style>{`
        @keyframes coinDrop {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
```

- [ ] **Step 2: Create EventBubble**

```tsx
// apps/life-skills/src/components/EventBubble.tsx
import type { Tier } from '../types'

interface EventBubbleProps {
  description: string
  eventType: 'choice' | 'info' | 'surprise' | null
  tier: Tier
}

const EVENT_STYLES: Record<string, { bg: string; border: string; icon: string }> = {
  choice: { bg: '#fffbeb', border: '#fbbf24', icon: '🤔' },
  info: { bg: '#eff6ff', border: '#60a5fa', icon: '💡' },
  surprise: { bg: '#fef2f2', border: '#f87171', icon: '⚡' },
}

export default function EventBubble({ description, eventType, tier }: EventBubbleProps) {
  const style = EVENT_STYLES[eventType ?? 'info'] ?? EVENT_STYLES.info
  return (
    <div style={{
      background: style.bg,
      border: `2px solid ${style.border}`,
      borderRadius: 16,
      padding: tier === 1 ? 20 : 14,
      marginBottom: 12,
    }}>
      <p style={{
        fontSize: tier === 1 ? 20 : tier === 2 ? 16 : 15,
        lineHeight: 1.5,
        margin: 0,
        color: '#374151',
      }}>
        {eventType === 'surprise' && `${style.icon} `}
        {description}
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Create StatusBar**

```tsx
// apps/life-skills/src/components/StatusBar.tsx
import type { Tier, SimulationState } from '../types'
import CoinJar from './CoinJar'

interface StatusBarProps {
  state: SimulationState
  tier: Tier
}

export default function StatusBar({ state, tier }: StatusBarProps) {
  if (tier === 1) {
    return <CoinJar balance={state.balance} />
  }

  // Tier 2: progress bar + balance
  if (tier === 2) {
    return (
      <div style={{
        background: '#f3f4f6', borderRadius: 12, padding: 16, marginBottom: 12,
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#1a1a2e' }}>
          ${state.balance}
        </div>
        {state.progress > 0 && (
          <div style={{ flex: 1, background: '#e5e7eb', borderRadius: 8, height: 12 }}>
            <div style={{
              background: '#22c55e', borderRadius: 8, height: 12,
              width: `${state.progress}%`, transition: 'width 0.5s ease',
            }} />
          </div>
        )}
      </div>
    )
  }

  // Tier 3-4: dashboard metrics
  return (
    <div style={{
      background: '#f3f4f6', borderRadius: 12, padding: 16, marginBottom: 12,
      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12,
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: '#6b7280' }}>Balance</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>${state.balance}</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: '#6b7280' }}>Progress</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#22c55e' }}>{state.progress}%</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: '#6b7280' }}>Items</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#3b82f6' }}>{state.items.length}</div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create ChoicePanel**

```tsx
// apps/life-skills/src/components/ChoicePanel.tsx
import type { Tier, ChoiceOption } from '../types'

interface ChoicePanelProps {
  choices: ChoiceOption[]
  tier: Tier
  onChoice: (id: string, value?: number) => void
  onSlider: (field: string, value: number) => void
}

export default function ChoicePanel({ choices, tier, onChoice }: ChoicePanelProps) {
  if (choices.length === 0) return null

  const btnStyle = (tier: Tier) => ({
    padding: tier === 1 ? 20 : tier === 2 ? 16 : 12,
    fontSize: tier === 1 ? 20 : tier === 2 ? 16 : 15,
    borderRadius: tier === 1 ? 16 : 12,
    border: '2px solid #3b82f6',
    background: '#eff6ff',
    cursor: 'pointer' as const,
    minHeight: tier === 1 ? 64 : 44,
    width: '100%',
    textAlign: 'left' as const,
    transition: 'transform 0.1s ease',
  })

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: tier === 1 && choices.length === 2 ? '1fr 1fr' : '1fr',
      gap: tier === 1 ? 12 : 8,
    }}>
      {choices.map(c => (
        <button
          key={c.id}
          onClick={() => onChoice(c.id)}
          style={btnStyle(tier)}
          onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.96)')}
          onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <span style={{ fontSize: tier === 1 ? 24 : 16 }}>{c.icon}</span>
          {' '}
          <span style={{ fontWeight: 600 }}>{c.label}</span>
          {c.cost != null && (
            <span style={{ color: '#6b7280', marginLeft: 8 }}>
              ({c.cost} {tier === 1 ? '🪙' : `$${c.cost}`})
            </span>
          )}
          {c.effect && tier >= 3 && (
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{c.effect}</div>
          )}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Create SimulationScreen**

```tsx
// apps/life-skills/src/components/SimulationScreen.tsx
import type { Tier, SimulationState } from '../types'
import StatusBar from './StatusBar'
import EventBubble from './EventBubble'
import ChoicePanel from './ChoicePanel'

interface SimulationScreenProps {
  state: SimulationState
  tier: Tier
  onChoice: (id: string, value?: number) => void
  onSlider: (field: string, value: number) => void
}

export default function SimulationScreen({ state, tier, onChoice, onSlider }: SimulationScreenProps) {
  return (
    <div>
      <StatusBar state={state} tier={tier} />
      <EventBubble
        description={state.description}
        eventType={state.eventType}
        tier={tier}
      />
      <ChoicePanel
        choices={state.choices}
        tier={tier}
        onChoice={onChoice}
        onSlider={onSlider}
      />
    </div>
  )
}
```

- [ ] **Step 6: Update LevelUpLifeApp to use SimulationScreen**

Replace `SimulationPlaceholder` usage in `LevelUpLifeApp.tsx`:

```tsx
import SimulationScreen from './components/SimulationScreen'

// In render, replace SimulationPlaceholder:
{screen === 'simulation' && simState && (
  <SimulationScreen
    state={simState}
    tier={tier}
    onChoice={handleChoice}
    onSlider={handleSlider}
  />
)}
```

Remove the `SimulationPlaceholder` function.

- [ ] **Step 7: Build and verify**

Run: `cd apps/life-skills && pnpm build`
Expected: Build succeeds

- [ ] **Step 8: Commit**

```bash
git add apps/life-skills/src/
git commit -m "feat(iframe): build SimulationScreen with tier-specific StatusBar, ChoicePanel, EventBubble"
```

### Task 10: Build Recap Screen

**Files:**
- Create: `apps/life-skills/src/components/RecapScreen.tsx`

- [ ] **Step 1: Create RecapScreen component**

```tsx
// apps/life-skills/src/components/RecapScreen.tsx
import type { Tier, RecapSummary } from '../types'

interface RecapScreenProps {
  summary: RecapSummary
  tier: Tier
}

const DOMAIN_ICONS: Record<string, string> = {
  money: '💰', time: '⏰', health: '🥗', social: '🤝', combo: '⭐',
}

export default function RecapScreen({ summary, tier }: RecapScreenProps) {
  const isYoung = tier <= 2
  return (
    <div style={{
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
      borderRadius: 20, padding: isYoung ? 28 : 24,
      textAlign: 'center', minHeight: 300,
    }}>
      <div style={{ fontSize: isYoung ? 48 : 36, marginBottom: 8 }}>
        🎉
      </div>
      <h2 style={{
        fontSize: isYoung ? 22 : 18,
        fontWeight: 800, color: '#166534', margin: 0,
      }}>
        {isYoung ? 'Great Job!' : 'What You Practiced Today'}
      </h2>

      <div style={{
        marginTop: 12, padding: 12, background: '#fff',
        borderRadius: 12, display: 'inline-block',
      }}>
        <span style={{ fontSize: 20 }}>{DOMAIN_ICONS[summary.domain] ?? '📘'}</span>
        <span style={{ fontSize: 16, fontWeight: 600, marginLeft: 8 }}>
          {summary.scenarioTitle}
        </span>
      </div>

      {tier >= 2 && (
        <div style={{ marginTop: 16, textAlign: 'left' }}>
          {summary.decisions.map((d, i) => (
            <div key={i} style={{
              padding: 10, background: '#fff', borderRadius: 10,
              marginBottom: 6, fontSize: 14,
            }}>
              <span style={{ color: '#6b7280' }}>Turn {d.turn}:</span>{' '}
              <strong>{d.choice}</strong> → {d.outcome}
            </div>
          ))}
        </div>
      )}

      <div style={{
        marginTop: 20, padding: 16, background: '#166534',
        borderRadius: 14, color: '#fff',
        fontSize: isYoung ? 20 : 16, fontWeight: 700,
        lineHeight: 1.4,
      }}>
        {summary.takeaway}
      </div>

      <p style={{ marginTop: 12, fontSize: 12, color: '#6b7280' }}>
        Screenshot this to share with your family!
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Update LevelUpLifeApp to use RecapScreen**

Replace `RecapPlaceholder` in `LevelUpLifeApp.tsx`:

```tsx
import RecapScreen from './components/RecapScreen'

// In render:
{screen === 'recap' && recap && (
  <RecapScreen summary={recap} tier={tier} />
)}
```

Remove the `RecapPlaceholder` function.

- [ ] **Step 3: Build and verify**

Run: `cd apps/life-skills && pnpm build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add apps/life-skills/src/
git commit -m "feat(iframe): build RecapScreen with tier-appropriate summary display"
```

---

## Phase 4: Platform Integration

### Task 11: Update AppIframe to Handle Level Up Life Messages

**Files:**
- Modify: `web/frontend/src/components/AppIframe.tsx`

- [ ] **Step 1: Add Level Up Life message handling to AppIframe**

Add new callback props and message handling to `AppIframe.tsx`. In the props interface (around line 18), add:

```typescript
onScenarioSelected?: (scenarioId: string, tier: number) => void
onChoiceMade?: (correlationId: string, choiceId: string, value?: number) => void
onSliderChanged?: (correlationId: string, field: string, value: number) => void
```

In the `handleMessage` function (around line 48), add cases for the new message types:

```typescript
case 'scenario_selected':
  onScenarioSelected?.(msg.scenarioId, msg.tier)
  break
case 'choice_made':
  onChoiceMade?.(msg.correlationId, msg.choiceId, msg.value)
  break
case 'slider_changed':
  onSliderChanged?.(msg.correlationId, msg.field, msg.value)
  break
```

Add a new ref method for sending Level Up Life messages:

```typescript
sendLevelUpMessage(msg: Record<string, unknown>) {
  if (iframeRef.current?.contentWindow) {
    iframeRef.current.contentWindow.postMessage(msg, '*')
  }
}
```

- [ ] **Step 2: Build and verify**

Run: `cd web/frontend && pnpm build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add web/frontend/src/components/AppIframe.tsx
git commit -m "feat(platform): extend AppIframe with Level Up Life message handling"
```

### Task 12: Update ChatPage for Level Up Life Flow

**Files:**
- Modify: `web/frontend/src/pages/ChatPage.tsx`

- [ ] **Step 1: Add Level Up Life event handlers to ChatPage**

In ChatPage, add handlers for the new AppIframe callbacks. When a `scenario_selected` message comes from the iframe, forward it to the backend as a user message so the agent can start narrating. When the agent sends `scenario_event` SSE events, forward them to the iframe via `sendLevelUpMessage`.

Add to the SSE event handler (around line 134) new event types:

```typescript
case 'scenario_event':
case 'scenario_end':
case 'state_update':
  // Forward agent's simulation messages to the iframe
  appIframeRef.current?.sendLevelUpMessage(event.data)
  break
```

Add callback handlers:

```typescript
const handleScenarioSelected = async (scenarioId: string, tier: number) => {
  // Send as a system-level message to the agent
  await api.sendMessage(activeConversation!.id, `[LEVEL_UP_LIFE] scenario_selected: ${scenarioId} tier: ${tier}`, {
    onToken: handleToken,
    onToolCall: handleToolCall,
    onDone: handleDone,
    onError: handleError,
  })
}

const handleChoiceMade = async (correlationId: string, choiceId: string, value?: number) => {
  await api.sendMessage(activeConversation!.id, `[LEVEL_UP_LIFE] choice_made: ${choiceId}${value != null ? ` value: ${value}` : ''}`, {
    onToken: handleToken,
    onToolCall: handleToolCall,
    onDone: handleDone,
    onError: handleError,
  })
}
```

Wire these to the AppIframe component:

```tsx
<AppIframe
  ref={appIframeRef}
  appId={activeApp.appId}
  iframeUrl={activeApp.iframeUrl}
  onReady={handleAppReady}
  onToolResult={handleToolResult}
  onStateUpdate={handleStateUpdate}
  onScenarioSelected={handleScenarioSelected}
  onChoiceMade={handleChoiceMade}
/>
```

- [ ] **Step 2: Build and verify**

Run: `cd web/frontend && pnpm build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add web/frontend/src/pages/ChatPage.tsx
git commit -m "feat(platform): wire Level Up Life simulation flow in ChatPage"
```

### Task 13: Update Backend SSE to Emit Simulation Events

**Files:**
- Modify: `web/backend/app/conversations/router.py`
- Modify: `web/backend/app/agent/graph.py`

- [ ] **Step 1: Add Level Up Life message detection to router**

In the conversations router, detect `[LEVEL_UP_LIFE]` prefixed messages and route them to the scenario engine instead of the normal chat flow. Add a new handler after the message save (around line 95):

```python
# In POST /api/conversations/{id}/messages handler
is_level_up = content.startswith("[LEVEL_UP_LIFE]")

if is_level_up:
    # Parse the Level Up Life message
    # e.g., "[LEVEL_UP_LIFE] scenario_selected: toy_shop tier: 1"
    # or "[LEVEL_UP_LIFE] choice_made: teddy"
    level_up_payload = content.replace("[LEVEL_UP_LIFE] ", "")

    # Get user's tier
    user = await db.get(User, user_id)
    tier = user.age_tier

    # Yield scenario events as SSE
    async for event in handle_level_up_message(level_up_payload, tier, messages):
        yield f"data: {json.dumps(event)}\n\n"
    return
```

- [ ] **Step 2: Add handle_level_up_message to graph.py**

```python
# Append to web/backend/app/agent/graph.py

from app.agent.scenarios import get_scenarios_for_tier, load_scenarios
from app.agent.prompts import get_level_up_system_prompt

async def handle_level_up_message(
    payload: str, tier: int, messages: list[dict]
) -> AsyncGenerator[dict, None]:
    """Handle Level Up Life iframe messages and generate simulation events."""

    if payload.startswith("scenario_selected:"):
        parts = payload.split()
        scenario_id = parts[1]

        # Load scenario seed
        scenarios = load_scenarios()
        seed = next((s for s in scenarios if s.id == scenario_id), None)
        if seed is None:
            yield {"type": "error", "detail": f"Scenario {scenario_id} not found"}
            return

        # Send first event from scenario
        first_event = seed.events[0] if seed.events else None
        if first_event:
            yield {
                "type": "scenario_event",
                "correlationId": str(uuid.uuid4()),
                "eventType": first_event.event_type,
                "description": first_event.description,
                "choices": [c.model_dump() for c in first_event.choices] if first_event.choices else [],
                "visualUpdate": {
                    "scene": f"{scenario_id}_start",
                    "balance": seed.initial_state.get("balance", 0),
                    "items": seed.initial_state.get("items", []),
                    "progress": 0,
                },
            }

        # Also stream tutor narration
        system_prompt = get_level_up_system_prompt(tier, scenario_id)
        narration_messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"The student selected scenario: {seed.title}. Begin narrating."},
        ]

        async for chunk in _stream_llm(narration_messages):
            yield {"type": "token", "content": chunk}

        yield {"type": "done", "full_content": ""}

    elif payload.startswith("choice_made:"):
        choice_id = payload.split(":")[1].strip().split()[0]

        # Let the LLM narrate the consequence
        narration_messages = messages + [
            {"role": "user", "content": f"[LEVEL_UP_LIFE] The student chose: {choice_id}. Narrate the consequence and present the next event."},
        ]

        async for chunk in _stream_llm(narration_messages):
            yield {"type": "token", "content": chunk}

        yield {"type": "done", "full_content": ""}


async def _stream_llm(messages: list[dict]) -> AsyncGenerator[str, None]:
    """Helper to stream LLM text responses."""
    from openai import AsyncOpenAI
    import os

    client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    response = await client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=messages,
        stream=True,
    )
    async for chunk in response:
        if chunk.choices and chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content
```

- [ ] **Step 3: Run existing tests to ensure nothing breaks**

Run: `cd web/backend && python -m pytest tests/ -v`
Expected: All existing tests pass

- [ ] **Step 4: Commit**

```bash
git add web/backend/app/agent/graph.py web/backend/app/conversations/router.py
git commit -m "feat(agent): add Level Up Life simulation event handling in backend"
```

---

## Phase 5: Scenario Seed Content

### Task 14: Create Remaining Tier 1 Scenario Seeds

**Files:**
- Create: `web/backend/app/agent/scenario_seeds/tier1_time.json`
- Create: `web/backend/app/agent/scenario_seeds/tier1_health.json`
- Create: `web/backend/app/agent/scenario_seeds/tier1_social.json`
- Create: `web/backend/app/agent/scenario_seeds/tier1_combo.json`

- [ ] **Step 1: Create Tier 1 Time seeds**

Create `tier1_time.json` with 3 scenarios: Morning Routine Builder, Getting Ready Race, Bedtime Countdown. Follow the same JSON schema as `tier1_money.json`. Each scenario should have 3-4 events with binary choices, use single-digit numbers, and include positive framing rules.

- [ ] **Step 2: Create Tier 1 Health seeds**

Create `tier1_health.json` with 3 scenarios: Build a Snack Plate, Fruit or Cookie?, Lunch Box Packer.

- [ ] **Step 3: Create Tier 1 Social seeds**

Create `tier1_social.json` with 3 scenarios: Sharing Fair, How Does That Feel?, Making Friends.

- [ ] **Step 4: Create Tier 1 Combo seed**

Create `tier1_combo.json` with 1 scenario: Plan a Picnic.

- [ ] **Step 5: Verify all seeds load**

Run: `cd web/backend && python -c "from app.agent.scenarios import load_scenarios; seeds = load_scenarios(); print(f'{len(seeds)} seeds loaded'); assert len([s for s in seeds if s.tier == 1]) >= 12"`
Expected: 12+ seeds loaded

- [ ] **Step 6: Commit**

```bash
git add web/backend/app/agent/scenario_seeds/
git commit -m "feat(content): add Tier 1 scenario seeds for time, health, social, and combo domains"
```

### Task 15: Create Tier 2 Scenario Seeds

**Files:**
- Create: `web/backend/app/agent/scenario_seeds/tier2_money.json`
- Create: `web/backend/app/agent/scenario_seeds/tier2_time.json`
- Create: `web/backend/app/agent/scenario_seeds/tier2_health.json`
- Create: `web/backend/app/agent/scenario_seeds/tier2_social.json`
- Create: `web/backend/app/agent/scenario_seeds/tier2_combo.json`

- [ ] **Step 1: Create all Tier 2 seeds**

Create JSON files following the scenario content from the spec. Tier 2 uses whole dollar amounts, 3+ choices per event, and tracking-oriented scenarios. 4 money scenarios, 3 time, 3 health, 3 social, 1 combo.

- [ ] **Step 2: Verify**

Run: `cd web/backend && python -c "from app.agent.scenarios import get_scenarios_for_tier; t2 = get_scenarios_for_tier(2); print(f'{len(t2)} tier 2 seeds'); assert len(t2) >= 14"`

- [ ] **Step 3: Commit**

```bash
git add web/backend/app/agent/scenario_seeds/
git commit -m "feat(content): add Tier 2 scenario seeds (tracking & planning)"
```

### Task 16: Create Tier 3 and Tier 4 Scenario Seeds

**Files:**
- Create: `web/backend/app/agent/scenario_seeds/tier3_*.json` (5 files)
- Create: `web/backend/app/agent/scenario_seeds/tier4_*.json` (5 files)

- [ ] **Step 1: Create all Tier 3 seeds**

Trade-off analysis scenarios. 4 money, 3 time, 3 health, 3 social, 1 combo. Use percentages, multi-category budgets, comparative analysis.

- [ ] **Step 2: Create all Tier 4 seeds**

Abstract projection scenarios. 4 money (including compound interest), 3 time, 3 health, 3 social, 1 combo. Real-world amounts, long-term projections.

- [ ] **Step 3: Verify all seeds load**

Run: `cd web/backend && python -c "from app.agent.scenarios import load_scenarios; seeds = load_scenarios(); print(f'{len(seeds)} total seeds'); tiers = {t: len([s for s in seeds if s.tier == t]) for t in [1,2,3,4]}; print(tiers); assert len(seeds) >= 48"`
Expected: 48+ total seeds

- [ ] **Step 4: Commit**

```bash
git add web/backend/app/agent/scenario_seeds/
git commit -m "feat(content): add Tier 3 and Tier 4 scenario seeds (trade-offs and abstract projection)"
```

---

## Phase 6: Integration & Cleanup

### Task 17: End-to-End Integration Test

**Files:**
- Create: `web/backend/tests/test_level_up_life.py`

- [ ] **Step 1: Write integration test**

```python
# web/backend/tests/test_level_up_life.py
import pytest
from app.agent.scenarios import load_scenarios, get_scenarios_for_tier
from app.agent.prompts import get_level_up_system_prompt, TIER_PROMPTS
from app.agent.graph import get_allowed_tools_for_tier

def test_all_tiers_have_scenarios():
    for tier in [1, 2, 3, 4]:
        scenarios = get_scenarios_for_tier(tier)
        assert len(scenarios) >= 10, f"Tier {tier} has only {len(scenarios)} scenarios"

def test_all_domains_covered_per_tier():
    for tier in [1, 2, 3, 4]:
        scenarios = get_scenarios_for_tier(tier)
        domains = {s.domain for s in scenarios}
        for required in ["money", "time", "health", "social"]:
            assert required in domains, f"Tier {tier} missing domain: {required}"

def test_combo_scenarios_exist():
    for tier in [1, 2, 3, 4]:
        combos = get_scenarios_for_tier(tier, domain="combo")
        assert len(combos) >= 1, f"Tier {tier} missing combo scenario"

def test_all_scenarios_have_positive_framing():
    for seed in load_scenarios():
        assert len(seed.positive_framing_rules) > 0, f"Scenario {seed.id} has no positive framing rules"

def test_tier_prompts_safety_alignment():
    for tier in [1, 2, 3, 4]:
        prompt = get_level_up_system_prompt(tier, "test")
        assert "broke" in prompt.lower() or "never say" in prompt.lower()

def test_tier_gating_consistency():
    # Tier 1 can't dispatch any tools
    assert get_allowed_tools_for_tier(1) == []
    # Each tier allows a superset of the previous
    for t in [2, 3, 4]:
        prev = set(get_allowed_tools_for_tier(t - 1))
        curr = set(get_allowed_tools_for_tier(t))
        assert prev.issubset(curr), f"Tier {t} doesn't include all tier {t-1} tools"
```

- [ ] **Step 2: Run test**

Run: `cd web/backend && python -m pytest tests/test_level_up_life.py -v`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add web/backend/tests/test_level_up_life.py
git commit -m "test: add Level Up Life integration tests for scenarios, prompts, and tier gating"
```

### Task 18: Remove Old Calculator UI (Keep Backward Compat)

**Files:**
- Modify: `apps/life-skills/src/LevelUpLifeApp.tsx`

- [ ] **Step 1: Verify old LifeSkillsApp.tsx is no longer imported**

Check that `main.tsx` imports `LevelUpLifeApp` (done in Task 7). The old `LifeSkillsApp.tsx` file can remain in the codebase for reference but should not be imported anywhere.

- [ ] **Step 2: Verify the app still handles legacy tool_invoke for backward compat**

In `LevelUpLifeApp.tsx`, ensure the message handler still responds to `tool_invoke` messages with a `tool_result` directing users to the new UI:

```typescript
// In the handleMessage useEffect, add a legacy handler:
case 'tool_invoke':
  // Backward compat: respond to old-style tool invocations
  window.parent.postMessage({
    type: 'tool_result',
    correlationId: msg.correlationId,
    data: { message: 'Please use the Level Up Life scenario picker to get started!' },
  }, '*')
  break
```

- [ ] **Step 3: Build and verify**

Run: `cd apps/life-skills && pnpm build`
Expected: Build succeeds

- [ ] **Step 4: Run all backend tests**

Run: `cd web/backend && python -m pytest tests/ -v`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add apps/life-skills/src/
git commit -m "feat: finalize Level Up Life, add legacy tool_invoke backward compat"
```

### Task 19: Final Build and Smoke Test

- [ ] **Step 1: Build iframe app**

Run: `cd apps/life-skills && pnpm build`
Expected: Clean build, no errors

- [ ] **Step 2: Build frontend**

Run: `cd web/frontend && pnpm build`
Expected: Clean build, no errors

- [ ] **Step 3: Run all backend tests**

Run: `cd web/backend && python -m pytest tests/ -v`
Expected: All tests pass

- [ ] **Step 4: Run frontend tests**

Run: `cd web/frontend && pnpm vitest run`
Expected: All tests pass

- [ ] **Step 5: Commit any final fixes**

```bash
git add -A
git commit -m "chore: Level Up Life final build verification"
```
