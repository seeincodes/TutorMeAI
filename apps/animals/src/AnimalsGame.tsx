import { useState, useEffect, useCallback } from 'react'
import { playCorrect, playWrong, playCelebration, playPop } from './sounds'

function sendToPlatform(type: string, correlationId: string, data: Record<string, unknown>) {
  window.parent.postMessage({ type, correlationId, data }, '*')
}

// ─── Animal definitions ─────────────────────────────────────────────
interface AnimalDef {
  emoji: string
  name: string
  sound: string
  habitat: string
  baby: string
}

const ANIMALS: AnimalDef[] = [
  { emoji: '🐶', name: 'Dog', sound: 'Woof!', habitat: 'Farm', baby: 'Puppy' },
  { emoji: '🐱', name: 'Cat', sound: 'Meow!', habitat: 'Farm', baby: 'Kitten' },
  { emoji: '🐮', name: 'Cow', sound: 'Moo!', habitat: 'Farm', baby: 'Calf' },
  { emoji: '🐷', name: 'Pig', sound: 'Oink!', habitat: 'Farm', baby: 'Piglet' },
  { emoji: '🐔', name: 'Chicken', sound: 'Cluck!', habitat: 'Farm', baby: 'Chick' },
  { emoji: '🐴', name: 'Horse', sound: 'Neigh!', habitat: 'Farm', baby: 'Foal' },
  { emoji: '🐸', name: 'Frog', sound: 'Ribbit!', habitat: 'Pond', baby: 'Tadpole' },
  { emoji: '🦁', name: 'Lion', sound: 'Roar!', habitat: 'Jungle', baby: 'Cub' },
  { emoji: '🐘', name: 'Elephant', sound: 'Trumpet!', habitat: 'Jungle', baby: 'Calf' },
  { emoji: '🐍', name: 'Snake', sound: 'Hiss!', habitat: 'Desert', baby: 'Hatchling' },
  { emoji: '🐧', name: 'Penguin', sound: 'Squawk!', habitat: 'Arctic', baby: 'Chick' },
  { emoji: '🐳', name: 'Whale', sound: 'Song!', habitat: 'Ocean', baby: 'Calf' },
  { emoji: '🐠', name: 'Fish', sound: 'Blub!', habitat: 'Ocean', baby: 'Fry' },
  { emoji: '🦊', name: 'Fox', sound: 'Yip!', habitat: 'Forest', baby: 'Kit' },
  { emoji: '🐻', name: 'Bear', sound: 'Growl!', habitat: 'Forest', baby: 'Cub' },
]

const ALL_SOUNDS = [...new Set(ANIMALS.map(a => a.sound))]
const ALL_HABITATS = [...new Set(ANIMALS.map(a => a.habitat))]
const ALL_BABIES = [...new Set(ANIMALS.map(a => a.baby))]

type GameMode = 'sounds' | 'habitat' | 'baby'
type Mode = 'menu' | GameMode | 'result'

interface Question {
  animal: AnimalDef
  options: string[]
  correct: string
  prompt: string
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }; return a
}

function generateQuestion(gameMode: GameMode): Question {
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)]

  if (gameMode === 'sounds') {
    const correct = animal.sound
    const wrongs = shuffle(ALL_SOUNDS.filter(s => s !== correct)).slice(0, 2)
    return { animal, correct, options: shuffle([correct, ...wrongs]), prompt: `What sound does the ${animal.name} make?` }
  }

  if (gameMode === 'habitat') {
    const correct = animal.habitat
    const wrongs = shuffle(ALL_HABITATS.filter(h => h !== correct)).slice(0, 2)
    return { animal, correct, options: shuffle([correct, ...wrongs]), prompt: `Where does the ${animal.name} live?` }
  }

  // baby
  const correct = animal.baby
  const wrongs = shuffle(ALL_BABIES.filter(b => b !== correct)).slice(0, 2)
  return { animal, correct, options: shuffle([correct, ...wrongs]), prompt: `What is a baby ${animal.name} called?` }
}

const ROUNDS_PER_GAME = 5
const MODES_LIST: { id: GameMode; label: string; emoji: string; desc: string }[] = [
  { id: 'sounds', label: 'Animal Sounds', emoji: '🔊', desc: 'What sound does it make?' },
  { id: 'habitat', label: 'Where Do I Live?', emoji: '🏠', desc: 'Find the animal\'s home!' },
  { id: 'baby', label: 'Baby Animals', emoji: '🍼', desc: 'Name the baby animal!' },
]

const HABITAT_EMOJIS: Record<string, string> = {
  Farm: '🏡', Ocean: '🌊', Jungle: '🌴', Forest: '🌲', Arctic: '🧊', Desert: '🏜️', Pond: '🪷',
}

export default function AnimalsGame() {
  const [mode, setMode] = useState<Mode>('menu')
  const [gameMode, setGameMode] = useState<GameMode>('sounds')
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
      sendToPlatform('completion', '', { summary: `Animals game complete! Score: ${score}/${ROUNDS_PER_GAME}` })
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
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>🐾</div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>Animals Game</div>
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
        <div style={{ fontSize: '28px', fontWeight: 700, color: '#111827' }}>
          {pct === 100 ? 'Perfect! You did it!' : pct >= 60 ? 'Great job!' : 'Good try!'}
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
      <div style={{ fontSize: '22px', fontWeight: 700, color: '#111827', textAlign: 'center', marginBottom: '16px' }}>
        {question.prompt}
      </div>

      {/* Animal display */}
      <div style={{
        padding: '24px', borderRadius: '20px', background: 'white', border: '2px solid #e5e7eb',
        textAlign: 'center', marginBottom: '20px',
        minHeight: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: '96px' }}>{question.animal.emoji}</span>
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
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {question.options.map((opt, i) => {
            // For habitat mode, show emoji + label
            if (gameMode === 'habitat') {
              const habitatEmoji = HABITAT_EMOJIS[opt] || '🏠'
              return (
                <button key={i} onClick={() => handleAnswer(opt)} style={{
                  minWidth: '90px', height: '90px', fontSize: '14px', fontWeight: 700,
                  color: '#111827', background: 'white', border: '3px solid #d1d5db',
                  borderRadius: '16px', cursor: 'pointer', transition: 'all 0.1s',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '8px',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#eff6ff' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = 'white' }}
                  onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.9)')}
                  onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <span style={{ fontSize: '32px' }}>{habitatEmoji}</span>
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
