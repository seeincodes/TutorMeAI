import { Tier } from '../types';

interface EventBubbleProps {
  eventType: 'choice' | 'info' | 'surprise';
  description: string;
  tier: Tier;
}

const EVENT_STYLES: Record<string, { bg: string; border: string; icon: string }> = {
  choice:   { bg: '#fefce8', border: '#fde047', icon: '\ud83e\udd14' },
  info:     { bg: '#eff6ff', border: '#93c5fd', icon: '\ud83d\udca1' },
  surprise: { bg: '#fef2f2', border: '#fca5a5', icon: '\ud83c\udf1f' },
};

export default function EventBubble({ eventType, description, tier }: EventBubbleProps) {
  const style = EVENT_STYLES[eventType] || EVENT_STYLES.info;

  return (
    <div
      style={{
        padding: tier === 1 ? '16px' : '12px',
        background: style.bg,
        border: `2px solid ${style.border}`,
        borderRadius: '16px',
        marginBottom: '12px',
        display: 'flex',
        gap: '10px',
        alignItems: 'flex-start',
      }}
    >
      <span style={{ fontSize: tier === 1 ? '28px' : '20px', flexShrink: 0 }}>
        {style.icon}
      </span>
      <p
        style={{
          margin: 0,
          fontSize: tier === 1 ? '18px' : tier === 2 ? '15px' : '14px',
          fontWeight: tier === 1 ? 700 : 500,
          color: '#1f2937',
          lineHeight: '1.4',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {description}
      </p>
    </div>
  );
}
