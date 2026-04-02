import { useState } from 'react';
import { Domain, ScenarioInfo, Tier } from '../types';
import DomainTab from './DomainTab';
import ScenarioCard from './ScenarioCard';

interface ScenarioPickerScreenProps {
  scenarios: ScenarioInfo[];
  tier: Tier;
  onSelect: (scenarioId: string) => void;
}

export default function ScenarioPickerScreen({ scenarios, tier, onSelect }: ScenarioPickerScreenProps) {
  const [filter, setFilter] = useState<Domain | 'all'>('all');

  const filtered = filter === 'all' ? scenarios : scenarios.filter((s) => s.domain === filter);

  const gridColumns = tier === 1 ? '1fr' : '1fr 1fr';

  return (
    <div style={{ padding: '16px', fontFamily: 'system-ui, sans-serif' }}>
      <div
        style={{
          fontSize: tier === 1 ? '22px' : '20px',
          fontWeight: 800,
          textAlign: 'center',
          marginBottom: '4px',
          color: '#1f2937',
        }}
      >
        {tier === 1 ? '\ud83c\udf1f Level Up Life!' : 'Level Up Life'}
      </div>
      <div
        style={{
          fontSize: '13px',
          color: '#6b7280',
          textAlign: 'center',
          marginBottom: '16px',
        }}
      >
        {tier === 1 ? 'Pick a game!' : 'Choose a scenario to begin'}
      </div>

      <DomainTab selected={filter} onSelect={setFilter} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: gridColumns,
          gap: tier === 1 ? '12px' : '10px',
        }}
      >
        {filtered.map((scenario) => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            tier={tier}
            onSelect={onSelect}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 16px', color: '#9ca3af', fontSize: '14px' }}>
          No scenarios in this category yet
        </div>
      )}
    </div>
  );
}
