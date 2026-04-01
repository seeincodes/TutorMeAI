import { useState, useEffect, useCallback } from 'react'

function sendToPlatform(type: string, correlationId: string, data: Record<string, unknown>) {
  window.parent.postMessage({ type, correlationId, data }, '*')
}

const BLOCKED_WORDS = new Set(['fuck','shit','damn','ass','bitch','bastard','dick','cock','pussy','cunt','whore','slut','porn','sex','orgasm','erotic','hentai','cocaine','heroin','meth','lsd','rape','molest','suicide'])

function isWordBlocked(word: string): boolean {
  const lower = word.toLowerCase().trim()
  for (const blocked of BLOCKED_WORDS) { if (lower.includes(blocked)) return true }
  return false
}

interface Passage {
  id: string; title: string; level: string; text: string
  vocabulary: { word: string; definition: string }[]
  questions: { question: string; options: string[]; correct: number }[]
}

const PASSAGES: Passage[] = [
  {
    id: 'p1', title: 'The Brave Little Seed', level: 'Beginner',
    text: `A tiny seed fell into the dark soil. "It's so dark down here," the seed whispered. But soon, rain came and gave the seed water. The sun warmed the earth above.\n\nSlowly, a small green sprout pushed through the dirt. Day by day, it grew taller. Leaves unfolded like little green hands reaching for the sky.\n\nBy summer, the sprout had become a beautiful sunflower, standing tall and bright. Birds came to visit, and bees buzzed around its golden petals.\n\n"I was scared of the dark," the sunflower thought, "but it was exactly where I needed to be to grow."`,
    vocabulary: [
      { word: 'sprout', definition: 'A young plant that has just begun to grow from a seed' },
      { word: 'unfolded', definition: 'Opened up or spread out from a folded position' },
      { word: 'petals', definition: 'The colorful parts of a flower that surround the center' },
    ],
    questions: [
      { question: 'Where did the seed land?', options: ['In water', 'In dark soil', 'On a rock', 'In a pot'], correct: 1 },
      { question: 'What did the seed become?', options: ['A tree', 'A rose', 'A sunflower', 'A daisy'], correct: 2 },
      { question: 'What is the lesson of the story?', options: ['Seeds need light', 'Dark places can help you grow', 'Flowers are pretty', 'Rain is important'], correct: 1 },
    ],
  },
  {
    id: 'p2', title: "The Ocean's Secret", level: 'Beginner',
    text: `Maya loved visiting the beach with her grandmother. One morning, they found a beautiful seashell half-buried in the sand.\n\n"Hold it to your ear," Grandma said with a smile. Maya pressed the shell against her ear and gasped. "I can hear the ocean!"\n\nGrandma laughed gently. "That's the sound of air moving inside the shell. But some people believe the ocean leaves a little bit of its song in every shell it touches."\n\nMaya kept the shell in her pocket all day. Every time she felt lonely at school, she would hold it and remember the waves, the sand, and her grandmother's warm smile.`,
    vocabulary: [
      { word: 'buried', definition: 'Hidden or covered under something, like sand or dirt' },
      { word: 'gasped', definition: 'Took a quick, short breath because of surprise or excitement' },
      { word: 'gently', definition: 'In a soft, kind, and careful way' },
    ],
    questions: [
      { question: 'Who did Maya visit the beach with?', options: ['Her mother', 'Her friend', 'Her grandmother', 'Her teacher'], correct: 2 },
      { question: 'What did Maya find?', options: ['A fish', 'A seashell', 'A starfish', 'A bottle'], correct: 1 },
      { question: 'Why did Maya keep the shell?', options: ['To sell it', 'It was valuable', 'It reminded her of the beach and Grandma', 'Her teacher asked for it'], correct: 2 },
    ],
  },
  {
    id: 'p3', title: 'The Water Cycle', level: 'Intermediate',
    text: `Water is always on the move. The journey of water through our environment is called the water cycle, and it has been happening for billions of years.\n\nIt begins with evaporation. The sun heats water in oceans, lakes, and rivers, turning it into water vapor — an invisible gas that rises into the atmosphere. Plants also release water vapor through transpiration.\n\nAs water vapor rises higher, it cools and transforms back into tiny water droplets. This is condensation, and it forms clouds. When droplets combine and become heavy enough, they fall as precipitation — rain, snow, sleet, or hail.\n\nThe water then collects in rivers, lakes, and oceans, or soaks into the ground as groundwater. And the cycle begins again.`,
    vocabulary: [
      { word: 'evaporation', definition: 'The process of liquid water changing into water vapor (gas) due to heat' },
      { word: 'condensation', definition: 'The process of water vapor cooling and turning back into liquid droplets' },
      { word: 'precipitation', definition: 'Water falling from clouds as rain, snow, sleet, or hail' },
      { word: 'atmosphere', definition: 'The layer of gases surrounding the Earth' },
    ],
    questions: [
      { question: 'What starts the water cycle?', options: ['Rain', 'Evaporation', 'Condensation', 'Wind'], correct: 1 },
      { question: 'What forms clouds?', options: ['Evaporation', 'Precipitation', 'Condensation', 'Transpiration'], correct: 2 },
      { question: 'What is precipitation?', options: ['Water turning to gas', 'Clouds forming', 'Water falling from clouds', 'Water soaking into ground'], correct: 2 },
    ],
  },
  {
    id: 'p4', title: 'The Discovery of Penicillin', level: 'Advanced',
    text: `In 1928, Scottish scientist Alexander Fleming made one of the most important accidental discoveries in medical history. After returning from vacation, he noticed that a mold called Penicillium notatum had contaminated one of his petri dishes containing bacteria.\n\nThe bacteria near the mold had been destroyed, while bacteria farther away continued to thrive. Fleming hypothesized that the mold was producing a substance that killed bacteria. He called it "penicillin."\n\nIt wasn't until 1940 that Howard Florey and Ernst Boris Chain developed methods to mass-produce penicillin, just in time for World War II. Penicillin became the first widely used antibiotic, saving an estimated 200 million lives.\n\nToday, antibiotics face a new challenge: antibiotic resistance. Overuse has led to "superbugs" that no longer respond to treatment.`,
    vocabulary: [
      { word: 'contaminated', definition: 'Made impure by contact with something unclean or harmful' },
      { word: 'hypothesized', definition: 'Proposed an explanation based on limited evidence as a starting point' },
      { word: 'antibiotic', definition: 'A medicine that kills or stops the growth of bacteria' },
      { word: 'resistance', definition: 'The ability of bacteria to withstand the effects of an antibiotic' },
    ],
    questions: [
      { question: 'How was penicillin discovered?', options: ['Planned experiment', 'By accident', 'Computer simulation', 'Animal testing'], correct: 1 },
      { question: 'Who made penicillin usable for medicine?', options: ['Fleming alone', 'Florey and Chain', 'Nobel committee', 'Army doctors'], correct: 1 },
      { question: 'What modern problem do antibiotics face?', options: ['Too expensive', 'Antibiotic resistance', 'They taste bad', 'Not enough mold'], correct: 1 },
    ],
  },
]

type Tab = 'read' | 'words' | 'quiz'
interface SavedWord { word: string; definition: string; fromPassage?: string }

export default function DictionaryApp() {
  const [tab, setTab] = useState<Tab>('read')
  const [selectedPassage, setSelectedPassage] = useState<Passage | null>(null)
  const [savedWords, setSavedWords] = useState<SavedWord[]>([])
  const [completedPassages, setCompletedPassages] = useState<Set<string>>(new Set())
  const [showQuestions, setShowQuestions] = useState(false)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [readingScore, setReadingScore] = useState(0)
  const [readingFeedback, setReadingFeedback] = useState<{ correct: boolean; answer: string } | null>(null)
  const [lookupQuery, setLookupQuery] = useState('')
  const [lookupResult, setLookupResult] = useState<{ word: string; definition: string; partOfSpeech?: string; example?: string } | null>(null)
  const [lookupError, setLookupError] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)
  const [quizIndex, setQuizIndex] = useState(0)
  const [quizScore, setQuizScore] = useState(0)
  const [quizFeedback, setQuizFeedback] = useState<{ correct: boolean; answer: string } | null>(null)
  const [quizOptions, setQuizOptions] = useState<string[]>([])

  useEffect(() => { sendToPlatform('ui_ready', '', {}) }, [])

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const msg = event.data
      if (!msg || msg.type !== 'tool_invoke') return
      const { correlationId, tool, params } = msg
      if (tool === 'restore_state') {
        const s = params as Record<string, unknown>
        if (s.savedWords) setSavedWords(s.savedWords as SavedWord[])
        if (s.completedPassages) setCompletedPassages(new Set(s.completedPassages as string[]))
        sendToPlatform('tool_result', correlationId, { tool: 'restore_state', message: 'Restored' })
      } else if (tool === 'define_word') {
        const word = params?.word as string
        if (word) { setTab('words'); setLookupQuery(word); doLookup(word) }
        sendToPlatform('tool_result', correlationId, { tool: 'define_word', word })
        sendToPlatform('completion', correlationId, { summary: `Looked up "${word}"` })
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const saveState = useCallback((words: SavedWord[], completed: Set<string>) => {
    sendToPlatform('state_update', '', { type: 'reading_state', savedWords: words, completedPassages: Array.from(completed) })
  }, [])

  async function doLookup(word: string) {
    if (isWordBlocked(word)) {
      setLookupError("That word isn't available in the student dictionary.")
      sendToPlatform('state_update', '', { type: 'inappropriate_search', word, timestamp: new Date().toISOString() })
      return
    }
    setLookupLoading(true); setLookupError(''); setLookupResult(null)
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      const entry = data[0]; const meaning = entry.meanings?.[0]; const def = meaning?.definitions?.[0]
      setLookupResult({ word: entry.word, definition: def?.definition || 'No definition found', partOfSpeech: meaning?.partOfSpeech, example: def?.example })
    } catch { setLookupError(`Could not find "${word}". Check spelling.`) }
    finally { setLookupLoading(false) }
  }

  function handleLookup(e: React.FormEvent) { e.preventDefault(); if (lookupQuery.trim()) doLookup(lookupQuery.trim().toLowerCase()) }

  function saveWord(word: string, definition: string, fromPassage?: string) {
    if (savedWords.some(w => w.word === word)) return
    const updated = [{ word, definition, fromPassage }, ...savedWords]
    setSavedWords(updated); saveState(updated, completedPassages)
  }

  function answerQuestion(optionIndex: number) {
    if (!selectedPassage || readingFeedback) return
    const q = selectedPassage.questions[questionIndex]
    const correct = optionIndex === q.correct
    if (correct) setReadingScore(s => s + 1)
    setReadingFeedback({ correct, answer: q.options[q.correct] })
  }

  function nextQuestion() {
    if (!selectedPassage) return
    if (questionIndex + 1 >= selectedPassage.questions.length) {
      const nc = new Set(completedPassages); nc.add(selectedPassage.id)
      setCompletedPassages(nc); saveState(savedWords, nc)
      setSelectedPassage(null); setShowQuestions(false); return
    }
    setQuestionIndex(i => i + 1); setReadingFeedback(null)
  }

  function startVocabQuiz() {
    if (savedWords.length < 2) return
    setTab('quiz'); setQuizIndex(0); setQuizScore(0); setQuizFeedback(null)
    const correct = savedWords[0].word
    const others = savedWords.slice(1).map(w => w.word).sort(() => Math.random() - 0.5).slice(0, 3)
    setQuizOptions([correct, ...others].sort(() => Math.random() - 0.5))
  }

  function answerQuiz(answer: string) {
    const correct = savedWords[quizIndex].word
    if (answer === correct) setQuizScore(s => s + 1)
    setQuizFeedback({ correct: answer === correct, answer: correct })
  }

  function nextQuiz() {
    const next = quizIndex + 1
    if (next >= savedWords.length) { setQuizIndex(next); setQuizFeedback(null); return }
    setQuizIndex(next); setQuizFeedback(null)
    const correct = savedWords[next].word
    const others = savedWords.filter((_, i) => i !== next).map(w => w.word).sort(() => Math.random() - 0.5).slice(0, 3)
    setQuizOptions([correct, ...others].sort(() => Math.random() - 0.5))
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 14px', border: 'none', borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent',
    cursor: 'pointer', fontSize: '13px', fontWeight: 500, background: 'none', color: active ? '#3b82f6' : '#6b7280',
  })

  // --- Reading a passage with questions ---
  if (selectedPassage && showQuestions) {
    const q = selectedPassage.questions[questionIndex]
    if (questionIndex >= selectedPassage.questions.length) {
      return (
        <div style={{ padding: '16px', maxWidth: '440px', margin: '0 auto', fontFamily: 'system-ui', textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 700 }}>Reading Complete!</div>
          <div style={{ fontSize: '36px', fontWeight: 700, color: '#3b82f6', margin: '12px 0' }}>{readingScore}/{selectedPassage.questions.length}</div>
          <button onClick={() => { setSelectedPassage(null); setShowQuestions(false) }} style={{ padding: '10px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Done</button>
        </div>
      )
    }
    return (
      <div style={{ padding: '16px', maxWidth: '440px', margin: '0 auto', fontFamily: 'system-ui' }}>
        <button onClick={() => setShowQuestions(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '13px', marginBottom: '12px' }}>&larr; Back to passage</button>
        <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>Question {questionIndex + 1} of {selectedPassage.questions.length}</div>
        <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>{q.question}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {q.options.map((opt, i) => (
            <button key={i} onClick={() => answerQuestion(i)} disabled={!!readingFeedback} style={{
              padding: '10px 14px', borderRadius: '8px', fontSize: '14px', textAlign: 'left', cursor: readingFeedback ? 'default' : 'pointer',
              border: '2px solid', background: 'white', color: '#374151',
              borderColor: !readingFeedback ? '#d1d5db' : i === q.correct ? '#22c55e' : '#d1d5db',
            }}>{opt}</button>
          ))}
        </div>
        {readingFeedback && (
          <div style={{ marginTop: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: readingFeedback.correct ? '#166534' : '#991b1b', marginBottom: '8px' }}>
              {readingFeedback.correct ? 'Correct!' : `The answer is: ${readingFeedback.answer}`}
            </div>
            <button onClick={nextQuestion} style={{ padding: '8px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              {questionIndex + 1 >= selectedPassage.questions.length ? 'Finish' : 'Next'}
            </button>
          </div>
        )}
      </div>
    )
  }

  // --- Reading a passage ---
  if (selectedPassage) {
    return (
      <div style={{ padding: '16px', maxWidth: '440px', margin: '0 auto', fontFamily: 'system-ui' }}>
        <button onClick={() => setSelectedPassage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '13px', marginBottom: '8px' }}>&larr; All passages</button>
        <div style={{ fontSize: '10px', color: '#3b82f6', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>{selectedPassage.level}</div>
        <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>{selectedPassage.title}</div>
        <div style={{ fontSize: '14px', lineHeight: 1.7, color: '#374151', whiteSpace: 'pre-line', marginBottom: '20px', background: 'white', padding: '16px', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
          {selectedPassage.text}
        </div>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Key Vocabulary</div>
          {selectedPassage.vocabulary.map(v => (
            <div key={v.word} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', marginBottom: '4px', background: 'white', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              <div><span style={{ fontWeight: 600, fontSize: '14px' }}>{v.word}</span> <span style={{ fontSize: '12px', color: '#6b7280' }}>— {v.definition}</span></div>
              <button onClick={() => saveWord(v.word, v.definition, selectedPassage.title)} disabled={savedWords.some(w => w.word === v.word)}
                style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', border: '1px solid #d1d5db', cursor: 'pointer', background: savedWords.some(w => w.word === v.word) ? '#f0fdf4' : 'white' }}>
                {savedWords.some(w => w.word === v.word) ? '✓' : '+'}
              </button>
            </div>
          ))}
        </div>
        <button onClick={() => { setShowQuestions(true); setQuestionIndex(0); setReadingScore(0); setReadingFeedback(null) }}
          style={{ width: '100%', padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: 600 }}>
          Comprehension Quiz ({selectedPassage.questions.length} questions)
        </button>
      </div>
    )
  }

  // --- Main view ---
  return (
    <div style={{ maxWidth: '440px', width: '100%', margin: '0 auto', padding: '16px', fontFamily: 'system-ui' }}>
      <div style={{ fontSize: '18px', fontWeight: 700, textAlign: 'center', marginBottom: '4px' }}>Reading & Vocabulary</div>
      <div style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center', marginBottom: '12px' }}>Read stories, learn words, take quizzes</div>

      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: '16px' }}>
        <button onClick={() => setTab('read')} style={tabStyle(tab === 'read')}>📖 Read</button>
        <button onClick={() => setTab('words')} style={tabStyle(tab === 'words')}>📚 Words ({savedWords.length})</button>
        <button onClick={() => setTab('quiz')} style={tabStyle(tab === 'quiz')}>🧠 Quiz</button>
      </div>

      {tab === 'read' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {PASSAGES.map(p => (
            <button key={p.id} onClick={() => setSelectedPassage(p)} style={{
              padding: '14px 16px', borderRadius: '10px', textAlign: 'left', cursor: 'pointer',
              border: `2px solid ${completedPassages.has(p.id) ? '#bbf7d0' : '#e5e7eb'}`,
              background: completedPassages.has(p.id) ? '#f0fdf4' : 'white',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>{p.title}</div>
                {completedPassages.has(p.id) && <span>✅</span>}
              </div>
              <div style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 500, marginTop: '2px' }}>{p.level}</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{p.vocabulary.length} words · {p.questions.length} questions</div>
            </button>
          ))}
        </div>
      )}

      {tab === 'words' && (
        <div>
          <form onSubmit={handleLookup} style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
            <input type="text" value={lookupQuery} onChange={e => setLookupQuery(e.target.value)} placeholder="Look up any word..." autoFocus
              style={{ flex: 1, padding: '8px 10px', fontSize: '13px', border: '1px solid #d1d5db', borderRadius: '6px', outline: 'none' }} />
            <button type="submit" disabled={lookupLoading} style={{ padding: '8px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
              {lookupLoading ? '...' : 'Look up'}
            </button>
          </form>
          {lookupError && <div style={{ color: '#dc2626', fontSize: '12px', padding: '6px', background: '#fee2e2', borderRadius: '6px', marginBottom: '8px' }}>{lookupError}</div>}
          {lookupResult && (
            <div style={{ padding: '12px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '16px', fontWeight: 700 }}>{lookupResult.word}</div>
                <button onClick={() => saveWord(lookupResult.word, lookupResult.definition)} disabled={savedWords.some(w => w.word === lookupResult.word)}
                  style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', border: '1px solid #d1d5db', cursor: 'pointer', background: 'white' }}>
                  {savedWords.some(w => w.word === lookupResult.word) ? '✓ Saved' : '+ Save'}
                </button>
              </div>
              {lookupResult.partOfSpeech && <div style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 500 }}>{lookupResult.partOfSpeech}</div>}
              <div style={{ fontSize: '13px', color: '#374151', marginTop: '4px' }}>{lookupResult.definition}</div>
              {lookupResult.example && <div style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic', marginTop: '4px' }}>"{lookupResult.example}"</div>}
            </div>
          )}
          {savedWords.length > 0 ? savedWords.map(w => (
            <div key={w.word} style={{ padding: '8px 10px', marginBottom: '4px', background: 'white', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              <span style={{ fontWeight: 600, fontSize: '13px' }}>{w.word}</span>
              <span style={{ fontSize: '12px', color: '#6b7280' }}> — {w.definition}</span>
              {w.fromPassage && <div style={{ fontSize: '10px', color: '#9ca3af' }}>from: {w.fromPassage}</div>}
            </div>
          )) : !lookupResult && (
            <div style={{ textAlign: 'center', padding: '24px', color: '#9ca3af', fontSize: '13px' }}>Read passages and save words, or look up any word above</div>
          )}
          {savedWords.length >= 2 && (
            <button onClick={startVocabQuiz} style={{ marginTop: '8px', width: '100%', padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
              Quiz Me on My Words
            </button>
          )}
        </div>
      )}

      {tab === 'quiz' && (
        <div style={{ textAlign: 'center' }}>
          {savedWords.length < 2 ? (
            <div style={{ padding: '24px', color: '#9ca3af', fontSize: '13px' }}>Save at least 2 words to start a quiz</div>
          ) : quizIndex >= savedWords.length ? (
            <div>
              <div style={{ fontSize: '20px', fontWeight: 700 }}>Quiz Complete!</div>
              <div style={{ fontSize: '36px', fontWeight: 700, color: '#3b82f6', margin: '12px 0' }}>{quizScore}/{savedWords.length}</div>
              <button onClick={startVocabQuiz} style={{ padding: '10px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Play Again</button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>Question {quizIndex + 1} of {savedWords.length}</div>
              <div style={{ padding: '16px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', marginBottom: '12px', fontSize: '14px', color: '#374151' }}>
                {savedWords[quizIndex].definition}
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>Which word matches?</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {quizOptions.map(opt => (
                  <button key={opt} onClick={() => !quizFeedback && answerQuiz(opt)} disabled={!!quizFeedback} style={{
                    padding: '10px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: quizFeedback ? 'default' : 'pointer',
                    border: '2px solid', color: '#374151', background: 'white',
                    borderColor: !quizFeedback ? '#d1d5db' : opt === quizFeedback.answer ? '#22c55e' : '#d1d5db',
                  }}>{opt}</button>
                ))}
              </div>
              {quizFeedback && (
                <button onClick={nextQuiz} style={{ marginTop: '12px', padding: '8px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                  {quizIndex + 1 >= savedWords.length ? 'See Results' : 'Next'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
