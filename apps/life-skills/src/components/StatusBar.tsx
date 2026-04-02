import { Tier } from '../types';
import CoinJar from './CoinJar';

interface StatusBarProps {
  tier: Tier;
  balance: number;
  progress: number;
  items: string[];
}

export default function StatusBar({ tier, balance, progress, items }: StatusBarProps) {
  if (tier === 1) {
    return <CoinJar balance={balance} />;
  }

  if (tier === 2) {
    return (
      <div style={{ padding: '12px', background: '#f0fdf4', borderRadius: '12px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#166534' }}>
            ${balance}
          </span>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
            {progress}% complete
          </span>
        </div>
        <div
          style={{
            height: '12px',
            background: '#e5e7eb',
            borderRadius: '6px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(100, progress)}%`,
              background: 'linear-gradient(90deg, #22c55e, #16a34a)',
              borderRadius: '6px',
              transition: 'width 0.5s ease',
            }}
          />
        </div>
      </div>
    );
  }

  // Tier 3-4: grid layout
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '8px',
        marginBottom: '12px',
      }}
    >
      <div
        style={{
          padding: '10px',
          background: '#eff6ff',
          borderRadius: '10px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>Balance</div>
        <div style={{ fontSize: '18px', fontWeight: 800, color: '#1d4ed8' }}>${balance}</div>
      </div>
      <div
        style={{
          padding: '10px',
          background: '#f0fdf4',
          borderRadius: '10px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>Progress</div>
        <div style={{ fontSize: '18px', fontWeight: 800, color: '#16a34a' }}>{progress}%</div>
      </div>
      <div
        style={{
          padding: '10px',
          background: '#fef3c7',
          borderRadius: '10px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>Items</div>
        <div style={{ fontSize: '18px', fontWeight: 800, color: '#d97706' }}>{items.length}</div>
      </div>
    </div>
  );
}
