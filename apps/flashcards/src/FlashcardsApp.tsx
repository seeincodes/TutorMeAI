import { useState, useEffect } from 'react'

function sendToPlatform(type: string, correlationId: string, data: Record<string, unknown>) {
  window.parent.postMessage({ type, correlationId, data }, '*')
}

interface Card { question: string; answer: string }
interface QuizState { cards: Card[]; currentIndex: number; score: number; total: number; finished: boolean }

export default function FlashcardsApp() {
  const [quiz, setQuiz] = useState<QuizState | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)

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

  const currentCard = quiz && !quiz.finished ? quiz.cards[quiz.currentIndex] : null

  return (
    <div style={{ textAlign: 'center', padding: '24px', maxWidth: '400px' }}>
      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>Flashcard Quiz</div>
      {quiz ? (
        quiz.finished ? (
          <div>
            <div style={{ fontSize: '20px', fontWeight: 600, color: '#374151' }}>Quiz Complete!</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#2563eb', margin: '12px 0' }}>
              {quiz.score}/{quiz.total}
            </div>
          </div>
        ) : currentCard ? (
          <div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>
              Question {quiz.currentIndex + 1} of {quiz.total}
            </div>
            <div style={{
              padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb',
              background: 'white', minHeight: '100px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer',
            }}
              onClick={() => setShowAnswer(!showAnswer)}
            >
              <div style={{ fontSize: '16px', color: '#374151' }}>
                {showAnswer ? currentCard.answer : currentCard.question}
              </div>
            </div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px' }}>Click card to flip</div>
          </div>
        ) : null
      ) : (
        <div style={{ fontSize: '12px', color: '#9ca3af' }}>Ask the chatbot to start a quiz</div>
      )}
    </div>
  )
}
