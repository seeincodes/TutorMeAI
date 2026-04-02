import { ScenarioInfo, Tier } from '../types';
import { DOMAIN_CONFIG } from './DomainTab';
import { useState } from 'react';

interface ScenarioCardProps {
  scenario: ScenarioInfo;
  tier: Tier;
  onSelect: (id: string) => void;
}

export default function ScenarioCard({ scenario, tier, onSelect }: ScenarioCardProps) {
  const [pressed, setPressed] = useState(false);
  const cfg = DOMAIN_CONFIG[scenario.domain];
  const isBig = tier <= 2;

  return (
    <button
      onClick={() => onSelect(scenario.id)}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isBig ? 'center' : 'flex-start',
        justifyContent: 'center',
        padding: isBig ? '24px 16px' : '16px',
        borderRadius: '16px',
        border: 'none',
        background: `linear-gradient(135deg, ${cfg.color}20, ${cfg.color}08)`,
        cursor: 'pointer',
        textAlign: isBig ? 'center' : 'left',
        fontFamily: 'system-ui, sans-serif',
        width: '100%',
        minHeight: isBig ? '120px' : '80px',
        transform: pressed ? 'scale(0.97)' : 'scale(1)',
        transition: 'transform 0.1s ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      <span style={{ fontSize: isBig ? '40px' : '28px', marginBottom: '8px' }}>
        {scenario.icon}
      </span>
      <span
        style={{
          fontSize: isBig ? '16px' : '14px',
          fontWeight: 700,
          color: '#1f2937',
          marginBottom: tier >= 2 ? '4px' : '0',
        }}
      >
        {scenario.title}
      </span>
      {tier >= 2 && (
        <span style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.3' }}>
          {scenario.description}
        </span>
      )}
    </button>
  );
}
