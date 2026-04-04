import { useState, useEffect, useCallback } from 'react'
import { playCorrect, playWrong, playCelebration, playPop } from './sounds'
import SpeakButton from './SpeakButton'

function sendToPlatform(type: string, correlationId: string, data: Record<string, unknown>) {
  window.parent.postMessage({ type, correlationId, data }, '*')
}

// ─── Shape definitions ──────────────────────────────────────────────
interface ShapeDef {
  name: string
  color: string
  colorName: string
  sides: number
  renderStyle: React.CSSProperties
}

const SHAPES: ShapeDef[] = [
  {
    name: 'Circle', color: '#ef4444', colorName: 'Red', sides: 0,
    renderStyle: { width: '120px', height: '120px', borderRadius: '50%', background: '#ef4444' },
  },
  {
    name: 'Square', color: '#3b82f6', colorName: 'Blue', sides: 4,
    renderStyle: { width: '120px', height: '120px', borderRadius: '8px', background: '#3b82f6' },
  },
  {
    name: 'Triangle', color: '#22c55e', colorName: 'Green', sides: 3,
    renderStyle: { width: 0, height: 0, borderLeft: '70px solid transparent', borderRight: '70px solid transparent', borderBottom: '120px solid #22c55e', background: 'transparent' },
  },
  {
    name: 'Rectangle', color: '#f97316', colorName: 'Orange', sides: 4,
    renderStyle: { width: '150px', height: '90px', borderRadius: '8px', background: '#f97316' },
  },
  {
    name: 'Star', color: '#eab308', colorName: 'Yellow', sides: 5,
    renderStyle: { width: '120px', height: '120px', background: '#eab308', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' },
  },
  {
    name: 'Diamond', color: '#a855f7', colorName: 'Purple', sides: 4,
    renderStyle: { width: '100px', height: '100px', background: '#a855f7', transform: 'rotate(45deg)', borderRadius: '4px' },
  },
  {
    name: 'Heart', color: '#ec4899', colorName: 'Pink', sides: 0,
    renderStyle: { width: '120px', height: '120px', background: '#ec4899', clipPath: 'path("M60 100 C60 100, 0 60, 0 30 C0 0, 30 0, 60 25 C90 0, 120 0, 120 30 C120 60, 60 100, 60 100Z")' },
  },
  {
    name: 'Oval', color: '#14b8a6', colorName: 'Teal', sides: 0,
    renderStyle: { width: '140px', height: '90px', borderRadius: '50%', background: '#14b8a6' },
  },
  {
    name: 'Pentagon', color: '#6366f1', colorName: 'Indigo', sides: 5,
    renderStyle: { width: '120px', height: '120px', background: '#6366f1', clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' },
  },
  {
    name: 'Hexagon', color: '#f59e0b', colorName: 'Amber', sides: 6,
    renderStyle: { width: '120px', height: '120px', background: '#f59e0b', clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' },
  },
]

const ALL_SHAPE_NAMES = SHAPES.map(s => s.name)
const ALL_COLOR_NAMES = [...new Set(SHAPES.map(s => s.colorName))]
const ALL_COLORS_HEX: Record<string, string> = {}
SHAPES.forEach(s => { ALL_COLORS_HEX[s.colorName] = s.color })
const ALL_SIDE_COUNTS = [0, 3, 4, 5, 6]

type GameMode = 'name' | 'color' | 'sides'
type Mode = 'menu' | GameMode | 'result'

interface Question {
  shape: ShapeDef
  options: string[]
  correct: string
  prompt: string
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }; return a
}

function pickRandom<T>(arr: T[], exclude?: T): T {
  const filtered = exclude !== undefined ? arr.filter(x => x !== exclude) : arr
  return filtered[Math.floor(Math.random() * filtered.length)]
}

function generateQuestion(gameMode: GameMode): Question {
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)]

  if (gameMode === 'name') {
    const correct = shape.name
    const wrongs = shuffle(ALL_SHAPE_NAMES.filter(n => n !== correct)).slice(0, 2)
    return { shape, correct, options: shuffle([correct, ...wrongs]), prompt: 'What shape is this?' }
  }

  if (gameMode === 'color') {
    const correct = shape.colorName
    const wrongs = shuffle(ALL_COLOR_NAMES.filter(c => c !== correct)).slice(0, 2)
    return { shape, correct, options: shuffle([correct, ...wrongs]), prompt: 'What color is this shape?' }
  }

  // sides
  const sidesLabel = shape.sides === 0 ? '0 (round!)' : String(shape.sides)
  const correct = sidesLabel
  const wrongPool = ALL_SIDE_COUNTS.filter(s => s !== shape.sides)
  const wrongs = shuffle(wrongPool).slice(0, 2).map(s => s === 0 ? '0 (round!)' : String(s))
  return { shape, correct, options: shuffle([correct, ...wrongs]), prompt: 'How many sides does this shape have?' }
}

const ROUNDS_PER_GAME = 5
const MODES_LIST: { id: GameMode; label: string; emoji: string; desc: string }[] = [
  { id: 'name', label: 'Name the Shape', emoji: '🔷', desc: 'Can you name this shape?' },
  { id: 'color', label: 'Find the Color', emoji: '🎨', desc: 'What color is the shape?' },
  { id: 'sides', label: 'How Many Sides?', emoji: '📐', desc: 'Count the sides!' },
]

export default function ShapesGame() {
  const [mode, setMode] = useState<Mode>('menu')
  const [gameMode, setGameMode] = useState<GameMode>('name')
  const [question, setQuestion] = useState<Question | null>(null)
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null)
  const [streak, setStreak] = useState(0)

  useEffect(() => { sendToPlatform('ui_ready', '', {}) }, [])

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const msg = event.data
      if (!msg || msg.type !== 'tool_invoke') return
      const { correlationId, tool } = msg
      if (tool === 'get_state') {
        sendToPlatform('tool_result', correlationId, { tool: 'get_state', mode, round, score, streak })
      } else if (tool === 'restore_state') {
        sendToPlatform('tool_result', correlationId, { tool: 'restore_state', message: 'Restored' })
      } else {
        sendToPlatform('error', correlationId, { message: `Unknown tool: ${tool}` })
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [mode, round, score, streak])

  const startGame = useCallback((m: GameMode) => {
    playPop()
    setGameMode(m)
    setRound(0)
    setScore(0)
    setStreak(0)
    setFeedback(null)
    setQuestion(generateQuestion(m))
    setMode(m)
    sendToPlatform('state_update', '', { type: 'game_start', mode: m })
  }, [])

  function handleAnswer(answer: string) {
    if (!question || feedback) return
    const correct = answer === question.correct
    if (correct) {
      setScore(s => s + 1)
      setStreak(s => s + 1)
      playCorrect()
      const msgs = ['Amazing! 🎉', 'You got it! ⭐', 'Wow, great job! 🌟', 'Super smart! 🧠', 'Yes! You rock! 🎸']
      setFeedback({ correct: true, message: msgs[Math.floor(Math.random() * msgs.length)] })
    } else {
      setStreak(0)
      playWrong()
      setFeedback({ correct: false, message: `The answer is ${question.correct}! Let's keep going! 💪` })
    }
  }

  function nextRound() {
    if (round + 1 >= ROUNDS_PER_GAME) {
      playCelebration()
      setMode('result')
      sendToPlatform('completion', '', { summary: `Shapes game complete! Score: ${score}/${ROUNDS_PER_GAME}` })
      return
    }
    setRound(r => r + 1)
    setFeedback(null)
    setQuestion(generateQuestion(gameMode))
  }

  const font = 'system-ui, -apple-system, sans-serif'
  const bigBtn = (onClick: () => void, children: React.ReactNode, color = '#3b82f6'): React.ReactNode => (
    <button onClick={onClick} style={{
      padding: '16px 28px', fontSize: '20px', fontWeight: 700, color: 'white',
      background: color, border: 'none', borderRadius: '16px', cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)', transition: 'transform 0.1s',
      minWidth: '80px',
    }}
      onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
      onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
    >
      {children}
    </button>
  )

  // ─── Menu ────────────────────────────────────────────────────
  if (mode === 'menu') {
    return (
      <div style={{ padding: '24px 16px', maxWidth: '400px', margin: '0 auto', fontFamily: font, textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>🔷</div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>Shapes Game</div>
        <div style={{ fontSize: '16px', color: '#6b7280', marginBottom: '24px' }}>Tap the right answer!</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {MODES_LIST.map(m => (
            <button key={m.id} onClick={() => startGame(m.id)} style={{
              display: 'flex', alignItems: 'center', gap: '16px', padding: '20px',
              background: 'white', border: '2px solid #e5e7eb', borderRadius: '16px',
              cursor: 'pointer', textAlign: 'left', fontSize: '16px', transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#93c5fd'; e.currentTarget.style.background = '#eff6ff' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = 'white' }}
            >
              <span style={{ fontSize: '36px' }}>{m.emoji}</span>
              <div>
                <div style={{ fontWeight: 700, color: '#111827' }}>{m.label}</div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>{m.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ─── Result ──────────────────────────────────────────────────
  if (mode === 'result') {
    const pct = Math.round((score / ROUNDS_PER_GAME) * 100)
    const emoji = pct === 100 ? '🏆' : pct >= 60 ? '🌟' : '💪'
    return (
      <div style={{ padding: '24px 16px', maxWidth: '400px', margin: '0 auto', fontFamily: font, textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '8px' }}>{emoji}</div>
        <div style={{ fontSize: '28px', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          {pct === 100 ? 'Perfect! You did it!' : pct >= 60 ? 'Great job!' : 'Good try!'}
          <SpeakButton
            text={`${pct === 100 ? 'Perfect! You did it!' : pct >= 60 ? 'Great job!' : 'Good try!'} You scored ${score} out of ${ROUNDS_PER_GAME}.`}
            label="Read results aloud"
          />
        </div>
        <div style={{ fontSize: '48px', fontWeight: 700, color: '#2563eb', margin: '16px 0' }}>
          {score} <span style={{ fontSize: '24px', color: '#9ca3af' }}>/ {ROUNDS_PER_GAME}</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px', flexWrap: 'wrap' }}>
          {bigBtn(() => startGame(gameMode), '🔄 Play Again')}
          {bigBtn(() => setMode('menu'), '🏠 Pick New Game', '#6b7280')}
        </div>
      </div>
    )
  }

  // ─── Game round ──────────────────────────────────────────────
  if (!question) return null

  return (
    <div style={{ padding: '20px 16px', maxWidth: '420px', margin: '0 auto', fontFamily: font }}>
      {/* Progress */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '14px', color: '#6b7280' }}>
          {round + 1} / {ROUNDS_PER_GAME}
        </span>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#2563eb' }}>
          ⭐ {score}
        </span>
        {streak >= 2 && (
          <span style={{ fontSize: '13px', color: '#f59e0b', fontWeight: 600 }}>
            🔥 {streak} in a row!
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ height: '8px', background: '#e5e7eb', borderRadius: '4px', marginBottom: '20px', overflow: 'hidden' }}>
        <div style={{ height: '100%', background: '#3b82f6', borderRadius: '4px', width: `${((round + (feedback ? 1 : 0)) / ROUNDS_PER_GAME) * 100}%`, transition: 'width 0.3s' }} />
      </div>

      {/* Question prompt */}
      <div style={{ fontSize: '22px', fontWeight: 700, color: '#111827', textAlign: 'center', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        {question.prompt}
        <SpeakButton text={question.prompt} label="Read question aloud" />
      </div>

      {/* Shape display */}
      <div style={{
        padding: '24px', borderRadius: '20px', background: 'white', border: '2px solid #e5e7eb',
        textAlign: 'center', marginBottom: '20px',
        minHeight: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={question.shape.renderStyle} />
      </div>

      {/* Feedback */}
      {feedback && (
        <div style={{
          padding: '14px', borderRadius: '14px', marginBottom: '16px', textAlign: 'center',
          fontSize: '18px', fontWeight: 600,
          background: feedback.correct ? '#dcfce7' : '#fee2e2',
          color: feedback.correct ? '#166534' : '#991b1b',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}>
          {feedback.message}
          <SpeakButton text={feedback.message} label="Read feedback aloud" />
        </div>
      )}

      {/* Answer buttons */}
      {!feedback ? (
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {question.options.map((opt, i) => {
            // For color mode, show color swatches
            if (gameMode === 'color') {
              const hex = ALL_COLORS_HEX[opt] || '#888'
              return (
                <button key={i} onClick={() => handleAnswer(opt)} style={{
                  width: '90px', height: '90px', fontSize: '12px', fontWeight: 700,
                  color: '#111827', background: 'white', border: '3px solid #d1d5db',
                  borderRadius: '16px', cursor: 'pointer', transition: 'all 0.1s',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#eff6ff' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = 'white' }}
                  onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.9)')}
                  onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: hex, border: '2px solid rgba(0,0,0,0.1)' }} />
                  <span>{opt}</span>
                </button>
              )
            }

            return (
              <button key={i} onClick={() => handleAnswer(opt)} style={{
                minWidth: '80px', height: '80px', fontSize: '18px', fontWeight: 700,
                color: '#111827', background: 'white', border: '3px solid #d1d5db',
                borderRadius: '16px', cursor: 'pointer', transition: 'all 0.1s',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '8px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#eff6ff' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = 'white' }}
                onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.9)')}
                onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {opt}
              </button>
            )
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          {bigBtn(nextRound, round + 1 >= ROUNDS_PER_GAME ? '🎉 See Results!' : 'Next ➡️')}
        </div>
      )}
    </div>
  )
}
