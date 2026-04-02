import { useState } from 'react';
import { ChoiceOption, Tier } from '../types';

interface ChoicePanelProps {
  choices: ChoiceOption[];
  tier: Tier;
  onChoose: (choiceId: string) => void;
}

export default function ChoicePanel({ choices, tier, onChoose }: ChoicePanelProps) {
  const [pressedId, setPressedId] = useState<string | null>(null);

  if (tier === 1) {
    // Tier 1: 2 big buttons side-by-side, icons + labels, min 64px
    return (
      <div style={{ display: 'flex', gap: '12px', padding: '8px 0' }}>
        {choices.slice(0, 2).map((choice) => (
          <button
            key={choice.id}
            onClick={() => onChoose(choice.id)}
            onPointerDown={() => setPressedId(choice.id)}
            onPointerUp={() => setPressedId(null)}
            onPointerLeave={() => setPressedId(null)}
            style={{
              flex: 1,
              minHeight: '80px',
              padding: '16px 12px',
              borderRadius: '16px',
              border: '3px solid #e5e7eb',
              background: 'white',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontFamily: 'system-ui, sans-serif',
              transform: pressedId === choice.id ? 'scale(0.97)' : 'scale(1)',
              transition: 'transform 0.1s ease',
            }}
          >
            <span style={{ fontSize: '32px' }}>{choice.icon}</span>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#374151' }}>
              {choice.label}
            </span>
          </button>
        ))}
      </div>
    );
  }

  if (tier === 2) {
    // Tier 2: 3 stacked buttons
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px 0' }}>
        {choices.slice(0, 3).map((choice) => (
          <button
            key={choice.id}
            onClick={() => onChoose(choice.id)}
            onPointerDown={() => setPressedId(choice.id)}
            onPointerUp={() => setPressedId(null)}
            onPointerLeave={() => setPressedId(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 16px',
              borderRadius: '12px',
              border: '2px solid #e5e7eb',
              background: 'white',
              cursor: 'pointer',
              fontFamily: 'system-ui, sans-serif',
              minHeight: '52px',
              transform: pressedId === choice.id ? 'scale(0.98)' : 'scale(1)',
              transition: 'transform 0.1s ease',
            }}
          >
            <span style={{ fontSize: '24px' }}>{choice.icon}</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>
              {choice.label}
            </span>
          </button>
        ))}
      </div>
    );
  }

  // Tier 3-4: buttons with cost and effect details
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px 0' }}>
      {choices.map((choice) => (
        <button
          key={choice.id}
          onClick={() => onChoose(choice.id)}
          onPointerDown={() => setPressedId(choice.id)}
          onPointerUp={() => setPressedId(null)}
          onPointerLeave={() => setPressedId(null)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '10px',
            border: '2px solid #e5e7eb',
            background: 'white',
            cursor: 'pointer',
            fontFamily: 'system-ui, sans-serif',
            textAlign: 'left',
            transform: pressedId === choice.id ? 'scale(0.98)' : 'scale(1)',
            transition: 'transform 0.1s ease',
          }}
        >
          <span style={{ fontSize: '20px', flexShrink: 0 }}>{choice.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>
              {choice.label}
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '2px' }}>
              {choice.cost !== undefined && (
                <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: 500 }}>
                  Cost: ${choice.cost}
                </span>
              )}
              {choice.effect && (
                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                  {choice.effect}
                </span>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
