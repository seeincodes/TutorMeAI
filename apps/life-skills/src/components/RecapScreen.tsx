import { RecapSummary, Tier } from '../types';

interface RecapScreenProps {
  summary: RecapSummary;
  tier: Tier;
  onRestart: () => void;
}

export default function RecapScreen({ summary, tier, onRestart }: RecapScreenProps) {
  return (
    <div style={{ padding: '16px', fontFamily: 'system-ui, sans-serif' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
          borderRadius: '20px',
          padding: '24px 20px',
          color: 'white',
          marginBottom: '16px',
        }}
      >
        <div style={{ fontSize: '40px', textAlign: 'center', marginBottom: '8px' }}>
          {'\ud83c\udf89'}
        </div>
        <div
          style={{
            fontSize: tier === 1 ? '22px' : '20px',
            fontWeight: 800,
            textAlign: 'center',
            marginBottom: '4px',
          }}
        >
          {tier === 1 ? 'Great job!' : 'Scenario Complete!'}
        </div>
        <div
          style={{
            fontSize: '14px',
            textAlign: 'center',
            opacity: 0.9,
            marginBottom: '16px',
          }}
        >
          {summary.scenarioTitle}
        </div>

        {/* Decision list (tier 2+) */}
        {tier >= 2 && summary.decisions.length > 0 && (
          <div
            style={{
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '12px',
              padding: '12px',
              marginBottom: '12px',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', opacity: 0.9 }}>
              Your Decisions:
            </div>
            {summary.decisions.map((d, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '6px',
                  fontSize: '13px',
                  lineHeight: '1.3',
                }}
              >
                <span style={{ fontWeight: 700, opacity: 0.7, flexShrink: 0 }}>
                  #{d.turn}
                </span>
                <div>
                  <span style={{ fontWeight: 600 }}>{d.choice}</span>
                  <span style={{ opacity: 0.8 }}> — {d.outcome}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Takeaway */}
        <div
          style={{
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '12px',
            padding: '12px',
            fontSize: tier === 1 ? '16px' : '14px',
            fontWeight: 600,
            lineHeight: '1.4',
            textAlign: 'center',
          }}
        >
          {tier === 1 ? '\ud83c\udf1f ' : '\ud83d\udca1 '}
          {summary.takeaway}
        </div>
      </div>

      {/* Share note */}
      <div
        style={{
          textAlign: 'center',
          fontSize: '12px',
          color: '#9ca3af',
          marginBottom: '16px',
        }}
      >
        Screenshot to share with your {tier <= 2 ? 'family' : 'teacher or family'}!
      </div>

      {/* Play again button */}
      <button
        onClick={onRestart}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: '12px',
          border: 'none',
          background: '#3b82f6',
          color: 'white',
          fontSize: '16px',
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {tier === 1 ? '\ud83c\udf1f Play Again!' : 'Choose Another Scenario'}
      </button>
    </div>
  );
}
