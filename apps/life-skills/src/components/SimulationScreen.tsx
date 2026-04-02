import { SimulationState } from '../types';
import StatusBar from './StatusBar';
import EventBubble from './EventBubble';
import ChoicePanel from './ChoicePanel';

interface SimulationScreenProps {
  state: SimulationState;
  onChoose: (choiceId: string) => void;
}

export default function SimulationScreen({ state, onChoose }: SimulationScreenProps) {
  const { tier, scenarioTitle, balance, items, progress, currentEvent } = state;

  return (
    <div style={{ padding: '16px', fontFamily: 'system-ui, sans-serif' }}>
      <div
        style={{
          fontSize: tier === 1 ? '18px' : '16px',
          fontWeight: 700,
          textAlign: 'center',
          color: '#1f2937',
          marginBottom: '12px',
        }}
      >
        {scenarioTitle}
      </div>

      <StatusBar tier={tier} balance={balance} progress={progress} items={items} />

      {currentEvent && (
        <>
          <EventBubble
            eventType={currentEvent.eventType}
            description={currentEvent.description}
            tier={tier}
          />
          {currentEvent.choices && currentEvent.choices.length > 0 && (
            <ChoicePanel
              choices={currentEvent.choices}
              tier={tier}
              onChoose={onChoose}
            />
          )}
        </>
      )}

      {!currentEvent && (
        <div
          style={{
            textAlign: 'center',
            padding: '32px 16px',
            color: '#9ca3af',
            fontSize: tier === 1 ? '16px' : '14px',
          }}
        >
          {tier === 1 ? 'Waiting for the story...' : 'Waiting for the next event...'}
        </div>
      )}
    </div>
  );
}
