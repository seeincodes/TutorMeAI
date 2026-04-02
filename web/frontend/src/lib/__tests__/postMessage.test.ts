import { describe, it, expect } from 'vitest'
import {
  isPlatformMessage,
  isAppMessage,
  isLevelUpPlatformMessage,
  isLevelUpAppMessage,
  createCorrelationId,
  type ScenarioStartMessage,
  type ScenarioEventMessage,
  type LevelUpStateUpdate,
  type ScenarioEndMessage,
  type ScenarioSelectedMessage,
  type ChoiceMadeMessage,
  type SliderChangedMessage,
} from '../postMessage'

// ─── Legacy message validation ───────────────────────────────────────

describe('legacy PlatformMessage', () => {
  it('validates tool_invoke', () => {
    const msg = {
      type: 'tool_invoke',
      correlationId: 'abc-123',
      tool: 'calculator',
      params: { expr: '2+2' },
    }
    expect(isPlatformMessage(msg)).toBe(true)
  })

  it('validates all platform types', () => {
    for (const type of ['tool_invoke', 'tool_cancel', 'state_request', 'shutdown']) {
      expect(
        isPlatformMessage({ type, correlationId: 'id', tool: 't', params: {} })
      ).toBe(true)
    }
  })

  it('rejects unknown type', () => {
    expect(
      isPlatformMessage({ type: 'unknown', correlationId: 'id' })
    ).toBe(false)
  })
})

describe('legacy AppMessage', () => {
  it('validates tool_result', () => {
    const msg = {
      type: 'tool_result',
      correlationId: 'abc-123',
      data: { result: 4 },
    }
    expect(isAppMessage(msg)).toBe(true)
  })

  it('validates all app types', () => {
    for (const type of ['tool_result', 'state_update', 'completion', 'error', 'ui_ready']) {
      expect(isAppMessage({ type, correlationId: 'id', data: {} })).toBe(true)
    }
  })

  it('rejects unknown type', () => {
    expect(isAppMessage({ type: 'scenario_start', correlationId: 'id' })).toBe(false)
  })
})

describe('createCorrelationId', () => {
  it('returns a string', () => {
    expect(typeof createCorrelationId()).toBe('string')
  })

  it('returns unique values', () => {
    const a = createCorrelationId()
    const b = createCorrelationId()
    expect(a).not.toBe(b)
  })
})

// ─── Level Up Life: Platform → iframe ────────────────────────────────

describe('isLevelUpPlatformMessage', () => {
  it('validates scenario_start', () => {
    const msg: ScenarioStartMessage = {
      type: 'scenario_start',
      correlationId: 'c-1',
      scenario: {
        scenarioId: 's-1',
        title: 'Budget Basics',
        domain: 'finance',
        tier: 'beginner',
        description: 'Learn to budget',
        estimatedMinutes: 10,
      },
    }
    expect(isLevelUpPlatformMessage(msg)).toBe(true)
  })

  it('validates scenario_event', () => {
    const msg: ScenarioEventMessage = {
      type: 'scenario_event',
      correlationId: 'c-2',
      stepIndex: 0,
      prompt: 'What would you do?',
      choices: [
        { id: 'a', label: 'Option A' },
        { id: 'b', label: 'Option B', description: 'More detail' },
      ],
    }
    expect(isLevelUpPlatformMessage(msg)).toBe(true)
  })

  it('validates scenario_event with visual update', () => {
    const msg: ScenarioEventMessage = {
      type: 'scenario_event',
      correlationId: 'c-2',
      stepIndex: 1,
      prompt: 'Next step',
      choices: [{ id: 'a', label: 'Continue' }],
      visual: { component: 'ProgressBar', props: { percent: 50 } },
    }
    expect(isLevelUpPlatformMessage(msg)).toBe(true)
  })

  it('validates levelup_state_update', () => {
    const msg: LevelUpStateUpdate = {
      type: 'levelup_state_update',
      correlationId: 'c-3',
      xp: 150,
      level: 2,
      domainScores: { finance: 80, health: 60 },
    }
    expect(isLevelUpPlatformMessage(msg)).toBe(true)
  })

  it('validates scenario_end', () => {
    const msg: ScenarioEndMessage = {
      type: 'scenario_end',
      correlationId: 'c-4',
      scenarioId: 's-1',
      outcome: 'completed',
      xpAwarded: 50,
      feedback: 'Great job!',
      decisions: [
        { stepIndex: 0, choiceId: 'a', timestamp: Date.now() },
        { stepIndex: 1, choiceId: 'b', timestamp: Date.now(), reasoning: 'Seemed best' },
      ],
    }
    expect(isLevelUpPlatformMessage(msg)).toBe(true)
  })

  it('rejects legacy platform message types', () => {
    expect(
      isLevelUpPlatformMessage({ type: 'tool_invoke', correlationId: 'id' })
    ).toBe(false)
  })

  it('rejects null', () => {
    expect(isLevelUpPlatformMessage(null)).toBe(false)
  })

  it('rejects string', () => {
    expect(isLevelUpPlatformMessage('scenario_start')).toBe(false)
  })

  it('rejects object without correlationId', () => {
    expect(isLevelUpPlatformMessage({ type: 'scenario_start' })).toBe(false)
  })

  it('rejects object without type', () => {
    expect(isLevelUpPlatformMessage({ correlationId: 'id' })).toBe(false)
  })
})

// ─── Level Up Life: iframe → Platform ────────────────────────────────

describe('isLevelUpAppMessage', () => {
  it('validates scenario_selected with sessionToken', () => {
    const msg: ScenarioSelectedMessage = {
      type: 'scenario_selected',
      correlationId: 'c-10',
      scenarioId: 's-1',
      sessionToken: 'tok_abc123',
    }
    expect(isLevelUpAppMessage(msg)).toBe(true)
  })

  it('validates choice_made with sessionToken', () => {
    const msg: ChoiceMadeMessage = {
      type: 'choice_made',
      correlationId: 'c-11',
      stepIndex: 0,
      choiceId: 'a',
      sessionToken: 'tok_abc123',
    }
    expect(isLevelUpAppMessage(msg)).toBe(true)
  })

  it('validates choice_made with optional reasoning', () => {
    const msg: ChoiceMadeMessage = {
      type: 'choice_made',
      correlationId: 'c-11',
      stepIndex: 1,
      choiceId: 'b',
      sessionToken: 'tok_abc123',
      reasoning: 'I chose this because...',
    }
    expect(isLevelUpAppMessage(msg)).toBe(true)
  })

  it('validates slider_changed', () => {
    const msg: SliderChangedMessage = {
      type: 'slider_changed',
      correlationId: 'c-12',
      sliderId: 'risk-tolerance',
      value: 0.75,
    }
    expect(isLevelUpAppMessage(msg)).toBe(true)
  })

  it('rejects legacy app message types', () => {
    expect(
      isLevelUpAppMessage({ type: 'tool_result', correlationId: 'id' })
    ).toBe(false)
  })

  it('rejects null', () => {
    expect(isLevelUpAppMessage(null)).toBe(false)
  })

  it('rejects undefined', () => {
    expect(isLevelUpAppMessage(undefined)).toBe(false)
  })

  it('rejects number', () => {
    expect(isLevelUpAppMessage(42)).toBe(false)
  })

  it('rejects object without correlationId', () => {
    expect(isLevelUpAppMessage({ type: 'choice_made' })).toBe(false)
  })

  it('rejects object with non-string type', () => {
    expect(isLevelUpAppMessage({ type: 123, correlationId: 'id' })).toBe(false)
  })
})

// ─── Cross-validation: no overlap between old and new ────────────────

describe('no type overlap between legacy and Level Up Life', () => {
  const levelUpPlatformTypes = ['scenario_start', 'scenario_event', 'levelup_state_update', 'scenario_end']
  const levelUpAppTypes = ['scenario_selected', 'choice_made', 'slider_changed']

  it('Level Up platform types do not match legacy isPlatformMessage', () => {
    for (const type of levelUpPlatformTypes) {
      expect(
        isPlatformMessage({ type, correlationId: 'id', tool: 't', params: {} })
      ).toBe(false)
    }
  })

  it('Level Up app types do not match legacy isAppMessage', () => {
    for (const type of levelUpAppTypes) {
      expect(
        isAppMessage({ type, correlationId: 'id', data: {} })
      ).toBe(false)
    }
  })

  it('legacy platform types do not match isLevelUpPlatformMessage', () => {
    for (const type of ['tool_invoke', 'tool_cancel', 'state_request', 'shutdown']) {
      expect(
        isLevelUpPlatformMessage({ type, correlationId: 'id' })
      ).toBe(false)
    }
  })

  it('legacy app types do not match isLevelUpAppMessage', () => {
    for (const type of ['tool_result', 'state_update', 'completion', 'error', 'ui_ready']) {
      expect(
        isLevelUpAppMessage({ type, correlationId: 'id' })
      ).toBe(false)
    }
  })
})
