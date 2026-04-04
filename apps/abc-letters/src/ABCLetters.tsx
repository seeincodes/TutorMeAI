import { useState, useEffect, useCallback } from 'react'
import { playCorrect, playWrong, playCelebration, playPop } from './sounds'

function sendToPlatform(type: string, correlationId: string, data: Record<string, unknown>) {
  window.parent.postMessage({ type, correlationId, data }, '*')
}

// ─── Letter data with pictures ──────────────────────────────────────
const LETTER_DATA: { letter: string; word: string; emoji: string }[] = [
  { letter: 'A', word: 'Apple', emoji: '🍎' },
  { letter: 'B', word: 'Bear', emoji: '🐻' },
  { letter: 'C', word: 'Cat', emoji: '🐱' },
  { letter: 'D', word: 'Dog', emoji: '🐶' },
  { letter: 'E', word: 'Elephant', emoji: '🐘' },
  { letter: 'F', word: 'Fish', emoji: '🐟' },
  { letter: 'G', word: 'Grapes', emoji: '🍇' },
  { letter: 'H', word: 'House', emoji: '🏠' },
  { letter: 'I', word: 'Ice cream', emoji: '🍦' },
  { letter: 'J', word: 'Juice', emoji: '🧃' },
  { letter: 'K', word: 'Kite', emoji: '🪁' },
  { letter: 'L', word: 'Lion', emoji: '🦁' },
  { letter: 'M', word: 'Moon', emoji: '🌙' },
  { letter: 'N', word: 'Nest', emoji: '🪺' },
  { letter: 'O', word: 'Orange', emoji: '🍊' },
  { letter: 'P', word: 'Penguin', emoji: '🐧' },
  { letter: 'Q', word: 'Queen', emoji: '👑' },
  { letter: 'R', word: 'Rainbow', emoji: '🌈' },
  { letter: 'S', word: 'Sun', emoji: '☀️' },
  { letter: 'T', word: 'Tree', emoji: '🌳' },
  { letter: 'U', word: 'Umbrella', emoji: '☂️' },
  { letter: 'V', word: 'Violin', emoji: '🎻' },
  { letter: 'W', word: 'Whale', emoji: '🐳' },
  { letter: 'X', word: 'Xylophone', emoji: '🎵' },
  { letter: 'Y', word: 'Yarn', emoji: '🧶' },
  { letter: 'Z', word: 'Zebra', emoji: '🦓' },
]

type Mode = 'menu' | 'find-letter' | 'what-starts' | 'uppercase-lowercase' | 'result'

interface Question {
  prompt: string
  display: string        // big visual (emoji or letter)
  options: string[]
  correct: string
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }; return a
}

function pickRandom<T>(arr: T[], exclude?: T): T {
  const filtered = exclude ? arr.filter(x => x !== exclude) : arr
  return filtered[Math.floor(Math.random() * filtered.length)]
}

function generateQuestion(mode: 'find-letter' | 'what-starts' | 'uppercase-lowercase'): Question {
  const item = LETTER_DATA[Math.floor(Math.random() * LETTER_DATA.length)]

  if (mode === 'find-letter') {
    // Show emoji, ask "What letter does WORD start with?"
    const wrongA = pickRandom(LETTER_DATA, item).letter
    const wrongB = pickRandom(LETTER_DATA.filter(l => l.letter !== item.letter && l.letter !== wrongA)).letter
    return {
      prompt: `What letter does "${item.word}" start with?`,
      display: item.emoji,
      options: shuffle([item.letter, wrongA, wrongB]),
      correct: item.letter,
    }
  }

  if (mode === 'what-starts') {
    // Show a letter, ask which picture starts with it
    const wrongA = pickRandom(LETTER_DATA, item)
    const wrongB = pickRandom(LETTER_DATA.filter(l => l.letter !== item.letter && l.letter !== wrongA.letter))
    return {
      prompt: `Which one starts with the letter ${item.letter}?`,
      display: item.letter,
      options: shuffle([`${item.emoji} ${item.word}`, `${wrongA.emoji} ${wrongA.word}`, `${wrongB.emoji} ${wrongB.word}`]),
      correct: `${item.emoji} ${item.word}`,
    }
  }

  // uppercase-lowercase: match upper to lower
  const wrongA = pickRandom(LETTER_DATA, item).letter.toLowerCase()
  const wrongB = pickRandom(LETTER_DATA.filter(l => l.letter !== item.letter && l.letter.toLowerCase() !== wrongA)).letter.toLowerCase()
  return {
    prompt: `Which is the lowercase version of ${item.letter}?`,
    display: item.letter,
    options: shuffle([item.letter.toLowerCase(), wrongA, wrongB]),
    correct: item.letter.toLowerCase(),
  }
}

const ROUNDS_PER_GAME = 5
const GAME_MODES: { id: 'find-letter' | 'what-starts' | 'uppercase-lowercase'; label: string; emoji: string; desc: string }[] = [
  { id: 'find-letter', label: 'Find the Letter', emoji: '🔤', desc: 'What letter does this start with?' },
  { id: 'what-starts', label: 'Match the Picture', emoji: '🖼️', desc: 'Which picture starts with this letter?' },
  { id: 'uppercase-lowercase', label: 'Big & Small Letters', emoji: '🔡', desc: 'Match uppercase to lowercase!' },
]

export default function ABCLetters() {
  const [mode, setMode] = useState<Mode>('menu')
  const [gameMode, setGameMode] = useState<'find-letter' | 'what-starts' | 'uppercase-lowercase'>('find-letter')
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

  const startGame = useCallback((m: 'find-letter' | 'what-starts' | 'uppercase-lowercase') => {
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
      const msgs = ['Awesome! 🎉', 'You know your letters! ⭐', 'Great job! 🌟', 'So smart! 🧠', 'Perfect! 🎸']
      setFeedback({ correct: true, message: msgs[Math.floor(Math.random() * msgs.length)] })
    } else {
      setStreak(0)
      playWrong()
      setFeedback({ correct: false, message: `It's "${question.correct}"! You'll get it next time! 💪` })
    }
  }

  function nextRound() {
    if (round + 1 >= ROUNDS_PER_GAME) {
      playCelebration()
      setMode('result')
      sendToPlatform('completion', '', { summary: `ABC game complete! Score: ${score}/${ROUNDS_PER_GAME}` })
      return
    }
    setRound(r => r + 1)
    setFeedback(null)
    setQuestion(generateQuestion(gameMode))
  }

  const font = 'system-ui, -apple-system, sans-serif'

  // ─── Menu ────────────────────────────────────────────────────
  if (mode === 'menu') {
    return (
      <div style={{ padding: '24px 16px', maxWidth: '400px', margin: '0 auto', fontFamily: font, textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>🔤</div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>ABC Letters</div>
        <div style={{ fontSize: '16px', color: '#6b7280', marginBottom: '24px' }}>Learn your letters!</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {GAME_MODES.map(m => (
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
        <div style={{ fontSize: '28px', fontWeight: 700, color: '#111827' }}>
          {pct === 100 ? 'Perfect! Amazing!' : pct >= 60 ? 'Great job!' : 'Good try!'}
        </div>
        <div style={{ fontSize: '48px', fontWeight: 700, color: '#2563eb', margin: '16px 0' }}>
          {score} <span style={{ fontSize: '24px', color: '#9ca3af' }}>/ {ROUNDS_PER_GAME}</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px', flexWrap: 'wrap' }}>
          <button onClick={() => startGame(gameMode)} style={{ padding: '16px 28px', fontSize: '20px', fontWeight: 700, color: 'white', background: '#3b82f6', border: 'none', borderRadius: '16px', cursor: 'pointer' }}>🔄 Play Again</button>
          <button onClick={() => setMode('menu')} style={{ padding: '16px 28px', fontSize: '20px', fontWeight: 700, color: 'white', background: '#6b7280', border: 'none', borderRadius: '16px', cursor: 'pointer' }}>🏠 Menu</button>
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
        <span style={{ fontSize: '14px', color: '#6b7280' }}>{round + 1} / {ROUNDS_PER_GAME}</span>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#2563eb' }}>⭐ {score}</span>
        {streak >= 2 && <span style={{ fontSize: '13px', color: '#f59e0b', fontWeight: 600 }}>🔥 {streak} in a row!</span>}
      </div>

      {/* Progress bar */}
      <div style={{ height: '8px', background: '#e5e7eb', borderRadius: '4px', marginBottom: '20px', overflow: 'hidden' }}>
        <div style={{ height: '100%', background: '#8b5cf6', borderRadius: '4px', width: `${((round + (feedback ? 1 : 0)) / ROUNDS_PER_GAME) * 100}%`, transition: 'width 0.3s' }} />
      </div>

      {/* Question */}
      <div style={{ fontSize: '22px', fontWeight: 700, color: '#111827', textAlign: 'center', marginBottom: '16px' }}>
        {question.prompt}
      </div>

      {/* Big display */}
      <div style={{
        padding: '24px', borderRadius: '20px', background: 'white', border: '2px solid #e5e7eb',
        textAlign: 'center', fontSize: question.display.length <= 2 ? '80px' : '64px',
        marginBottom: '20px', minHeight: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700,
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
        }}>
          {feedback.message}
        </div>
      )}

      {/* Answer buttons */}
      {!feedback ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {question.options.map((opt, i) => (
            <button key={i} onClick={() => handleAnswer(opt)} style={{
              padding: '18px 24px', fontSize: '22px', fontWeight: 700,
              color: '#111827', background: 'white', border: '3px solid #d1d5db',
              borderRadius: '16px', cursor: 'pointer', transition: 'all 0.1s',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)', textAlign: 'center',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#8b5cf6'; e.currentTarget.style.background = '#f5f3ff' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = 'white' }}
              onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
              onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <button onClick={nextRound} style={{ padding: '16px 28px', fontSize: '20px', fontWeight: 700, color: 'white', background: '#8b5cf6', border: 'none', borderRadius: '16px', cursor: 'pointer' }}>
            {round + 1 >= ROUNDS_PER_GAME ? '🎉 See Results!' : 'Next ➡️'}
          </button>
        </div>
      )}
    </div>
  )
}
