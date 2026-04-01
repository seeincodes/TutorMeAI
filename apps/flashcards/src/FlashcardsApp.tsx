import { useState, useEffect } from 'react'

function sendToPlatform(type: string, correlationId: string, data: Record<string, unknown>) {
  window.parent.postMessage({ type, correlationId, data }, '*')
}

interface Card { question: string; answer: string }
interface QuizState { cards: Card[]; currentIndex: number; score: number; total: number; finished: boolean }

const DEFAULT_CARDS: Card[] = [
  { question: 'What is the capital of France?', answer: 'Paris' },
  { question: 'What is 7 × 8?', answer: '56' },
  { question: 'What planet is closest to the Sun?', answer: 'Mercury' },
  { question: 'What is H₂O?', answer: 'Water' },
  { question: 'Who wrote Romeo and Juliet?', answer: 'Shakespeare' },
]

export default function FlashcardsApp() {
  const [quiz, setQuiz] = useState<QuizState>({ cards: DEFAULT_CARDS, currentIndex: 0, score: 0, total: DEFAULT_CARDS.length, finished: false })
  const [showAnswer, setShowAnswer] = useState(false)
  const [userAnswer, setUserAnswer] = useState('')

  useEffect(() => { sendToPlatform('ui_ready', '', {}) }, [])

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const msg = event.data
      if (!msg || msg.type !== 'tool_invoke') return
      const { correlationId, tool, params } = msg

      switch (tool) {
        case 'start_quiz': {
          const cards = (params?.cards as Card[]) || [
            { question: 'What is the capital of France?', answer: 'Paris' },
            { question: 'What is 7 × 8?', answer: '56' },
            { question: 'What planet is closest to the Sun?', answer: 'Mercury' },
          ]
          const state: QuizState = { cards, currentIndex: 0, score: 0, total: cards.length, finished: false }
          setQuiz(state)
          setShowAnswer(false)
          sendToPlatform('tool_result', correlationId, {
            tool: 'start_quiz',
            totalCards: cards.length,
            currentQuestion: cards[0].question,
            questionNumber: 1,
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

          sendToPlatform('tool_result', correlationId, {
            tool: 'submit_answer',
            correct,
            correctAnswer: card.answer,
            yourAnswer: answer,
            score: newScore,
            questionsRemaining: quiz.total - nextIndex,
            nextQuestion: finished ? null : quiz.cards[nextIndex].question,
          })

          if (finished) {
            sendToPlatform('completion', correlationId, {
              summary: `Quiz complete! Score: ${newScore}/${quiz.total}`,
            })
          }
          break
        }

        case 'get_score': {
          if (!quiz) {
            sendToPlatform('error', correlationId, { message: 'No quiz started' })
            return
          }
          sendToPlatform('tool_result', correlationId, {
            tool: 'get_score',
            score: quiz.score,
            total: quiz.total,
            currentQuestion: quiz.currentIndex + 1,
            finished: quiz.finished,
          })
          break
        }

        default:
          sendToPlatform('error', correlationId, { message: `Unknown tool: ${tool}` })
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [quiz])

  const currentCard = !quiz.finished ? quiz.cards[quiz.currentIndex] : null

  function handleSubmitAnswer(e: React.FormEvent) {
    e.preventDefault()
    if (!currentCard || !userAnswer.trim()) return
    const correct = userAnswer.toLowerCase().trim() === currentCard.answer.toLowerCase().trim()
    const newScore = correct ? quiz.score + 1 : quiz.score
    const nextIndex = quiz.currentIndex + 1
    const finished = nextIndex >= quiz.cards.length
    setShowAnswer(true)
    setTimeout(() => {
      setQuiz({ ...quiz, score: newScore, currentIndex: nextIndex, finished })
      setShowAnswer(false)
      setUserAnswer('')
    }, 1500)
  }

  function handleRestart() {
    setQuiz({ cards: DEFAULT_CARDS, currentIndex: 0, score: 0, total: DEFAULT_CARDS.length, finished: false })
    setShowAnswer(false)
    setUserAnswer('')
  }

  return (
    <div style={{ textAlign: 'center', padding: '24px', maxWidth: '400px', margin: '0 auto' }}>
      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>Flashcard Quiz</div>
      {quiz.finished ? (
        <div>
          <div style={{ fontSize: '20px', fontWeight: 600, color: '#374151' }}>Quiz Complete!</div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#2563eb', margin: '12px 0' }}>
            {quiz.score}/{quiz.total}
          </div>
          <button onClick={handleRestart} style={{ padding: '8px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
            Play Again
          </button>
        </div>
      ) : currentCard ? (
        <div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>
            Question {quiz.currentIndex + 1} of {quiz.total} — Score: {quiz.score}
          </div>
          <div style={{
            padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb',
            background: 'white', minHeight: '100px', display: 'flex', alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{ fontSize: '18px', color: '#374151', fontWeight: 500 }}>
              {currentCard.question}
            </div>
          </div>
          {showAnswer && (
            <div style={{ margin: '8px 0', padding: '8px', borderRadius: '6px', background: userAnswer.toLowerCase().trim() === currentCard.answer.toLowerCase().trim() ? '#dcfce7' : '#fee2e2', color: userAnswer.toLowerCase().trim() === currentCard.answer.toLowerCase().trim() ? '#166534' : '#991b1b', fontSize: '14px' }}>
              {userAnswer.toLowerCase().trim() === currentCard.answer.toLowerCase().trim() ? 'Correct!' : `Wrong — answer: ${currentCard.answer}`}
            </div>
          )}
          {!showAnswer && (
            <form onSubmit={handleSubmitAnswer} style={{ marginTop: '12px' }}>
              <input
                type="text"
                value={userAnswer}
                onChange={e => setUserAnswer(e.target.value)}
                placeholder="Type your answer..."
                style={{ padding: '8px 12px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '6px', width: '80%' }}
                autoFocus
              />
              <button type="submit" style={{ display: 'block', margin: '8px auto', padding: '6px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
                Submit
              </button>
            </form>
          )}
        </div>
      ) : null}
    </div>
  )
}
