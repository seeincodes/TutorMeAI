import { useState, useEffect } from 'react'

function sendToPlatform(type: string, correlationId: string, data: Record<string, unknown>) {
  window.parent.postMessage({ type, correlationId, data }, '*')
}

// --- Types ---

interface Card { question: string; answer: string }

interface QuizState {
  cards: Card[]
  currentIndex: number
  score: number
  total: number
  finished: boolean
  category: string
  level: number
}

// Best score per category+level, e.g. "math-1" → 4
type Progress = Record<string, number>

interface LevelDef { cards: Card[] }

interface CategoryDef {
  id: string
  label: string
  emoji: string
  levels: [LevelDef, LevelDef, LevelDef]
}

// --- Card banks ---

const PASS_THRESHOLD = 3 // out of 5 to unlock next level
const CARDS_PER_QUIZ = 5

const CATEGORIES: CategoryDef[] = [
  {
    id: 'math', label: 'Math', emoji: '🔢',
    levels: [
      { cards: [
        { question: 'What is 5 + 7?', answer: '12' },
        { question: 'What is 3 × 4?', answer: '12' },
        { question: 'What is 20 − 8?', answer: '12' },
        { question: 'What is 10 + 15?', answer: '25' },
        { question: 'What is 6 × 5?', answer: '30' },
        { question: 'What is 50 ÷ 5?', answer: '10' },
        { question: 'What is 8 + 9?', answer: '17' },
      ]},
      { cards: [
        { question: 'What is 7 × 8?', answer: '56' },
        { question: 'What is 12 × 12?', answer: '144' },
        { question: 'What is 100 ÷ 4?', answer: '25' },
        { question: 'What is 15 + 27?', answer: '42' },
        { question: 'What is 9²?', answer: '81' },
        { question: 'What is 3 × 15?', answer: '45' },
        { question: 'What is 1000 − 387?', answer: '613' },
      ]},
      { cards: [
        { question: 'What is the square root of 144?', answer: '12' },
        { question: 'What is 25% of 200?', answer: '50' },
        { question: 'What is 13 × 17?', answer: '221' },
        { question: 'What is 2 to the power of 8?', answer: '256' },
        { question: 'What is 7! (7 factorial)?', answer: '5040' },
        { question: 'What is 15% of 80?', answer: '12' },
        { question: 'What is the square root of 225?', answer: '15' },
      ]},
    ],
  },
  {
    id: 'science', label: 'Science', emoji: '🔬',
    levels: [
      { cards: [
        { question: 'What is H₂O?', answer: 'Water' },
        { question: 'What force keeps us on the ground?', answer: 'Gravity' },
        { question: 'What type of animal is a frog?', answer: 'Amphibian' },
        { question: 'What do plants need to make food?', answer: 'Sunlight' },
        { question: 'How many legs does an insect have?', answer: '6' },
        { question: 'What is the nearest star to Earth?', answer: 'The Sun' },
        { question: 'What are clouds made of?', answer: 'Water droplets' },
      ]},
      { cards: [
        { question: 'What planet is closest to the Sun?', answer: 'Mercury' },
        { question: 'What gas do plants absorb from the air?', answer: 'Carbon dioxide' },
        { question: 'How many bones are in the human body?', answer: '206' },
        { question: 'What is the largest organ in the human body?', answer: 'Skin' },
        { question: 'What is the chemical symbol for gold?', answer: 'Au' },
        { question: 'What is the boiling point of water in °C?', answer: '100' },
        { question: 'What planet is known as the Red Planet?', answer: 'Mars' },
      ]},
      { cards: [
        { question: 'What is the powerhouse of the cell?', answer: 'Mitochondria' },
        { question: 'What is Newton\'s first law called?', answer: 'Law of inertia' },
        { question: 'What is the atomic number of carbon?', answer: '6' },
        { question: 'What type of bond shares electrons?', answer: 'Covalent' },
        { question: 'What is the speed of light in km/s (approx)?', answer: '300000' },
        { question: 'What element has the symbol Fe?', answer: 'Iron' },
        { question: 'What is the pH of pure water?', answer: '7' },
      ]},
    ],
  },
  {
    id: 'geography', label: 'Geography', emoji: '🌍',
    levels: [
      { cards: [
        { question: 'What is the capital of France?', answer: 'Paris' },
        { question: 'What is the largest continent?', answer: 'Asia' },
        { question: 'What ocean is between the US and Europe?', answer: 'Atlantic' },
        { question: 'What is the capital of Japan?', answer: 'Tokyo' },
        { question: 'What is the smallest continent?', answer: 'Australia' },
        { question: 'How many continents are there?', answer: '7' },
        { question: 'What country is shaped like a boot?', answer: 'Italy' },
      ]},
      { cards: [
        { question: 'What is the longest river in the world?', answer: 'Nile' },
        { question: 'What country has the most people?', answer: 'India' },
        { question: 'What is the capital of Brazil?', answer: 'Brasilia' },
        { question: 'What is the largest desert in the world?', answer: 'Sahara' },
        { question: 'What mountain is the tallest on Earth?', answer: 'Everest' },
        { question: 'What is the capital of Australia?', answer: 'Canberra' },
        { question: 'What country has the most land area?', answer: 'Russia' },
      ]},
      { cards: [
        { question: 'What is the deepest ocean trench?', answer: 'Mariana Trench' },
        { question: 'What African country was formerly called Abyssinia?', answer: 'Ethiopia' },
        { question: 'What is the capital of New Zealand?', answer: 'Wellington' },
        { question: 'What strait separates Europe and Africa?', answer: 'Strait of Gibraltar' },
        { question: 'What is the largest lake in Africa?', answer: 'Lake Victoria' },
        { question: 'What country has the most islands?', answer: 'Sweden' },
        { question: 'What is the capital of South Korea?', answer: 'Seoul' },
      ]},
    ],
  },
  {
    id: 'history', label: 'History', emoji: '📜',
    levels: [
      { cards: [
        { question: 'Who was the first President of the United States?', answer: 'George Washington' },
        { question: 'What ancient civilization built the pyramids?', answer: 'Egyptians' },
        { question: 'What was the name of the ship the Pilgrims sailed on?', answer: 'Mayflower' },
        { question: 'Who was the first person to walk on the Moon?', answer: 'Neil Armstrong' },
        { question: 'What year did Columbus reach the Americas?', answer: '1492' },
        { question: 'What is the 4th of July celebrating?', answer: 'Independence Day' },
        { question: 'Who is known as the "Father of the Constitution"?', answer: 'James Madison' },
      ]},
      { cards: [
        { question: 'In what year did World War II end?', answer: '1945' },
        { question: 'Who wrote the Declaration of Independence?', answer: 'Thomas Jefferson' },
        { question: 'What year did the Titanic sink?', answer: '1912' },
        { question: 'What wall divided Berlin from 1961 to 1989?', answer: 'Berlin Wall' },
        { question: 'Who was the British monarch during the American Revolution?', answer: 'King George III' },
        { question: 'What empire was ruled by Julius Caesar?', answer: 'Roman Empire' },
        { question: 'Who gave the "I Have a Dream" speech?', answer: 'Martin Luther King Jr' },
      ]},
      { cards: [
        { question: 'What treaty ended World War I?', answer: 'Treaty of Versailles' },
        { question: 'What year was the Magna Carta signed?', answer: '1215' },
        { question: 'Who was the first Emperor of China?', answer: 'Qin Shi Huang' },
        { question: 'What civilization invented democracy?', answer: 'Greeks' },
        { question: 'What year did the French Revolution begin?', answer: '1789' },
        { question: 'Who painted the ceiling of the Sistine Chapel?', answer: 'Michelangelo' },
        { question: 'What was the Cold War primarily between?', answer: 'US and Soviet Union' },
      ]},
    ],
  },
  {
    id: 'vocabulary', label: 'Vocabulary', emoji: '📖',
    levels: [
      { cards: [
        { question: 'What is a synonym for "happy"?', answer: 'Joyful' },
        { question: 'What is the opposite of "big"?', answer: 'Small' },
        { question: 'What does "brave" mean?', answer: 'Courageous' },
        { question: 'What is the opposite of "fast"?', answer: 'Slow' },
        { question: 'What does "enormous" mean?', answer: 'Very large' },
        { question: 'What is a synonym for "angry"?', answer: 'Furious' },
        { question: 'What is the opposite of "quiet"?', answer: 'Loud' },
      ]},
      { cards: [
        { question: 'What does "benevolent" mean?', answer: 'Kind and generous' },
        { question: 'What does "nocturnal" mean?', answer: 'Active at night' },
        { question: 'What is the opposite of "ancient"?', answer: 'Modern' },
        { question: 'What does "habitat" mean?', answer: 'Natural home of an animal or plant' },
        { question: 'What does "omnivore" mean?', answer: 'Eats both plants and animals' },
        { question: 'What is the opposite of "transparent"?', answer: 'Opaque' },
        { question: 'What does "migrate" mean?', answer: 'Move to a new place' },
      ]},
      { cards: [
        { question: 'What does "ubiquitous" mean?', answer: 'Found everywhere' },
        { question: 'What does "ephemeral" mean?', answer: 'Lasting a very short time' },
        { question: 'What does "pragmatic" mean?', answer: 'Practical and realistic' },
        { question: 'What does "eloquent" mean?', answer: 'Fluent and persuasive in speech' },
        { question: 'What is a synonym for "meticulous"?', answer: 'Thorough' },
        { question: 'What does "ambiguous" mean?', answer: 'Open to more than one meaning' },
        { question: 'What does "resilient" mean?', answer: 'Able to recover quickly' },
      ]},
    ],
  },
  {
    id: 'animals', label: 'Animals', emoji: '🐾',
    levels: [
      { cards: [
        { question: 'What is the largest mammal?', answer: 'Blue whale' },
        { question: 'How many legs does a spider have?', answer: '8' },
        { question: 'What animal is known as the King of the Jungle?', answer: 'Lion' },
        { question: 'What do caterpillars turn into?', answer: 'Butterflies' },
        { question: 'What is the tallest animal?', answer: 'Giraffe' },
        { question: 'What sound does a cow make?', answer: 'Moo' },
        { question: 'How many arms does an octopus have?', answer: '8' },
      ]},
      { cards: [
        { question: 'What is the fastest land animal?', answer: 'Cheetah' },
        { question: 'What is a group of wolves called?', answer: 'Pack' },
        { question: 'What is a baby kangaroo called?', answer: 'Joey' },
        { question: 'What animal has the longest lifespan?', answer: 'Tortoise' },
        { question: 'What is a group of fish called?', answer: 'School' },
        { question: 'What bird can fly backwards?', answer: 'Hummingbird' },
        { question: 'What animal has black and white stripes?', answer: 'Zebra' },
      ]},
      { cards: [
        { question: 'What is the only mammal that can fly?', answer: 'Bat' },
        { question: 'What is the largest species of shark?', answer: 'Whale shark' },
        { question: 'What animal sleeps standing up?', answer: 'Horse' },
        { question: 'What is the most venomous snake?', answer: 'Inland taipan' },
        { question: 'What ocean creature has 3 hearts?', answer: 'Octopus' },
        { question: 'What is a group of crows called?', answer: 'Murder' },
        { question: 'What animal produces pearls?', answer: 'Oyster' },
      ]},
    ],
  },
]

const LEVEL_LABELS = ['Easy', 'Medium', 'Hard']
const LEVEL_COLORS = ['#22c55e', '#f59e0b', '#ef4444']

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function progressKey(catId: string, level: number) { return `${catId}-${level}` }

function isLevelUnlocked(progress: Progress, catId: string, level: number): boolean {
  if (level === 0) return true
  const prevBest = progress[progressKey(catId, level - 1)] ?? 0
  return prevBest >= PASS_THRESHOLD
}

// --- Component ---

export default function FlashcardsApp() {
  const [quiz, setQuiz] = useState<QuizState | null>(null)
  const [progress, setProgress] = useState<Progress>({})
  const [showAnswer, setShowAnswer] = useState(false)
  const [userAnswer, setUserAnswer] = useState('')
  const [lastCorrect, setLastCorrect] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => { sendToPlatform('ui_ready', '', {}) }, [])

  function saveProgress(next: Progress) {
    setProgress(next)
    sendToPlatform('state_update', '', { type: 'flashcard_progress', progress: next })
  }

  // postMessage handler
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const msg = event.data
      if (!msg || msg.type !== 'tool_invoke') return
      const { correlationId, tool, params } = msg

      switch (tool) {
        case 'restore_state': {
          const saved = params as Record<string, unknown>
          if (saved.progress) setProgress(saved.progress as Progress)
          if (saved.cards) {
            setQuiz({
              cards: saved.cards as Card[],
              currentIndex: (saved.currentIndex as number) || 0,
              score: (saved.score as number) || 0,
              total: (saved.total as number) || (saved.cards as Card[]).length,
              finished: (saved.finished as boolean) || false,
              category: (saved.category as string) || '',
              level: (saved.level as number) || 0,
            })
            setShowAnswer(false)
            setUserAnswer('')
          }
          sendToPlatform('tool_result', correlationId, { tool: 'restore_state', message: 'Restored' })
          break
        }

        case 'start_quiz': {
          const customCards = params?.cards as Card[] | undefined
          const cards = customCards && customCards.length > 0
            ? customCards
            : shuffle(CATEGORIES[0].levels[0].cards).slice(0, CARDS_PER_QUIZ)
          const state: QuizState = { cards, currentIndex: 0, score: 0, total: cards.length, finished: false, category: 'custom', level: 0 }
          setQuiz(state)
          setShowAnswer(false)
          setUserAnswer('')
          sendToPlatform('tool_result', correlationId, {
            tool: 'start_quiz', totalCards: cards.length,
            currentQuestion: cards[0].question, questionNumber: 1,
          })
          break
        }

        case 'submit_answer': {
          if (!quiz || quiz.finished) {
            sendToPlatform('error', correlationId, { message: 'No active quiz' })
            return
          }
          const answer = (params?.answer as string) || ''
          const card = quiz.cards[quiz.currentIndex]
          const correct = answer.toLowerCase().trim() === card.answer.toLowerCase().trim()
          const newScore = correct ? quiz.score + 1 : quiz.score
          const nextIndex = quiz.currentIndex + 1
          const finished = nextIndex >= quiz.cards.length
          const newState: QuizState = { ...quiz, score: newScore, currentIndex: nextIndex, finished }
          setQuiz(newState)
          setShowAnswer(false)
          if (finished) {
            const key = progressKey(quiz.category, quiz.level)
            const prev = progress[key] ?? 0
            if (newScore > prev) saveProgress({ ...progress, [key]: newScore })
          }
          sendToPlatform('tool_result', correlationId, {
            tool: 'submit_answer', correct, correctAnswer: card.answer, yourAnswer: answer,
            score: newScore, questionsRemaining: quiz.total - nextIndex,
            nextQuestion: finished ? null : quiz.cards[nextIndex].question,
          })
          if (finished) {
            sendToPlatform('completion', correlationId, { summary: `Quiz complete! Score: ${newScore}/${quiz.total}` })
          }
          break
        }

        case 'get_score': {
          if (!quiz) {
            sendToPlatform('error', correlationId, { message: 'No quiz started' })
            return
          }
          sendToPlatform('tool_result', correlationId, {
            tool: 'get_score', score: quiz.score, total: quiz.total,
            currentQuestion: quiz.currentIndex + 1, finished: quiz.finished,
          })
          break
        }

        default:
          sendToPlatform('error', correlationId, { message: `Unknown tool: ${tool}` })
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [quiz, progress])

  function startLevel(catId: string, level: number) {
    const cat = CATEGORIES.find(c => c.id === catId)
    if (!cat) return
    const cards = shuffle(cat.levels[level].cards).slice(0, CARDS_PER_QUIZ)
    setQuiz({ cards, currentIndex: 0, score: 0, total: cards.length, finished: false, category: catId, level })
    setShowAnswer(false)
    setUserAnswer('')
  }

  function handleSubmitAnswer(e: React.FormEvent) {
    e.preventDefault()
    if (!quiz || quiz.finished) return
    const currentCard = quiz.cards[quiz.currentIndex]
    if (!currentCard || !userAnswer.trim()) return
    const correct = userAnswer.toLowerCase().trim() === currentCard.answer.toLowerCase().trim()
    setLastCorrect(correct)
    setShowAnswer(true)
    const newScore = correct ? quiz.score + 1 : quiz.score
    const nextIndex = quiz.currentIndex + 1
    const finished = nextIndex >= quiz.cards.length
    setTimeout(() => {
      const newQuiz: QuizState = { ...quiz, score: newScore, currentIndex: nextIndex, finished }
      setQuiz(newQuiz)
      setShowAnswer(false)
      setUserAnswer('')
      if (finished) {
        const key = progressKey(quiz.category, quiz.level)
        const prev = progress[key] ?? 0
        if (newScore > prev) saveProgress({ ...progress, [key]: newScore })
      }
      sendToPlatform('state_update', '', {
        type: 'quiz_progress', cards: newQuiz.cards, currentIndex: newQuiz.currentIndex,
        score: newQuiz.score, total: newQuiz.total, finished: newQuiz.finished,
        category: newQuiz.category, level: newQuiz.level, progress,
      })
    }, 1500)
  }

  function handleBackToCategories() {
    setQuiz(null)
    setSelectedCategory(null)
    setShowAnswer(false)
    setUserAnswer('')
  }

  function handleBackToLevels() {
    setQuiz(null)
    setShowAnswer(false)
    setUserAnswer('')
  }

  const font = 'system-ui, -apple-system, sans-serif'

  // ============================================================
  // SCREEN 1: Category picker
  // ============================================================
  if (!quiz && !selectedCategory) {
    return (
      <div style={{ maxWidth: 440, width: '100%', margin: '0 auto', padding: '24px 16px', fontFamily: font }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>🗂️</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Flashcards</div>
          <div style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>Pick a category to start studying</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {CATEGORIES.map(cat => {
            const completedLevels = [0, 1, 2].filter(l => (progress[progressKey(cat.id, l)] ?? 0) >= PASS_THRESHOLD).length
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  padding: '20px 12px', background: 'white', border: '1px solid #e2e8f0',
                  borderRadius: 14, cursor: 'pointer', transition: 'all 0.15s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)', position: 'relative',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#93c5fd'; e.currentTarget.style.background = '#eff6ff' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'white' }}
              >
                <span style={{ fontSize: 28 }}>{cat.emoji}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{cat.label}</span>
                {/* Progress dots */}
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0, 1, 2].map(l => (
                    <div key={l} style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: (progress[progressKey(cat.id, l)] ?? 0) >= PASS_THRESHOLD ? LEVEL_COLORS[l] : '#e2e8f0',
                    }} />
                  ))}
                </div>
                {completedLevels === 3 && (
                  <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 600 }}>Complete!</span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ============================================================
  // SCREEN 2: Level picker for selected category
  // ============================================================
  if (!quiz && selectedCategory) {
    const cat = CATEGORIES.find(c => c.id === selectedCategory)!
    return (
      <div style={{ maxWidth: 400, width: '100%', margin: '0 auto', padding: '24px 16px', fontFamily: font }}>
        <button
          onClick={() => setSelectedCategory(null)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#64748b', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}
        >
          ← All Categories
        </button>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 36 }}>{cat.emoji}</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>{cat.label}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[0, 1, 2].map(level => {
            const unlocked = isLevelUnlocked(progress, cat.id, level)
            const best = progress[progressKey(cat.id, level)] ?? 0
            const passed = best >= PASS_THRESHOLD
            const stars = best >= 5 ? '⭐⭐⭐' : best >= 4 ? '⭐⭐' : best >= 3 ? '⭐' : ''
            return (
              <button
                key={level}
                onClick={() => unlocked && startLevel(cat.id, level)}
                disabled={!unlocked}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '16px 18px', background: unlocked ? 'white' : '#f8fafc',
                  border: `1px solid ${passed ? LEVEL_COLORS[level] : '#e2e8f0'}`,
                  borderRadius: 12, cursor: unlocked ? 'pointer' : 'default',
                  opacity: unlocked ? 1 : 0.5, transition: 'all 0.15s',
                  textAlign: 'left',
                }}
                onMouseEnter={e => { if (unlocked) e.currentTarget.style.background = '#f0f9ff' }}
                onMouseLeave={e => { if (unlocked) e.currentTarget.style.background = 'white' }}
              >
                {/* Level badge */}
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: unlocked ? LEVEL_COLORS[level] : '#cbd5e1',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700, flexShrink: 0,
                }}>
                  {unlocked ? level + 1 : '🔒'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: unlocked ? '#1e293b' : '#94a3b8' }}>
                    Level {level + 1} — {LEVEL_LABELS[level]}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                    {!unlocked
                      ? `Score ${PASS_THRESHOLD}/${CARDS_PER_QUIZ} on Level ${level} to unlock`
                      : best > 0
                        ? `Best: ${best}/${CARDS_PER_QUIZ} ${stars}`
                        : 'Not attempted yet'
                    }
                  </div>
                </div>
                {passed && <span style={{ fontSize: 18 }}>✅</span>}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (!quiz) return null

  const currentCard = !quiz.finished ? quiz.cards[quiz.currentIndex] : null
  const catInfo = CATEGORIES.find(c => c.id === quiz.category)
  const progressPct = ((quiz.currentIndex + (showAnswer ? 1 : 0)) / quiz.total) * 100

  // ============================================================
  // SCREEN 3: Quiz complete
  // ============================================================
  if (quiz.finished) {
    const pct = Math.round((quiz.score / quiz.total) * 100)
    const emoji = pct === 100 ? '🏆' : pct >= 80 ? '🌟' : pct >= 60 ? '👍' : '💪'
    const passed = quiz.score >= PASS_THRESHOLD
    const nextLevelAvailable = quiz.level < 2 && passed && catInfo
    return (
      <div style={{ maxWidth: 400, width: '100%', margin: '0 auto', padding: '24px 16px', fontFamily: font, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>{emoji}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Quiz Complete!</div>
        {catInfo && (
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>
            {catInfo.emoji} {catInfo.label} — Level {quiz.level + 1} ({LEVEL_LABELS[quiz.level]})
          </div>
        )}
        <div style={{
          display: 'inline-flex', alignItems: 'baseline', gap: 4,
          fontSize: 48, fontWeight: 700, color: '#2563eb', margin: '8px 0 4px',
        }}>
          {quiz.score}<span style={{ fontSize: 20, color: '#94a3b8' }}>/ {quiz.total}</span>
        </div>
        <div style={{ fontSize: 14, color: '#64748b', marginBottom: 8 }}>{pct}% correct</div>

        {passed && quiz.level < 2 && (
          <div style={{
            padding: '10px 16px', borderRadius: 10, background: '#dcfce7', color: '#166534',
            fontSize: 13, fontWeight: 500, marginBottom: 16,
          }}>
            🎉 Level {quiz.level + 2} unlocked!
          </div>
        )}
        {!passed && (
          <div style={{
            padding: '10px 16px', borderRadius: 10, background: '#fef3c7', color: '#92400e',
            fontSize: 13, fontWeight: 500, marginBottom: 16,
          }}>
            Score {PASS_THRESHOLD}/{CARDS_PER_QUIZ} to unlock the next level
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {nextLevelAvailable && (
            <button
              onClick={() => startLevel(quiz.category, quiz.level + 1)}
              style={{ padding: '10px 20px', background: LEVEL_COLORS[quiz.level + 1], color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
            >
              Next Level →
            </button>
          )}
          <button
            onClick={() => startLevel(quiz.category, quiz.level)}
            style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
          >
            Try Again
          </button>
          <button
            onClick={handleBackToCategories}
            style={{ padding: '10px 20px', background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 500 }}
          >
            Categories
          </button>
        </div>
      </div>
    )
  }

  // ============================================================
  // SCREEN 4: Active quiz
  // ============================================================
  return (
    <div style={{ maxWidth: 400, width: '100%', margin: '0 auto', padding: '20px 16px', fontFamily: font }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button
          onClick={handleBackToLevels}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          ← Back
        </button>
        <div style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
          {catInfo ? `${catInfo.emoji} ${catInfo.label}` : 'Quiz'}
          <span style={{
            padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
            color: 'white', background: LEVEL_COLORS[quiz.level],
          }}>
            Lv.{quiz.level + 1}
          </span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#2563eb' }}>
          {quiz.score} pts
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2, marginBottom: 20, overflow: 'hidden' }}>
        <div style={{
          height: '100%', background: LEVEL_COLORS[quiz.level], borderRadius: 2,
          width: `${progressPct}%`, transition: 'width 0.3s ease',
        }} />
      </div>

      {/* Question counter */}
      <div style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>
        Question {quiz.currentIndex + 1} of {quiz.total}
      </div>

      {/* Card */}
      {currentCard && (
        <>
          <div style={{
            padding: 28, borderRadius: 16, border: '1px solid #e2e8f0',
            background: 'white', minHeight: 120, display: 'flex', alignItems: 'center',
            justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 18, color: '#1e293b', fontWeight: 500, textAlign: 'center', lineHeight: 1.5 }}>
              {currentCard.question}
            </div>
          </div>

          {showAnswer && (
            <div style={{
              padding: '12px 16px', borderRadius: 10, marginBottom: 12,
              background: lastCorrect ? '#dcfce7' : '#fee2e2',
              color: lastCorrect ? '#166534' : '#991b1b',
              fontSize: 14, fontWeight: 500, textAlign: 'center',
            }}>
              {lastCorrect ? '✓ Correct!' : `✗ Answer: ${currentCard.answer}`}
            </div>
          )}

          {!showAnswer && (
            <form onSubmit={handleSubmitAnswer} style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={userAnswer}
                onChange={e => setUserAnswer(e.target.value)}
                placeholder="Type your answer..."
                autoFocus
                style={{
                  flex: 1, padding: '10px 14px', fontSize: 14,
                  border: '1px solid #e2e8f0', borderRadius: 10, outline: 'none',
                  background: 'white', color: '#1e293b',
                }}
              />
              <button
                type="submit"
                disabled={!userAnswer.trim()}
                style={{
                  padding: '10px 20px', background: userAnswer.trim() ? '#2563eb' : '#94a3b8',
                  color: 'white', border: 'none', borderRadius: 10,
                  cursor: userAnswer.trim() ? 'pointer' : 'default',
                  fontSize: 14, fontWeight: 600,
                }}
              >
                Go
              </button>
            </form>
          )}
        </>
      )}
    </div>
  )
}
