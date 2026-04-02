// Platform → App
export interface PlatformMessage {
  type: 'tool_invoke' | 'tool_cancel' | 'state_request' | 'shutdown'
  correlationId: string
  tool: string
  params: Record<string, unknown>
}

// App → Platform
export interface AppMessage {
  type: 'tool_result' | 'state_update' | 'completion' | 'error' | 'ui_ready'
  correlationId: string
  data: Record<string, unknown>
}

export function isPlatformMessage(msg: unknown): msg is PlatformMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    'correlationId' in msg &&
    typeof (msg as PlatformMessage).type === 'string' &&
    ['tool_invoke', 'tool_cancel', 'state_request', 'shutdown'].includes((msg as PlatformMessage).type)
  )
}

export function isAppMessage(msg: unknown): msg is AppMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    typeof (msg as AppMessage).type === 'string' &&
    ['tool_result', 'state_update', 'completion', 'error', 'ui_ready'].includes((msg as AppMessage).type)
  )
}

export function createCorrelationId(): string {
  return crypto.randomUUID()
}

// ─── Level Up Life Types ─────────────────────────────────────────────

export type Domain =
  | 'finance'
  | 'health'
  | 'social'
  | 'career'
  | 'household'
  | 'safety'

export type Tier = 'beginner' | 'intermediate' | 'advanced'

export interface ScenarioInfo {
  scenarioId: string
  title: string
  domain: Domain
  tier: Tier
  description: string
  estimatedMinutes: number
}

export interface ChoiceOption {
  id: string
  label: string
  description?: string
}

export interface VisualUpdate {
  component: string
  props: Record<string, unknown>
}

export interface DecisionRecord {
  stepIndex: number
  choiceId: string
  timestamp: number
  reasoning?: string
}

// ─── Level Up Life: Platform → iframe ────────────────────────────────

export interface ScenarioStartMessage {
  type: 'scenario_start'
  correlationId: string
  scenario: ScenarioInfo
}

export interface ScenarioEventMessage {
  type: 'scenario_event'
  correlationId: string
  stepIndex: number
  prompt: string
  choices: ChoiceOption[]
  visual?: VisualUpdate
}

export interface LevelUpStateUpdate {
  type: 'levelup_state_update'
  correlationId: string
  xp: number
  level: number
  domainScores: Partial<Record<Domain, number>>
}

export interface ScenarioEndMessage {
  type: 'scenario_end'
  correlationId: string
  scenarioId: string
  outcome: 'completed' | 'abandoned' | 'timeout'
  xpAwarded: number
  feedback: string
  decisions: DecisionRecord[]
}

// ─── Level Up Life: iframe → Platform ────────────────────────────────

export interface ScenarioSelectedMessage {
  type: 'scenario_selected'
  correlationId: string
  scenarioId: string
  sessionToken: string
}

export interface ChoiceMadeMessage {
  type: 'choice_made'
  correlationId: string
  stepIndex: number
  choiceId: string
  sessionToken: string
  reasoning?: string
}

export interface SliderChangedMessage {
  type: 'slider_changed'
  correlationId: string
  sliderId: string
  value: number
}

// ─── Level Up Life: Union Types ──────────────────────────────────────

export type LevelUpPlatformMessage =
  | ScenarioStartMessage
  | ScenarioEventMessage
  | LevelUpStateUpdate
  | ScenarioEndMessage

export type LevelUpAppMessage =
  | ScenarioSelectedMessage
  | ChoiceMadeMessage
  | SliderChangedMessage

// ─── Level Up Life: Validators ───────────────────────────────────────

const LEVELUP_PLATFORM_TYPES = [
  'scenario_start',
  'scenario_event',
  'levelup_state_update',
  'scenario_end',
] as const

const LEVELUP_APP_TYPES = [
  'scenario_selected',
  'choice_made',
  'slider_changed',
] as const

export function isLevelUpPlatformMessage(msg: unknown): msg is LevelUpPlatformMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    'correlationId' in msg &&
    typeof (msg as LevelUpPlatformMessage).type === 'string' &&
    (LEVELUP_PLATFORM_TYPES as readonly string[]).includes(
      (msg as LevelUpPlatformMessage).type
    )
  )
}

export function isLevelUpAppMessage(msg: unknown): msg is LevelUpAppMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    'correlationId' in msg &&
    typeof (msg as LevelUpAppMessage).type === 'string' &&
    (LEVELUP_APP_TYPES as readonly string[]).includes(
      (msg as LevelUpAppMessage).type
    )
  )
}
