import { useState, useEffect, useCallback } from 'react';
import {
  Screen,
  Tier,
  ScenarioInfo,
  SimulationState,
  RecapSummary,
  ChoiceOption,
  VisualUpdate,
} from './types';
import ScenarioPickerScreen from './components/ScenarioPickerScreen';
import SimulationScreen from './components/SimulationScreen';
import RecapScreen from './components/RecapScreen';

function sendToPlatform(type: string, correlationId: string, data: Record<string, unknown>) {
  window.parent.postMessage({ type, correlationId, data }, '*');
}

export default function LevelUpLifeApp() {
  const [screen, setScreen] = useState<Screen>('picker');
  const [tier, setTier] = useState<Tier>(1);
  const [scenarios, setScenarios] = useState<ScenarioInfo[]>([]);
  const [simulation, setSimulation] = useState<SimulationState | null>(null);
  const [recap, setRecap] = useState<RecapSummary | null>(null);

  // Send ui_ready on mount
  useEffect(() => {
    sendToPlatform('ui_ready', '', {});
  }, []);

  const handleScenarioSelected = useCallback(
    (scenarioId: string) => {
      sendToPlatform('scenario_selected', '', { scenarioId, tier });
    },
    [tier]
  );

  const handleChoiceMade = useCallback(
    (choiceId: string) => {
      const correlationId = simulation?.scenarioId || '';
      sendToPlatform('choice_made', correlationId, { choiceId });
    },
    [simulation]
  );

  const handleRestart = useCallback(() => {
    setScreen('picker');
    setSimulation(null);
    setRecap(null);
    sendToPlatform('ui_ready', '', {});
  }, []);

  // Message router
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const msg = event.data;
      if (!msg || typeof msg.type !== 'string') return;

      switch (msg.type) {
        case 'scenario_start': {
          const { tier: msgTier, scenarios: msgScenarios } = msg;
          setTier(msgTier || 1);
          setScenarios(msgScenarios || []);
          setScreen('picker');
          setSimulation(null);
          setRecap(null);
          break;
        }

        case 'scenario_event': {
          const {
            correlationId,
            eventType,
            description,
            choices,
            visualUpdate,
          } = msg as {
            correlationId: string;
            eventType: 'choice' | 'info' | 'surprise';
            description: string;
            choices?: ChoiceOption[];
            visualUpdate: VisualUpdate;
          };

          setSimulation((prev) => {
            const base = prev || {
              tier,
              scenarioId: correlationId,
              scenarioTitle: '',
              domain: 'money' as const,
              balance: 0,
              items: [],
              progress: 0,
              currentEvent: null,
              decisions: [],
            };
            return {
              ...base,
              balance: visualUpdate.balance ?? base.balance,
              items: visualUpdate.items ?? base.items,
              progress: visualUpdate.progress ?? base.progress,
              currentEvent: {
                eventType,
                description,
                choices,
                visualUpdate,
              },
            };
          });
          setScreen('simulation');
          break;
        }

        case 'state_update': {
          const { balance, items, progress } = msg as {
            balance?: number;
            items?: string[];
            progress?: number;
          };
          setSimulation((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              balance: balance ?? prev.balance,
              items: items ?? prev.items,
              progress: progress ?? prev.progress,
            };
          });
          break;
        }

        case 'scenario_end': {
          const { summary } = msg as { summary: RecapSummary };
          setRecap(summary);
          setScreen('recap');
          break;
        }

        // Legacy backward compat
        case 'tool_invoke': {
          const { correlationId, tool } = msg as {
            correlationId: string;
            tool: string;
          };
          if (tool === 'restore_state') {
            sendToPlatform('tool_result', correlationId, {
              tool: 'restore_state',
              message: 'Restored',
            });
          } else {
            sendToPlatform('tool_result', correlationId, {
              tool,
              message: 'Use Level Up Life scenario picker',
            });
          }
          break;
        }

        default:
          break;
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [tier]);

  return (
    <div
      style={{
        maxWidth: '480px',
        width: '100%',
        margin: '0 auto',
        fontFamily: 'system-ui, sans-serif',
        minHeight: '100vh',
        background: '#fafafa',
      }}
    >
      {screen === 'picker' && (
        <ScenarioPickerScreen
          scenarios={scenarios}
          tier={tier}
          onSelect={handleScenarioSelected}
        />
      )}
      {screen === 'simulation' && simulation && (
        <SimulationScreen state={simulation} onChoose={handleChoiceMade} />
      )}
      {screen === 'recap' && recap && (
        <RecapScreen summary={recap} tier={tier} onRestart={handleRestart} />
      )}
    </div>
  );
}
