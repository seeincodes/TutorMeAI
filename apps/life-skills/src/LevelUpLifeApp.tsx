import { useState, useEffect, useCallback, useMemo } from 'react'
import type {
  Screen, Tier, Domain, ScenarioInfo, SimulationState, RecapSummary,
  DecisionRecord, ScenarioSeed, ChoiceOption,
} from './types'
import ScenarioPickerScreen from './components/ScenarioPickerScreen'
import SimulationScreen from './components/SimulationScreen'
import RecapScreen from './components/RecapScreen'
import allScenarios from './data/scenarios'

/** Derive tier from the ?grade= query param, default tier 2. */
function getTierFromUrl(): Tier {
  const params = new URLSearchParams(window.location.search)
  const grade = parseInt(params.get('grade') || '', 10)
  if (isNaN(grade)) return 2
  if (grade <= 1) return 1
  if (grade <= 4) return 2
  if (grade <= 6) return 3
  return 4
}

export default function LevelUpLifeApp() {
  const tier = useMemo<Tier>(getTierFromUrl, [])
  const [screen, setScreen] = useState<Screen>('picker')
  const [activeScenario, setActiveScenario] = useState<ScenarioSeed | null>(null)
  const [sim, setSim] = useState<SimulationState | null>(null)
  const [recap, setRecap] = useState<RecapSummary | null>(null)

  // Tell parent we're loaded
  useEffect(() => {
    window.parent.postMessage({ type: 'ui_ready' }, '*')
  }, [])

  // Filter scenarios for this tier
  const scenarios: ScenarioInfo[] = useMemo(() =>
    allScenarios
      .filter(s => s.tier === tier)
      .map(s => ({
        id: s.id,
        title: s.title,
        domain: s.domain as Domain,
        icon: s.icon,
        description: s.learning_objectives[0] || s.title,
      })),
    [tier],
  )

  const handleSelectScenario = useCallback((scenarioId: string) => {
    const seed = allScenarios.find(s => s.id === scenarioId)
    if (!seed) return

    setActiveScenario(seed)
    const firstEvent = seed.events[0]
    const balance = (seed.initial_state.wallet as number) ?? 0

    setSim({
      tier,
      scenarioId: seed.id,
      scenarioTitle: seed.title,
      domain: seed.domain as Domain,
      balance,
      items: [],
      progress: 0,
      currentEvent: firstEvent ? {
        eventType: firstEvent.event_type as 'choice' | 'info' | 'surprise',
        description: firstEvent.description,
        choices: firstEvent.choices as ChoiceOption[] | undefined,
        visualUpdate: { scene: seed.id, balance },
      } : null,
      decisions: [],
      eventIndex: 0,
    })
    setScreen('simulation')
  }, [tier])

  const handleChoice = useCallback((choiceId: string) => {
    if (!sim || !activeScenario) return

    const currentEvent = activeScenario.events[sim.eventIndex]
    const choice = currentEvent?.choices?.find(c => c.id === choiceId)
    if (!choice) return

    // Apply cost
    const cost = choice.cost ?? 0
    const newBalance = sim.balance - cost
    const newItems = choice.effect
      ? [...sim.items, choice.label]
      : sim.items

    // Record decision
    const decision: DecisionRecord = {
      turn: sim.eventIndex + 1,
      choice: choice.label,
      outcome: choice.effect || 'Done!',
    }
    const newDecisions = [...sim.decisions, decision]

    // Advance to next event
    const nextIndex = sim.eventIndex + 1
    const nextEvent = activeScenario.events[nextIndex]
    const totalEvents = activeScenario.events.length
    const progress = Math.round(((nextIndex) / totalEvents) * 100)

    if (!nextEvent) {
      // Scenario complete — show effect briefly then go to recap
      setSim(prev => prev ? {
        ...prev,
        balance: newBalance,
        items: newItems,
        decisions: newDecisions,
        progress: 100,
        currentEvent: {
          eventType: 'info',
          description: choice.effect || 'Great job!',
          choices: undefined,
          visualUpdate: { scene: activeScenario.id, balance: newBalance, progress: 100 },
        },
        eventIndex: nextIndex,
      } : prev)

      // After a brief pause, show recap
      setTimeout(() => {
        setRecap({
          domain: activeScenario.domain,
          scenarioTitle: activeScenario.title,
          decisions: newDecisions,
          takeaway: activeScenario.recap_template
            .replace('{choices}', newDecisions.map(d => d.choice).join(', '))
            .replace('{balance}', String(newBalance))
            .replace('{initial_balance}', String(activeScenario.initial_state.wallet ?? 0)),
          illustration: activeScenario.icon,
        })
        setScreen('recap')
      }, 1500)
    } else {
      // Show effect of current choice briefly, then advance
      setSim(prev => prev ? {
        ...prev,
        balance: newBalance,
        items: newItems,
        decisions: newDecisions,
        progress,
        currentEvent: {
          eventType: 'info',
          description: choice.effect || 'Nice choice!',
          choices: undefined,
          visualUpdate: { scene: activeScenario.id, balance: newBalance, progress },
        },
        eventIndex: nextIndex,
      } : prev)

      // After brief pause, show next event
      setTimeout(() => {
        setSim(prev => prev ? {
          ...prev,
          currentEvent: {
            eventType: nextEvent.event_type as 'choice' | 'info' | 'surprise',
            description: nextEvent.description,
            choices: nextEvent.choices as ChoiceOption[] | undefined,
            visualUpdate: { scene: activeScenario.id, balance: newBalance, progress },
          },
        } : prev)
      }, 1200)
    }
  }, [sim, activeScenario])

  const handleRestart = useCallback(() => {
    setScreen('picker')
    setActiveScenario(null)
    setSim(null)
    setRecap(null)
  }, [])

  return (
    <div style={{
      maxWidth: 480, width: '100%', margin: '0 auto', padding: 16,
      fontFamily: 'system-ui, sans-serif', minHeight: '100vh', background: '#fafafa',
    }}>
      {screen === 'picker' && (
        <ScenarioPickerScreen
          scenarios={scenarios}
          tier={tier}
          onSelect={handleSelectScenario}
        />
      )}
      {screen === 'simulation' && sim && (
        <SimulationScreen state={sim} onChoose={handleChoice} />
      )}
      {screen === 'recap' && recap && (
        <RecapScreen summary={recap} tier={tier} onRestart={handleRestart} />
      )}
    </div>
  )
}
