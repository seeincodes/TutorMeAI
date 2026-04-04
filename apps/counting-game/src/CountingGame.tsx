import { useState, useEffect, useCallback } from 'react'
import { playCorrect, playWrong, playCelebration, playPop } from './sounds'
import SpeakButton from './SpeakButton'

function sendToPlatform(type: string, correlationId: string, data: Record<string, unknown>) {
  window.parent.postMessage({ type, correlationId, data }, '*')
}

// ─── Emoji item pools by theme ────────────────────────────────────────
const THEMES = [
  { name: 'Animals', items: ['🐶', '🐱', '🐸', '🐰', '🦊', '🐻', '🐼', '🐷', '🐮', '🐵'] },
  { name: 'Food', items: ['🍎', '🍌', '🍕', '🍪', '🍩', '🧁', '🍓', '🍇', '🍉', '🌽'] },
  { name: 'Space', items: ['⭐', '🌙', '🚀', '🛸', '🌍', '☀️', '🪐', '💫', '🌟', '✨'] },
  { name: 'Nature', items: ['🌸', '🌻', '🌈', '🦋', '🐝', '🌺', '🍀', '🌿', '🌳', '🍄'] },
  { name: 'Ocean', items: ['🐠', '🐙', '🦀', '🐳', '🐚', '🦈', '🐡', '🦞', '🐬', '🪸'] },
  { name: 'Vehicles', items: ['🚗', '🚀', '✈️', '🚂', '🚲', '🏎️', '🚁', '⛵', '🚌', '🛴'] },
]

type Mode = 'menu' | 'count' | 'compare' | 'add' | 'result'

interface Question {
  mode: 'count' | 'compare' | 'add'
  emoji: string
  count: number       // for count mode
  countA?: number     // for compare/add
  countB?: number
  emojiB?: string
  options: number[]
  correct: number
  prompt: string
  display: string     // emoji grid to show
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }; return a
}

function repeatEmoji(emoji: string, n: number): string {
  return Array(n).fill(emoji).join(' ')
}

function generateQuestion(mode: 'count' | 'compare' | 'add'): Question {
  const theme = THEMES[Math.floor(Math.random() * THEMES.length)]
  const emoji = theme.items[Math.floor(Math.random() * theme.items.length)]

  if (mode === 'count') {
    const count = Math.floor(Math.random() * 10) + 1 // 1-10
    const correct = count
    const wrongA = Math.max(1, count + (Math.random() > 0.5 ? 1 : -1))
    const wrongB = Math.max(1, count + (Math.random() > 0.5 ? 2 : -2))
    const options = shuffle([correct, wrongA === correct ? correct + 3 : wrongA, wrongB === correct ? correct + 2 : wrongB])
    return {
      mode, emoji, count, correct, options,
      prompt: `How many ${emoji} do you see?`,
      display: repeatEmoji(emoji, count),
    }
  }

  if (mode === 'compare') {
    const countA = Math.floor(Math.random() * 8) + 1
    let countB = Math.floor(Math.random() * 8) + 1
    if (countB === countA) countB = countA + 1
    const emojiB = theme.items.find(e => e !== emoji) || '🌟'
    const correct = Math.max(countA, countB)
    return {
      mode, emoji, count: correct, countA, countB, emojiB,
      correct,
      options: shuffle([countA, countB]),
      prompt: `Which group has MORE?`,
      display: `${repeatEmoji(emoji, countA)}\n\n${repeatEmoji(emojiB, countB)}`,
    }
  }

  // add mode
  const a = Math.floor(Math.random() * 5) + 1
  const b = Math.floor(Math.random() * 5) + 1
  const correct = a + b
  const wrongA = correct + 1
  const wrongB = Math.max(1, correct - 1)
  return {
    mode, emoji, count: correct, countA: a, countB: b,
    correct,
    options: shuffle([correct, wrongA, wrongB]),
    prompt: `${a} ${emoji} + ${b} ${emoji} = ?`,
    display: `${repeatEmoji(emoji, a)}  ➕  ${repeatEmoji(emoji, b)}`,
  }
}

const ROUNDS_PER_GAME = 5
const MODES: { id: 'count' | 'compare' | 'add'; label: string; emoji: string; desc: string }[] = [
  { id: 'count', label: 'Count', emoji: '🔢', desc: 'How many do you see?' },
  { id: 'compare', label: 'More or Less', emoji: '⚖️', desc: 'Which group is bigger?' },
  { id: 'add', label: 'Add Together', emoji: '➕', desc: 'Add two groups!' },
]

export default function CountingGame() {
  const [mode, setMode] = useState<Mode>('menu')
  const [gameMode, setGameMode] = useState<'count' | 'compare' | 'add'>('count')
  const [question, setQuestion] = useState<Question | null>(null)
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null)
  const [streak, setStreak] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)

  useEffect(() => { sendToPlatform('ui_ready', '', {}) }, [])

  // Handle tool invocations from platform
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

  const startGame = useCallback((m: 'count' | 'compare' | 'add') => {
    playPop()
    setGameMode(m)
    setRound(0)
    setScore(0)
    setStreak(0)
    setFeedback(null)
    setShowAnswer(false)
    setQuestion(generateQuestion(m))
    setMode(m)
    sendToPlatform('state_update', '', { type: 'game_start', mode: m })
  }, [])

  function handleAnswer(answer: number) {
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
      setShowAnswer(false)
      setFeedback({ correct: false, message: `Not quite! Try again or see the answer. 💪` })
    }
  }

  function nextRound() {
    if (round + 1 >= ROUNDS_PER_GAME) {
      playCelebration()
      setMode('result')
      sendToPlatform('completion', '', { summary: `Counting game complete! Score: ${score}/${ROUNDS_PER_GAME}` })
      return
    }
    setRound(r => r + 1)
    setFeedback(null)
    setShowAnswer(false)
    setQuestion(generateQuestion(gameMode))
  }

  function tryAgain() {
    setFeedback(null)
    setShowAnswer(false)
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
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>🔢</div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>Counting Game</div>
        <div style={{ fontSize: '16px', color: '#6b7280', marginBottom: '24px' }}>Tap the right answer!</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {MODES.map(m => (
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
        <div style={{ fontSize: '28px', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          {pct === 100 ? 'Perfect! You did it!' : pct >= 60 ? 'Great job!' : 'Good try!'}
          <SpeakButton text={pct === 100 ? 'Perfect! You did it!' : pct >= 60 ? 'Great job!' : 'Good try!'} />
        </div>
        <div style={{ fontSize: '48px', fontWeight: 700, color: '#2563eb', margin: '16px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          {score} <span style={{ fontSize: '24px', color: '#9ca3af' }}>/ {ROUNDS_PER_GAME}</span>
          <SpeakButton text={`You scored ${score} out of ${ROUNDS_PER_GAME}`} />
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
      <div style={{ fontSize: '22px', fontWeight: 700, color: '#111827', textAlign: 'center', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
        {question.prompt}
        <SpeakButton text={question.prompt} />
      </div>

      {/* Emoji display */}
      <div style={{
        padding: '24px', borderRadius: '20px', background: 'white', border: '2px solid #e5e7eb',
        textAlign: 'center', fontSize: '32px', lineHeight: 1.8, marginBottom: '20px',
        minHeight: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        whiteSpace: 'pre-line', letterSpacing: '4px',
      }}>
        {question.display}
      </div>

      {/* Feedback */}
      {feedback && (
        <div style={{
          padding: '14px', borderRadius: '14px', marginBottom: '16px', textAlign: 'center',
          fontSize: '18px', fontWeight: 600,
          background: feedback.correct ? '#dcfce7' : '#fee2e2',
          color: feedback.correct ? '#166534' : '#991b1b',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
        }}>
          {feedback.message}
          <SpeakButton text={feedback.message} />
        </div>
      )}

      {/* Answer buttons */}
      {!feedback ? (
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {question.options.map((opt, i) => (
            <button key={i} onClick={() => handleAnswer(opt)} style={{
              width: '80px', height: '80px', fontSize: '28px', fontWeight: 700,
              color: '#111827', background: 'white', border: '3px solid #d1d5db',
              borderRadius: '16px', cursor: 'pointer', transition: 'all 0.1s',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#eff6ff' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = 'white' }}
              onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.9)')}
              onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : feedback.correct ? (
        <div style={{ textAlign: 'center' }}>
          {bigBtn(nextRound, round + 1 >= ROUNDS_PER_GAME ? '🎉 See Results!' : 'Next ➡️')}
        </div>
      ) : showAnswer ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '18px', fontWeight: 600, color: '#92400e', background: '#fef3c7',
            borderRadius: '12px', padding: '12px 20px', marginBottom: '16px', display: 'inline-block',
          }}>
            The answer is {question.correct}!
          </div>
          <div>
            {bigBtn(nextRound, round + 1 >= ROUNDS_PER_GAME ? '🎉 See Results!' : 'Next ➡️')}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={tryAgain} style={{
            padding: '16px 28px', fontSize: '20px', fontWeight: 700, color: 'white',
            background: '#16a34a', border: 'none', borderRadius: '16px', cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)', transition: 'transform 0.1s',
          }}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            🔄 Try Again
          </button>
          <button onClick={() => setShowAnswer(true)} style={{
            padding: '16px 28px', fontSize: '18px', fontWeight: 600, color: '#374151',
            background: '#f3f4f6', border: '2px solid #d1d5db', borderRadius: '16px', cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)', transition: 'transform 0.1s',
          }}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            👁 Show Answer
          </button>
        </div>
      )}
    </div>
  )
}
