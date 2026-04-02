interface CoinJarProps {
  balance: number;
  maxBalance?: number;
}

export default function CoinJar({ balance, maxBalance = 20 }: CoinJarProps) {
  const fillPct = Math.min(100, Math.max(0, (balance / maxBalance) * 100));
  const coins = Math.min(balance, 12);
  const coinPositions = Array.from({ length: coins }, (_, i) => ({
    cx: 20 + (i % 4) * 20,
    cy: 130 - Math.floor(i / 4) * 18,
  }));

  return (
    <div style={{ position: 'relative', width: '100px', height: '150px', margin: '0 auto' }}>
      <style>{`
        @keyframes coinDrop {
          0% { transform: translateY(-30px); opacity: 0; }
          60% { transform: translateY(4px); opacity: 1; }
          80% { transform: translateY(-2px); }
          100% { transform: translateY(0); opacity: 1; }
        }
        .coin-circle {
          animation: coinDrop 0.5s ease-out both;
        }
      `}</style>
      <svg viewBox="0 0 100 150" width="100" height="150">
        {/* Jar body */}
        <path
          d="M15 40 Q15 140, 15 135 Q15 145, 50 145 Q85 145, 85 135 Q85 140, 85 40 Z"
          fill="#e0f2fe"
          stroke="#93c5fd"
          strokeWidth="2"
        />
        {/* Jar opening */}
        <path
          d="M25 40 Q25 30, 50 30 Q75 30, 75 40"
          fill="none"
          stroke="#93c5fd"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Fill level */}
        <rect
          x="17"
          y={140 - fillPct}
          width="66"
          height={fillPct}
          rx="4"
          fill="#fbbf24"
          opacity="0.25"
          style={{ transition: 'all 0.5s ease' }}
        />
        {/* Coins */}
        {coinPositions.map((pos, i) => (
          <circle
            key={i}
            className="coin-circle"
            cx={pos.cx}
            cy={pos.cy}
            r="8"
            fill="#f59e0b"
            stroke="#d97706"
            strokeWidth="1.5"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
        {/* Coin dollar signs */}
        {coinPositions.map((pos, i) => (
          <text
            key={`t-${i}`}
            x={pos.cx}
            y={pos.cy + 3.5}
            textAnchor="middle"
            fontSize="9"
            fontWeight="bold"
            fill="#92400e"
            className="coin-circle"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            $
          </text>
        ))}
      </svg>
      <div
        style={{
          textAlign: 'center',
          fontSize: '18px',
          fontWeight: 800,
          color: '#f59e0b',
          marginTop: '4px',
        }}
      >
        {balance} coins
      </div>
    </div>
  );
}
