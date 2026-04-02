import { Domain } from '../types';

const DOMAIN_CONFIG: Record<Domain | 'all', { color: string; icon: string; label: string }> = {
  all:    { color: '#6b7280', icon: '\u2b50', label: 'All' },
  money:  { color: '#f59e0b', icon: '\ud83d\udcb0', label: 'Money' },
  time:   { color: '#3b82f6', icon: '\u23f0', label: 'Time' },
  health: { color: '#22c55e', icon: '\ud83c\udf4e', label: 'Health' },
  social: { color: '#a855f7', icon: '\ud83e\udd1d', label: 'Social' },
  combo:  { color: '#ef4444', icon: '\ud83c\udfaf', label: 'Combo' },
};

export { DOMAIN_CONFIG };

interface DomainTabProps {
  selected: Domain | 'all';
  onSelect: (domain: Domain | 'all') => void;
}

const TABS: (Domain | 'all')[] = ['all', 'money', 'time', 'health', 'social', 'combo'];

export default function DomainTab({ selected, onSelect }: DomainTabProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '6px',
        overflowX: 'auto',
        paddingBottom: '8px',
        marginBottom: '12px',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
      }}
    >
      {TABS.map((domain) => {
        const cfg = DOMAIN_CONFIG[domain];
        const active = selected === domain;
        return (
          <button
            key={domain}
            onClick={() => onSelect(domain)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 14px',
              borderRadius: '20px',
              border: `2px solid ${active ? cfg.color : '#e5e7eb'}`,
              background: active ? cfg.color + '18' : 'white',
              color: active ? cfg.color : '#6b7280',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              fontFamily: 'system-ui, sans-serif',
              minHeight: '40px',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ fontSize: '16px' }}>{cfg.icon}</span>
            {cfg.label}
          </button>
        );
      })}
    </div>
  );
}
