# Level Up Life — Design Spec

**Date:** April 1, 2026
**Status:** Approved
**Replaces:** Life Skills Toolkit (apps/life-skills)

## Overview

Level Up Life transforms the current Life Skills Toolkit — three dry form-based calculators (budget planner, compound interest calculator, schedule optimizer) — into a four-tier, four-domain interactive simulation engine where the AI tutor narrates scenarios and the iframe renders illustrated, tappable experiences.

Students pick goals from scenario cards, make choices through illustrated scenes, and see animated consequences. The tutor adapts narrative complexity by tier while the iframe adapts visual complexity. Every session ends with a shareable recap.

## Design Principles

1. **Cognitive operation, not topic, defines tier progression** — the same life skill domain appears at every age; what changes is the mental operation required (binary choice → tracking → trade-off analysis → abstract projection)
2. **The AI tutor drives the experience** — the tutor narrates, reacts, and teaches; the iframe visualizes and collects input
3. **Consequence-driven engagement** — no badges, XP, or leaderboards; choices with visible consequences ARE the engagement mechanism
4. **Positive framing always** — no scarcity stress, no failure states, no anxiety triggers
5. **Age adaptation in the agent prompt, not the UI** — same components render differently per tier

## Architecture

### Core Flow

```
Student opens Level Up Life
  → Iframe shows scenario cards (goal picker) organized by domain
  → Student taps a scenario (e.g., "Save for a Bike")
  → Iframe sends scenario_selected to tutor via PostMessage
  → Tutor starts narrating in chat ("Great! You earn $10/week...")
  → Tutor pushes scenario_event to iframe via PostMessage
  → Iframe renders illustrated visuals (jar filling, coins stacking)
  → Iframe presents choice buttons (spend/save/wait)
  → Student taps a choice → iframe sends choice_made to tutor
  → Tutor reacts, advances scenario (surprise expense, new opportunity)
  → Loop until scenario resolves
  → Tutor delivers recap → iframe renders RecapScreen
```

### Four Tiers

| Tier | Ages | Cognitive Operation | Piaget Stage | Iframe Experience |
|------|------|-------------------|--------------|-------------------|
| 1 | 5-6 | Binary choice | Preoperational → Early concrete | Full storybook illustrations, big tappable icons, no text required |
| 2 | 7-9 | Tracking & planning | Concrete operational | Illustrated items + simplified charts, visual jars/progress bars |
| 3 | 10-11 | Trade-off analysis | Late concrete → Early formal | Interactive dashboards, sliders, multi-category visuals |
| 4 | 12+ | Abstract projection | Formal operational | Full simulation dashboards, animated charts, growth curves |

### Four Domains

Every tier covers all four domains:

- **Money** — earning, spending, saving, budgeting, investing
- **Time** — routines, scheduling, planning, deadline management
- **Health** — nutrition, meal planning, food groups, balanced eating
- **Social** — emotions, decisions, conflict resolution, goal-setting

### Age-Tier Gating (LangGraph Agent)

```python
if intent == "level-up-life":
    age_tier = get_user_age_tier(user_id)  # 1, 2, 3, or 4

    tier 1 → block all tool dispatch, enter narrative_simulation mode
    tier 2 → allow only plan_budget (simplified), enter guided_simulation mode
    tier 3 → allow plan_budget + optimize_schedule, enter coached_simulation mode
    tier 4 → allow all tools, enter full_simulation mode
```

### Capability Check (Soft Tier Override)

On first Level Up Life session, the tutor asks exactly 3 questions — one per tier boundary — testing cognitive operations (not domain knowledge). The check runs once and the result is stored in the user profile. Students or teachers can request a re-assessment at any time.

- **Tier 1→2 check:** "You have 5 coins and want a toy that costs 8. What could you do?" (Tracking: "save 3 more" = Tier 2; "I can't" = Tier 1)
- **Tier 2→3 check:** "You have $20 for snacks and decorations. If you spend $12 on decorations, what could you do with the rest?" (Trade-off: "fewer snacks so maybe cheaper decorations" = Tier 3; "$8 of snacks" = Tier 2)
- **Tier 3→4 check:** "If you save $10/month at 5% interest, would you have more or less than $120 after a year? Why?" (Abstract projection = Tier 4)

The check starts at the boundary nearest the student's age-based default tier (e.g., a 10-year-old starts at the Tier 2→3 check). If they pass, the Tier 3→4 check follows. If they fail, they stay at their age default. Result stored in user profile as `capability_tier_override`.

## PostMessage Protocol

### Tutor → Iframe (Downstream)

```typescript
// Load scenario picker with available scenarios for this tier
type ScenarioStart = {
  type: "scenario_start"
  correlationId: string
  tier: 1 | 2 | 3 | 4
  scenarios: {
    id: string
    title: string
    domain: "money" | "time" | "health" | "social" | "combo"
    icon: string        // SVG identifier
    description: string // short, age-appropriate
  }[]
}

// Push a scenario event (choice, update, or narration)
type ScenarioEvent = {
  type: "scenario_event"
  correlationId: string
  eventType: "choice" | "info" | "surprise"
  description: string
  choices?: {
    id: string
    label: string
    icon: string
    cost?: number
    effect?: string
  }[]
  visualUpdate: {
    scene: string       // SVG scene identifier
    balance?: number
    items?: string[]
    progress?: number   // 0-100
    animationCue?: string
  }
}

// Direct state update (no choice required)
type StateUpdate = {
  type: "state_update"
  correlationId: string
  balance?: number
  items?: string[]
  progress?: number
  visualCue?: string
}

// End scenario, trigger recap
type ScenarioEnd = {
  type: "scenario_end"
  correlationId: string
  summary: {
    domain: string
    scenarioTitle: string
    decisions: { turn: number; choice: string; outcome: string }[]
    takeaway: string
    illustration: string // scene identifier for recap card
  }
}
```

### Iframe → Tutor (Upstream)

```typescript
type UiReady = { type: "ui_ready" }

type ScenarioSelected = {
  type: "scenario_selected"
  scenarioId: string
  tier: 1 | 2 | 3 | 4
}

type ChoiceMade = {
  type: "choice_made"
  correlationId: string
  choiceId: string
  value?: number // for slider inputs
  context?: string
}

type SliderChanged = {
  type: "slider_changed"
  correlationId: string
  field: string
  value: number
}
```

### Backward Compatibility

Existing `tool_invoke` / `tool_result` messages remain for any legacy integration. The new protocol takes over for all Level Up Life interactions.

## Iframe Component Architecture

```
LevelUpLifeApp (root — message router, tier state)
├── ScenarioPickerScreen
│   ├── DomainTab ("Money" | "Time" | "Health" | "Social" | "Combo")
│   └── ScenarioCard (illustrated, tappable)
├── SimulationScreen
│   ├── SceneRenderer (tier-specific illustrated scenes)
│   │   ├── Tier1Scene (full storybook illustrations, big icons)
│   │   ├── Tier2Scene (illustrated items + simplified charts)
│   │   ├── Tier3Scene (dashboard with charts + interactive elements)
│   │   └── Tier4Scene (full simulation dashboard)
│   ├── ChoicePanel
│   │   ├── Tier1Choices (2 big illustrated buttons, min 64px tap target)
│   │   ├── Tier2Choices (3 options + simple slider, whole numbers)
│   │   ├── Tier3Choices (sliders + multi-category allocation)
│   │   └── Tier4Choices (inputs, sliders, multi-variable controls)
│   ├── StatusBar
│   │   ├── CoinJar (Tier 1 — animated jar filling with coins)
│   │   ├── ProgressBar (Tier 2 — colored bar toward goal)
│   │   ├── BudgetBreakdown (Tier 3 — segmented bar chart)
│   │   └── DashboardMetrics (Tier 4 — animated charts + growth curves)
│   └── EventBubble (scenario event narration, tier-styled)
└── RecapScreen (end-of-session summary card, shareable)
```

### Visual Approach

All illustrations are CSS/SVG-based — no external image assets. Flat/geometric illustration style. Performant on Chromebooks.

- **Tier 1:** Full-screen illustrated scenes. Warm, saturated colors. Coins animate in/out of jar. Choice buttons are large with icons only (pre-reader friendly). Scene transitions use simple fade/slide.
- **Tier 2:** Split layout — illustrated scene on top, interactive area below. Visual jar/progress metaphor. Choices include text labels + icons. Horizontal bar for spending categories.
- **Tier 3:** Dashboard layout with illustrated accents. Animated bar charts for budget categories. Sliders for allocation. More data, less illustration.
- **Tier 4:** Professional but friendly dashboard. Animated line charts for growth over time. Multi-input forms. Illustrated elements become subtle icons.

### Shared Components

- `CoinAnimation` — coins flying into/out of container
- `ProgressRing` — circular progress toward goal
- `EventBubble` — scenario narration with tier-appropriate styling
- `AnimatedBar` — CSS-animated horizontal bar chart segment
- `GrowthCurve` — SVG line chart for compound growth (Tier 4 only)

## Agent-Side Design

### Simulation State

The agent manages simulation state in conversation context (ephemeral, per-session):

```python
simulation_state = {
    "scenario_id": "lemonade_stand",
    "tier": 1,
    "domain": "money",
    "turn": 3,
    "max_turns": 6,
    "balance": 2,
    "inventory": ["lemons"],
    "decisions_made": [
        {"turn": 1, "choice": "lemons", "outcome": "spent 3 coins"},
        {"turn": 2, "choice": "set_price_high", "outcome": "fewer sales"}
    ],
    "events_remaining": ["rain", "big_customer", "restock_decision"],
    "learning_objectives": ["things cost money", "earning through effort"]
}
```

### Curated Scenario Seeds

Stored as JSON in the backend. Each seed defines:

- `id`, `title`, `tier`, `domain`, `icon`
- `learning_objectives` — what the student should practice
- `initial_state` — starting balance/items/context
- `events` — ordered list of turns with choice templates and consequence logic
- `recap_template` — what to summarize at the end
- `positive_framing_rules` — domain-specific guardrails
- `ai_variation_allowed` — what the tutor can change (item names, flavor text) vs. what's fixed (structure, stakes, learning objectives)

### System Prompt Additions (per tier)

- **Tier 1:** "Use short sentences. Max 15 words per message. Use emoji. Never mention percentages or decimals. Frame all outcomes positively. Use story language ('Once upon a time...', 'Oh no! It started raining!')."
- **Tier 2:** "Use whole dollar amounts only. Explain trade-offs simply. Ask 'why did you choose that?' after each decision. No compound interest concepts. Encourage tracking ('Let's see how much you've spent so far')."
- **Tier 3:** "Introduce real-world framing. Use percentages where appropriate. Ask Socratic follow-up questions. Encourage comparison ('Which option gives you more value?'). Introduce opportunity cost language."
- **Tier 4:** "Teach concepts as they arise. Use real-world amounts. Introduce compound growth, risk/reward, and long-term projection. Ask 'what would happen if...?' questions. Reference formulas when relevant."

## Scenario Content

### Tier 1 (Ages 5-6) — Binary Choice

**Money:**
1. Toy Shop Choices — 5 coins at a toy shop, can't buy everything (wants vs needs)
2. Lemonade Stand — earn coins selling, decide what to buy/restock (earning, spending)
3. Saving Jar — earn 1 coin per turn, save for big prize or spend on small treats (delayed gratification)
4. Party Planner — pick 3 items from 6 for a birthday party within coin budget (choosing within limits)

**Time:**
1. Morning Routine Builder — sequence 3-4 morning tasks in order (routine building)
2. Getting Ready Race — pick what to do first when you're running late (prioritization basics)
3. Bedtime Countdown — 3 activities before bed, pick order (sequencing)

**Health:**
1. Build a Snack Plate — drag fruits/veggies/treats onto a plate (food group ID)
2. Fruit or Cookie? — binary choice stories about snack time (wants vs needs, health)
3. Lunch Box Packer — pick 3 items for your lunch box from options (choosing within limits)

**Social:**
1. Sharing Fair — decide how to share 6 toys with a friend (fairness, sharing)
2. How Does That Feel? — story scenarios, pick the emotion face (emotion labeling)
3. Making Friends — choose kind vs unkind responses in scenarios (social choices)

**Combo:**
- Plan a Picnic — pick food (health) + share with friends (social) + spend coins (money) + decide order of activities (time)

### Tier 2 (Ages 7-9) — Tracking & Planning

**Money:**
1. Weekly Allowance — $10/week, plan spending for a month (recurring budget)
2. Bake Sale Business — invest in ingredients, set prices, handle demand (cost vs revenue)
3. Pet Care Budget — budget for adopting a pet: food, toys, vet visits (ongoing vs one-time)
4. Garage Sale — decide what to sell and set prices, track earnings (earning, pricing)

**Time:**
1. Plan My School Day — block-schedule homework, play, chores (visual scheduling)
2. Homework Scheduler — 4 assignments, estimate time, plan order (time estimation)
3. Weekend Planner — fit activities into Saturday with time slots (constraint planning)

**Health:**
1. Pack a Lunch Box — balanced meal from options, hits all food groups (meal planning)
2. Balanced Plate Builder — assemble meals hitting MyPlate categories (nutrition basics)
3. Snack Shop — pick snacks within a budget that include fruits/protein (health + money)

**Social:**
1. Plan a Playdate — decide activities, handle disagreements (collaborative planning)
2. Team Decision — group has different preferences, find a fair choice (negotiation)
3. Goal Tracker — set a 1-week goal, check in each "day" (goal-setting)

**Combo:**
- Plan a Birthday Party — budget for supplies (money) + schedule activities (time) + pick food (health) + invite friends and handle preferences (social)

### Tier 3 (Ages 10-11) — Trade-off Analysis

**Money:**
1. School Dance Budget — $50 for decorations, snacks, music; unexpected costs arise (multi-category budgeting)
2. Comparison Shopper — find best value across stores/brands with unit pricing (comparative analysis)
3. Club Treasurer — manage $500 club budget across events and supplies (multi-stakeholder budgeting)
4. Savings Goal Tracker — save for a $200 item over 8 weeks with competing wants (long-term saving)

**Time:**
1. Busy Week Juggler — balance homework, sports, friends, chores with conflicts (priority scheduling)
2. Study Planner — allocate study hours across subjects before exams (weighted prioritization)
3. Event Coordinator — plan a multi-day school event timeline (project-style planning)

**Health:**
1. Nutrition Label Detective — compare products using real nutrition labels (label reading)
2. Recipe Cost Calculator — price out recipes, find cheaper substitutions (nutrition + money)
3. Meal Prep Challenge — plan 5 dinners within a budget hitting nutrition targets (integrated planning)

**Social:**
1. Should I Join? — decision matrix for choosing between clubs/activities (structured decision-making)
2. Group Project Planner — assign roles, manage workload, handle slackers (team management)
3. Multi-Week Goal — set a 4-week goal with milestones, handle setbacks (resilient goal-setting)

**Combo:**
- Run a School Fair Booth — budget (money), schedule shifts (time), healthy snack menu (health), team decisions and customer interactions (social)

### Tier 4 (Ages 12+) — Abstract Projection

**Money:**
1. First Apartment — $1,500/month for rent, utilities, food, transport, savings (real-world budgeting)
2. Summer Savings + Interest — part-time job income, save with compound interest (compound growth)
3. Side Hustle Simulator — lawn mowing/tutoring business, invest in equipment (entrepreneurship)
4. College Cost Planner — compare schools, scholarships, loans, projected ROI (long-term financial planning)

**Time:**
1. Project Deadline Manager — multi-week project with dependencies and milestones (project management)
2. College App Timeline — manage applications, essays, tests across months (complex scheduling)
3. Work-Life Balance Sim — part-time job + school + social life with trade-offs (holistic time management)

**Health:**
1. Meal Prep on a Budget — weekly meal plan with dietary constraints + $50 budget (integrated optimization)
2. Diet + Fitness Planner — nutrition goals aligned with athletic training (multi-variable planning)
3. Cooking for One — plan, shop, prep meals for independent living (practical life skill)

**Social:**
1. Conflict Resolver — workplace/school conflict scenarios with multiple perspectives (perspective-taking)
2. Job Interview Prep — practice scenarios with feedback from tutor (professional skills)
3. Negotiation Sim — negotiate a raise, a deadline extension, or a group decision (persuasion, compromise)

**Combo:**
- Plan Your Gap Year — travel budget (money), itinerary (time), nutrition abroad (health), risk management and cultural sensitivity (social)

## Safety Guardrails

### By Domain

| Domain | Rule | Implementation |
|--------|------|----------------|
| Money | No scarcity stress | "You've used your coins for now" not "you're broke." No debt, overdue bills, or punishment |
| Money | No class-based comparisons | Never reference family income, neighborhood, or economic status |
| Health | No body shaming or diet culture | "Foods that give you energy" not "healthy vs unhealthy." No calorie counting Tiers 1-3. No weight references |
| Health | No food insecurity triggers | Assume food access. "Choose what to put on your plate" not "you can only afford..." |
| Social | No peer pressure framing | Present choices neutrally. Never "everyone else is doing X" |
| Social | No conflict escalation | Always model de-escalation. No bullying simulation |
| Time | No deadline anxiety | "Let's figure out a plan" not "you're running out of time." No failure states |
| All | Positive outcomes always | Every scenario ends with constructive learning moment |
| All | AI variation limits | Tutor can swap item names/flavor text. Cannot change structure, stakes, or exceed tier's cognitive level |
| All | No PII in scenarios | Never ask for real names, schools, addresses, family details |

### Content Moderation Stack

1. Curated seed scenarios — hand-reviewed before shipping
2. System prompt guardrails — tier-specific and domain-specific framing rules
3. OpenAI content filter — existing platform moderation
4. AI variation constraints — structural limits on tutor generation

### End-of-Session Recap

Tutor generates "Here's what you practiced today":
- Domain(s) explored
- Key decisions made
- One positive takeaway
- Framed for screenshot-sharing to parents/guardians
- Iframe renders RecapScreen: illustrated card with scenario art, decision path, and takeaway message
- Tier 1: mostly icons; Tier 4: text-rich

## Scope

### Phase 1 (Building Now)

- Four-tier age-gated simulation engine
- Bidirectional PostMessage protocol
- Illustrated iframe with tier-specific components (CSS/SVG)
- Scenario picker with domain tabs and goal cards
- ~48-64 curated seed scenarios (3-4 per tier per domain)
- 4 cross-domain combo scenarios (1 per tier)
- 3-5 question capability check for soft tier override
- age_tier gating in LangGraph agent tool dispatch
- Tier-specific system prompt additions
- RecapScreen for shareable end-of-session summary
- Safety guardrails across all domains

### Phase 2 (Future)

- Parent dashboard with session history
- Voice/text-to-speech for Tier 1 pre-readers
- Neurodivergence accommodation mode (wider tier overlap, adjusted pacing)
- Dynamic difficulty adjustment beyond initial capability check
- Persistent cross-session state and simulation save/resume
- Additional scenario seeds based on usage data
- Multiplayer/collaborative scenarios
- Decision matrix and meal planner as standalone tools (if demand warrants)

### Removed

- Three standalone calculator forms (budget, interest, schedule) — replaced by simulation engine
- Old PostMessage protocol remains for backward compatibility but is superseded

## Research References

- **Piaget** — preoperational (2-7), concrete operational (7-11), formal operational (11+)
- **Erikson** — Industry vs Inferiority (6-12), Identity vs Role Confusion (12-18)
- **Vygotsky** — Zone of Proximal Development, scaffolded instruction
- **Diamond (2013)** — Executive function development as bottleneck for skill acquisition
- **Best & Miller (2010)** — Executive function development in childhood: time estimation, planning capacity
- **Huizinga et al. (2006)** — Executive function maturation in late childhood
- **Mischel (1972), Watts et al. (2018)** — Delayed gratification, trainable at ages 5-6
- **Sonuga-Barke & Webley (1993)** — Children ages 6-9 can operate saving strategies with structure
- **Berti & Bombi (1988)** — Economic understanding in young children
- **Otto (2013)** — Financial socialization of youth
- **Moffitt et al. (2011, Dunedin study)** — SEL at age 5 predicts financial behavior at 25
- **Selman (1980)** — Social perspective-taking development
- **Reyna (fuzzy-trace theory)** — Adolescent risk assessment and decision-making
- **Jump$tart Coalition** — National Standards for K-12 Personal Finance Education
- **Council for Economic Education** — National Standards for Financial Literacy
- **CASEL** — Social-Emotional Learning competency framework
- **USDA MyPlate** — K-1 nutrition education curriculum
- **FDA** — Nutrition label education standards

## Council Sessions

This design was informed by three LLM Council sessions:

1. **Life Skills K-12 Redesign** (council-report-20260401-180029.html) — Transform calculators into tutor-driven simulations
2. **Young Kids & Financial Literacy** (council-report-20260401-180714.html) — Age-appropriate tiers, safety guardrails
3. **Age-Appropriate Life Skills Mapping** (council-report-20260401-182552.html) — Four-tier, four-domain model grounded in developmental research
