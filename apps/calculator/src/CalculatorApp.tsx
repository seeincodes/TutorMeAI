import { useState, useEffect, useCallback } from 'react'
import { evaluate } from 'mathjs'

function sendToPlatform(type: string, correlationId: string, data: Record<string, unknown>) {
  window.parent.postMessage({ type, correlationId, data }, '*')
}

type Grade = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

interface Lesson {
  id: string
  title: string
  description: string
  problems: Problem[]
}

interface Problem {
  question: string
  answer: number
  hint?: string
}

const CURRICULUM: Record<Grade, Lesson[]> = {
  1: [
    { id: '1a', title: 'Counting & Adding', description: 'Add small numbers together', problems: [
      { question: '2 + 3', answer: 5, hint: 'Count on your fingers!' },
      { question: '4 + 1', answer: 5, hint: 'What comes after 4?' },
      { question: '3 + 3', answer: 6, hint: 'Three plus three more' },
      { question: '5 + 2', answer: 7 },
      { question: '1 + 6', answer: 7 },
    ]},
    { id: '1b', title: 'Simple Subtraction', description: 'Take away small numbers', problems: [
      { question: '5 - 2', answer: 3, hint: 'Start at 5, count back 2' },
      { question: '4 - 1', answer: 3 },
      { question: '6 - 3', answer: 3 },
      { question: '7 - 4', answer: 3 },
      { question: '8 - 5', answer: 3 },
    ]},
  ],
  2: [
    { id: '2a', title: 'Double Digits', description: 'Add numbers up to 20', problems: [
      { question: '8 + 7', answer: 15, hint: 'Make a 10 first: 8+2=10, then add 5' },
      { question: '9 + 6', answer: 15 },
      { question: '12 + 5', answer: 17 },
      { question: '14 + 3', answer: 17 },
      { question: '11 + 9', answer: 20 },
    ]},
    { id: '2b', title: 'Skip Counting', description: 'Count by 2s, 5s, and 10s', problems: [
      { question: '5 + 5 + 5', answer: 15, hint: 'Count by fives!' },
      { question: '10 + 10 + 10', answer: 30 },
      { question: '2 + 2 + 2 + 2', answer: 8 },
      { question: '5 + 5 + 5 + 5', answer: 20 },
      { question: '10 + 10', answer: 20 },
    ]},
  ],
  3: [
    { id: '3a', title: 'Multiplication Basics', description: 'Times tables up to 5', problems: [
      { question: '3 × 4', answer: 12, hint: '3 groups of 4' },
      { question: '5 × 3', answer: 15 },
      { question: '4 × 4', answer: 16 },
      { question: '2 × 7', answer: 14 },
      { question: '5 × 5', answer: 25 },
    ]},
    { id: '3b', title: 'Division Intro', description: 'Sharing equally', problems: [
      { question: '12 / 3', answer: 4, hint: 'Split 12 into 3 equal groups' },
      { question: '15 / 5', answer: 3 },
      { question: '20 / 4', answer: 5 },
      { question: '18 / 6', answer: 3 },
      { question: '10 / 2', answer: 5 },
    ]},
  ],
  4: [
    { id: '4a', title: 'Multi-Digit Multiply', description: 'Multiply bigger numbers', problems: [
      { question: '12 × 3', answer: 36, hint: '10×3 + 2×3' },
      { question: '15 × 4', answer: 60 },
      { question: '23 × 2', answer: 46 },
      { question: '11 × 7', answer: 77 },
      { question: '25 × 4', answer: 100 },
    ]},
    { id: '4b', title: 'Fractions', description: 'Understanding parts of a whole', problems: [
      { question: '1/2 + 1/2', answer: 1, hint: 'Two halves make a whole' },
      { question: '1/4 + 1/4', answer: 0.5 },
      { question: '3/4 - 1/4', answer: 0.5 },
      { question: '1/3 + 1/3', answer: evaluate('1/3 + 1/3') as number },
      { question: '2/5 + 1/5', answer: 0.6 },
    ]},
  ],
  5: [
    { id: '5a', title: 'Decimals', description: 'Adding and subtracting decimals', problems: [
      { question: '3.5 + 2.7', answer: 6.2, hint: 'Line up the decimal points' },
      { question: '10.0 - 4.3', answer: 5.7 },
      { question: '1.25 + 3.75', answer: 5 },
      { question: '7.8 - 2.3', answer: 5.5 },
      { question: '0.5 + 0.5 + 0.5', answer: 1.5 },
    ]},
    { id: '5b', title: 'Order of Operations', description: 'PEMDAS in action', problems: [
      { question: '2 + 3 × 4', answer: 14, hint: 'Multiply first, then add' },
      { question: '(2 + 3) × 4', answer: 20, hint: 'Parentheses first!' },
      { question: '10 - 2 × 3', answer: 4 },
      { question: '(8 + 2) / 5', answer: 2 },
      { question: '3 × 3 + 1', answer: 10 },
    ]},
  ],
  6: [
    { id: '6a', title: 'Negative Numbers', description: 'Working below zero', problems: [
      { question: '5 + (-3)', answer: 2, hint: 'Adding a negative is like subtracting' },
      { question: '-4 + 7', answer: 3 },
      { question: '-3 × 2', answer: -6 },
      { question: '-8 + (-2)', answer: -10 },
      { question: '(-4) × (-3)', answer: 12, hint: 'Negative times negative = positive' },
    ]},
    { id: '6b', title: 'Percentages', description: 'Parts per hundred', problems: [
      { question: '50% of 80', answer: 40, hint: '50% means half' },
      { question: '25% of 60', answer: 15 },
      { question: '10% of 250', answer: 25 },
      { question: '20% of 45', answer: 9 },
      { question: '75% of 100', answer: 75 },
    ]},
  ],
  7: [
    { id: '7a', title: 'Expressions & Variables', description: 'Solve for x', problems: [
      { question: 'x + 5 = 12, x = ?', answer: 7, hint: 'What plus 5 equals 12?' },
      { question: '3x = 15, x = ?', answer: 5 },
      { question: 'x - 8 = 4, x = ?', answer: 12 },
      { question: '2x + 1 = 9, x = ?', answer: 4 },
      { question: 'x / 3 = 6, x = ?', answer: 18 },
    ]},
    { id: '7b', title: 'Ratios & Proportions', description: 'Comparing quantities', problems: [
      { question: '3:6 simplified = ?:2 (answer the ?)', answer: 1 },
      { question: 'If 2 apples cost $6, how much for 5?', answer: 15 },
      { question: '4/8 = x/20, x = ?', answer: 10 },
      { question: '3/5 = 9/x, x = ?', answer: 15 },
      { question: '6:10 = 3:x, x = ?', answer: 5 },
    ]},
  ],
  8: [
    { id: '8a', title: 'Exponents', description: 'Powers and roots', problems: [
      { question: '2^4', answer: 16, hint: '2 × 2 × 2 × 2' },
      { question: '3^3', answer: 27 },
      { question: '5^2', answer: 25 },
      { question: '√144', answer: 12, hint: 'What number times itself = 144?' },
      { question: '10^3', answer: 1000 },
    ]},
    { id: '8b', title: 'Linear Equations', description: 'Slope and intercept', problems: [
      { question: 'y = 2x + 1, when x=3, y = ?', answer: 7 },
      { question: 'y = -x + 10, when x=4, y = ?', answer: 6 },
      { question: 'y = 3x, when x=5, y = ?', answer: 15 },
      { question: 'y = x/2 + 3, when x=8, y = ?', answer: 7 },
      { question: 'y = 4x - 2, when x=2, y = ?', answer: 6 },
    ]},
  ],
}

const GRADE_LABELS: Record<Grade, string> = {
  1: '1st Grade', 2: '2nd Grade', 3: '3rd Grade', 4: '4th Grade',
  5: '5th Grade', 6: '6th Grade', 7: '7th Grade', 8: '8th Grade',
}

interface Progress {
  completedLessons: Set<string>
  unlockedGrade: Grade
  stars: Record<string, number> // lessonId -> stars (0-3)
}

export default function CalculatorApp() {
  const [progress, setProgress] = useState<Progress>({
    completedLessons: new Set(),
    unlockedGrade: 1,
    stars: {},
  })
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null)
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null)
  const [currentProblem, setCurrentProblem] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [lessonScore, setLessonScore] = useState(0)
  const [lessonMistakes, setLessonMistakes] = useState(0)

  useEffect(() => { sendToPlatform('ui_ready', '', {}) }, [])

  // Handle tool invocations
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const msg = event.data
      if (!msg || msg.type !== 'tool_invoke') return
      const { correlationId, tool, params } = msg

      if (tool === 'calculate') {
        const expr = params?.expression as string
        if (!expr) { sendToPlatform('error', correlationId, { message: 'No expression' }); return }
        try {
          const res = evaluate(expr)
          sendToPlatform('tool_result', correlationId, { tool: 'calculate', expression: expr, result: String(res) })
          sendToPlatform('completion', correlationId, { summary: `${expr} = ${res}` })
        } catch (e) {
          sendToPlatform('error', correlationId, { message: `Cannot evaluate: ${expr}` })
        }
      } else if (tool === 'restore_state') {
        const saved = params as Record<string, unknown>
        if (saved.unlockedGrade) {
          setProgress({
            completedLessons: new Set((saved.completedLessons as string[]) || []),
            unlockedGrade: (saved.unlockedGrade as Grade) || 1,
            stars: (saved.stars as Record<string, number>) || {},
          })
        }
        sendToPlatform('tool_result', correlationId, { tool: 'restore_state', message: 'Progress restored' })
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const saveProgress = useCallback((newProgress: Progress) => {
    setProgress(newProgress)
    sendToPlatform('state_update', '', {
      type: 'math_progress',
      unlockedGrade: newProgress.unlockedGrade,
      completedLessons: Array.from(newProgress.completedLessons),
      stars: newProgress.stars,
    })
  }, [])

  function startLesson(lesson: Lesson) {
    setActiveLesson(lesson)
    setCurrentProblem(0)
    setUserAnswer('')
    setFeedback(null)
    setShowHint(false)
    setLessonScore(0)
    setLessonMistakes(0)
  }

  function submitAnswer(e: React.FormEvent) {
    e.preventDefault()
    if (!activeLesson || feedback) return

    const problem = activeLesson.problems[currentProblem]
    const userNum = parseFloat(userAnswer)
    const correct = Math.abs(userNum - problem.answer) < 0.01

    if (correct) {
      setLessonScore(s => s + 1)
      setFeedback({ correct: true, message: 'Correct!' })
    } else {
      setLessonMistakes(m => m + 1)
      setFeedback({ correct: false, message: `Not quite — the answer is ${problem.answer}` })
    }
  }

  function nextProblem() {
    if (!activeLesson) return

    if (currentProblem + 1 >= activeLesson.problems.length) {
      // Lesson complete
      const total = activeLesson.problems.length
      const stars = lessonMistakes === 0 ? 3 : lessonMistakes <= 1 ? 2 : 1
      const newCompleted = new Set(progress.completedLessons)
      newCompleted.add(activeLesson.id)

      // Check if all lessons in current grade are complete → unlock next grade
      const gradeNum = parseInt(activeLesson.id[0]) as Grade
      const gradeLessons = CURRICULUM[gradeNum]
      const allComplete = gradeLessons.every(l => newCompleted.has(l.id))
      const newUnlocked = (allComplete && gradeNum < 8 ? Math.max(progress.unlockedGrade, gradeNum + 1) : progress.unlockedGrade) as Grade

      const newStars = { ...progress.stars, [activeLesson.id]: Math.max(stars, progress.stars[activeLesson.id] || 0) }
      const newProgress = { completedLessons: newCompleted, unlockedGrade: newUnlocked, stars: newStars }
      saveProgress(newProgress)

      setActiveLesson(null)
      setFeedback(null)

      if (allComplete && newUnlocked > gradeNum) {
        sendToPlatform('state_update', '', {
          type: 'grade_unlocked',
          grade: newUnlocked,
          message: `Grade ${newUnlocked} unlocked!`,
        })
      }
      return
    }

    setCurrentProblem(p => p + 1)
    setUserAnswer('')
    setFeedback(null)
    setShowHint(false)
  }

  // Active lesson view
  if (activeLesson) {
    const problem = activeLesson.problems[currentProblem]
    const isLastProblem = currentProblem + 1 >= activeLesson.problems.length
    const total = activeLesson.problems.length

    return (
      <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <button onClick={() => setActiveLesson(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '13px' }}>&larr; Back</button>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>{currentProblem + 1} / {total}</span>
        </div>

        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>{activeLesson.title}</div>

        {/* Progress bar */}
        <div style={{ height: '4px', background: '#e5e7eb', borderRadius: '2px', marginBottom: '20px' }}>
          <div style={{ height: '100%', width: `${((currentProblem + (feedback ? 1 : 0)) / total) * 100}%`, background: '#3b82f6', borderRadius: '2px', transition: 'width 0.3s' }} />
        </div>

        {/* Problem */}
        <div style={{ fontSize: '28px', fontWeight: 700, color: '#111827', textAlign: 'center', padding: '24px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '16px' }}>
          {problem.question}
        </div>

        {/* Hint */}
        {problem.hint && !feedback && (
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            {showHint ? (
              <div style={{ fontSize: '13px', color: '#d97706', background: '#fffbeb', padding: '8px 12px', borderRadius: '8px' }}>
                💡 {problem.hint}
              </div>
            ) : (
              <button onClick={() => setShowHint(true)} style={{ fontSize: '12px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                Need a hint?
              </button>
            )}
          </div>
        )}

        {/* Answer input */}
        {!feedback ? (
          <form onSubmit={submitAnswer} style={{ textAlign: 'center' }}>
            <input
              type="number"
              step="any"
              value={userAnswer}
              onChange={e => setUserAnswer(e.target.value)}
              placeholder="Your answer"
              autoFocus
              style={{ fontSize: '20px', padding: '10px 16px', borderRadius: '8px', border: '2px solid #d1d5db', width: '160px', textAlign: 'center', outline: 'none' }}
            />
            <button type="submit" disabled={!userAnswer} style={{ display: 'block', margin: '12px auto', padding: '10px 32px', background: userAnswer ? '#3b82f6' : '#9ca3af', color: 'white', border: 'none', borderRadius: '8px', cursor: userAnswer ? 'pointer' : 'default', fontSize: '15px', fontWeight: 500 }}>
              Check
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ padding: '12px', borderRadius: '8px', marginBottom: '12px', fontSize: '16px', fontWeight: 600, background: feedback.correct ? '#dcfce7' : '#fee2e2', color: feedback.correct ? '#166534' : '#991b1b' }}>
              {feedback.correct ? '✓' : '✗'} {feedback.message}
            </div>
            <button onClick={nextProblem} style={{ padding: '10px 32px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: 500 }}>
              {isLastProblem ? 'Finish Lesson' : 'Next →'}
            </button>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: '#6b7280' }}>
          Score: {lessonScore}/{currentProblem + (feedback ? 1 : 0)}
        </div>
      </div>
    )
  }

  // Grade selection / lesson list
  if (selectedGrade) {
    const lessons = CURRICULUM[selectedGrade]
    const isLocked = selectedGrade > progress.unlockedGrade

    return (
      <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
        <button onClick={() => setSelectedGrade(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '13px', marginBottom: '16px' }}>&larr; All Grades</button>
        <div style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>{GRADE_LABELS[selectedGrade]}</div>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>{lessons.length} lessons</div>

        {isLocked ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔒</div>
            <div style={{ fontSize: '14px' }}>Complete all {GRADE_LABELS[(selectedGrade - 1) as Grade]} lessons to unlock</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {lessons.map(lesson => {
              const completed = progress.completedLessons.has(lesson.id)
              const starCount = progress.stars[lesson.id] || 0
              return (
                <button key={lesson.id} onClick={() => startLesson(lesson)} style={{
                  padding: '14px 16px', borderRadius: '10px', border: `2px solid ${completed ? '#bbf7d0' : '#e5e7eb'}`,
                  background: completed ? '#f0fdf4' : 'white', cursor: 'pointer', textAlign: 'left',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 600, color: '#111827', fontSize: '15px' }}>{lesson.title}</div>
                    {completed && <span style={{ fontSize: '14px' }}>{'⭐'.repeat(starCount)}</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{lesson.description}</div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Grade overview
  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>Math Lessons</div>
        <div style={{ fontSize: '13px', color: '#6b7280' }}>Pick your grade level to start learning</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {([1,2,3,4,5,6,7,8] as Grade[]).map(grade => {
          const lessons = CURRICULUM[grade]
          const completed = lessons.filter(l => progress.completedLessons.has(l.id)).length
          const isLocked = grade > progress.unlockedGrade
          const totalStars = lessons.reduce((sum, l) => sum + (progress.stars[l.id] || 0), 0)
          const maxStars = lessons.length * 3

          return (
            <button key={grade} onClick={() => setSelectedGrade(grade)} style={{
              padding: '14px', borderRadius: '10px', border: '2px solid #e5e7eb',
              background: isLocked ? '#f9fafb' : completed === lessons.length ? '#f0fdf4' : 'white',
              cursor: 'pointer', textAlign: 'center', opacity: isLocked ? 0.6 : 1,
            }}>
              <div style={{ fontSize: '22px', marginBottom: '4px' }}>
                {isLocked ? '🔒' : completed === lessons.length ? '✅' : '📘'}
              </div>
              <div style={{ fontWeight: 600, color: '#111827', fontSize: '14px' }}>{GRADE_LABELS[grade]}</div>
              <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                {isLocked ? 'Locked' : `${completed}/${lessons.length} lessons`}
              </div>
              {!isLocked && totalStars > 0 && (
                <div style={{ fontSize: '10px', color: '#d97706', marginTop: '2px' }}>
                  ⭐ {totalStars}/{maxStars}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
