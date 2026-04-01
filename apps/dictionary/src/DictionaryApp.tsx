import { useState, useEffect, useCallback } from 'react'

function sendToPlatform(type: string, correlationId: string, data: Record<string, unknown>) {
  window.parent.postMessage({ type, correlationId, data }, '*')
}

interface WordEntry {
  word: string
  phonetic?: string
  meanings: { partOfSpeech: string; definitions: { definition: string; example?: string }[] }[]
}

interface SavedWord {
  word: string
  definition: string
  partOfSpeech: string
  savedAt: string
}

type Tab = 'search' | 'saved' | 'quiz'

export default function DictionaryApp() {
  const [tab, setTab] = useState<Tab>('search')
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<WordEntry | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedWords, setSavedWords] = useState<SavedWord[]>([])
  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0)
  const [quizAnswer, setQuizAnswer] = useState('')
  const [quizFeedback, setQuizFeedback] = useState<{ correct: boolean; answer: string } | null>(null)
  const [quizScore, setQuizScore] = useState(0)
  const [quizOptions, setQuizOptions] = useState<string[]>([])

  useEffect(() => { sendToPlatform('ui_ready', '', {}) }, [])

  // Handle tool invocations + restore
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const msg = event.data
      if (!msg || msg.type !== 'tool_invoke') return
      const { correlationId, tool, params } = msg

      if (tool === 'define_word') {
        const word = params?.word as string
        if (word) {
          setQuery(word)
          lookupWord(word)
        }
        sendToPlatform('tool_result', correlationId, { tool: 'define_word', word, message: `Looking up "${word}"` })
        sendToPlatform('completion', correlationId, { summary: `Defined "${word}"` })
      } else if (tool === 'restore_state') {
        const saved = params as Record<string, unknown>
        if (saved.savedWords) {
          setSavedWords(saved.savedWords as SavedWord[])
        }
        if (saved.lastWord) {
          setQuery(saved.lastWord as string)
          lookupWord(saved.lastWord as string)
        }
        sendToPlatform('tool_result', correlationId, { tool: 'restore_state', message: 'Restored' })
      } else {
        sendToPlatform('error', correlationId, { message: `Unknown tool: ${tool}` })
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const saveState = useCallback((words: SavedWord[], lastWord?: string) => {
    sendToPlatform('state_update', '', {
      type: 'dictionary_state',
      savedWords: words,
      lastWord: lastWord || query,
    })
  }, [query])

  async function lookupWord(word: string) {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
      if (!res.ok) throw new Error('Word not found')
      const data = await res.json()
      setResult(data[0] as WordEntry)
      setTab('search')
    } catch {
      setError(`Could not find "${word}". Check spelling and try again.`)
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    lookupWord(query.trim())
  }

  function saveWord() {
    if (!result || !result.meanings[0]) return
    const firstMeaning = result.meanings[0]
    const firstDef = firstMeaning.definitions[0]
    const entry: SavedWord = {
      word: result.word,
      definition: firstDef.definition,
      partOfSpeech: firstMeaning.partOfSpeech,
      savedAt: new Date().toISOString(),
    }
    if (savedWords.some(w => w.word === entry.word)) return
    const updated = [entry, ...savedWords]
    setSavedWords(updated)
    saveState(updated, result.word)
  }

  function removeWord(word: string) {
    const updated = savedWords.filter(w => w.word !== word)
    setSavedWords(updated)
    saveState(updated)
  }

  function startQuiz() {
    if (savedWords.length < 2) return
    setTab('quiz')
    setQuizIndex(0)
    setQuizScore(0)
    setQuizFeedback(null)
    setQuizAnswer('')
    generateOptions(0)
  }

  function generateOptions(idx: number) {
    const correct = savedWords[idx].word
    const others = savedWords.filter((_, i) => i !== idx).map(w => w.word)
    const shuffled = others.sort(() => Math.random() - 0.5).slice(0, 3)
    const opts = [correct, ...shuffled].sort(() => Math.random() - 0.5)
    setQuizOptions(opts)
  }

  function submitQuizAnswer(answer: string) {
    const correct = savedWords[quizIndex].word
    const isCorrect = answer === correct
    if (isCorrect) setQuizScore(s => s + 1)
    setQuizFeedback({ correct: isCorrect, answer: correct })
  }

  function nextQuizQuestion() {
    const next = quizIndex + 1
    if (next >= savedWords.length) {
      setQuizFeedback(null)
      return
    }
    setQuizIndex(next)
    setQuizFeedback(null)
    setQuizAnswer('')
    generateOptions(next)
  }

  const isWordSaved = result && savedWords.some(w => w.word === result.word)
  const quizDone = quizFeedback === null && quizIndex > 0 && tab === 'quiz'

  const s = { tab: { padding: '8px 16px', border: 'none', borderBottom: '2px solid transparent', cursor: 'pointer', fontSize: '13px', fontWeight: 500, background: 'none', color: '#6b7280' } as React.CSSProperties, activeTab: { borderBottomColor: '#3b82f6', color: '#3b82f6' } }

  return (
    <div style={{ maxWidth: '420px', width: '100%', margin: '0 auto', padding: '16px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827', textAlign: 'center', marginBottom: '12px' }}>
        Vocabulary Builder
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: '16px' }}>
        {(['search', 'saved', 'quiz'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ ...s.tab, ...(tab === t ? s.activeTab : {}) }}>
            {t === 'search' ? '🔍 Search' : t === 'saved' ? `📚 My Words (${savedWords.length})` : '🧠 Quiz'}
          </button>
        ))}
      </div>

      {/* Search tab */}
      {tab === 'search' && (
        <div>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Look up a word..."
              autoFocus
              style={{ flex: 1, padding: '10px 12px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none' }}
            />
            <button type="submit" disabled={loading} style={{ padding: '10px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
              {loading ? '...' : 'Look up'}
            </button>
          </form>

          {error && <div style={{ color: '#dc2626', fontSize: '13px', padding: '8px', background: '#fee2e2', borderRadius: '6px' }}>{error}</div>}

          {result && (
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: '#111827' }}>{result.word}</div>
                  {result.phonetic && <div style={{ fontSize: '13px', color: '#6b7280', fontStyle: 'italic' }}>{result.phonetic}</div>}
                </div>
                <button onClick={saveWord} disabled={!!isWordSaved} style={{
                  padding: '4px 10px', fontSize: '12px', borderRadius: '6px', cursor: isWordSaved ? 'default' : 'pointer',
                  border: '1px solid #d1d5db', background: isWordSaved ? '#f0fdf4' : 'white', color: isWordSaved ? '#166534' : '#374151',
                }}>
                  {isWordSaved ? '✓ Saved' : '+ Save'}
                </button>
              </div>

              {result.meanings.map((meaning, i) => (
                <div key={i} style={{ marginTop: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#3b82f6', textTransform: 'uppercase', marginBottom: '4px' }}>
                    {meaning.partOfSpeech}
                  </div>
                  {meaning.definitions.slice(0, 3).map((def, j) => (
                    <div key={j} style={{ marginBottom: '8px' }}>
                      <div style={{ fontSize: '14px', color: '#374151' }}>{j + 1}. {def.definition}</div>
                      {def.example && <div style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic', marginTop: '2px' }}>"{def.example}"</div>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Saved words tab */}
      {tab === 'saved' && (
        <div>
          {savedWords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>📚</div>
              <div style={{ fontSize: '14px' }}>No saved words yet</div>
              <div style={{ fontSize: '12px' }}>Look up words and click "+ Save" to build your list</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {savedWords.map(w => (
                <div key={w.word} style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{w.word} <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 400 }}>{w.partOfSpeech}</span></div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{w.definition.slice(0, 80)}{w.definition.length > 80 ? '...' : ''}</div>
                  </div>
                  <button onClick={() => removeWord(w.word)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '16px', padding: '4px' }}>×</button>
                </div>
              ))}
              {savedWords.length >= 2 && (
                <button onClick={startQuiz} style={{ marginTop: '8px', padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
                  🧠 Quiz Me ({savedWords.length} words)
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quiz tab */}
      {tab === 'quiz' && (
        <div style={{ textAlign: 'center' }}>
          {savedWords.length < 2 ? (
            <div style={{ padding: '32px', color: '#9ca3af' }}>
              <div style={{ fontSize: '14px' }}>Save at least 2 words to start a quiz</div>
            </div>
          ) : quizIndex >= savedWords.length || (quizFeedback === null && quizIndex > 0) ? (
            <div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>Quiz Complete!</div>
              <div style={{ fontSize: '36px', fontWeight: 700, color: '#3b82f6', margin: '12px 0' }}>{quizScore}/{savedWords.length}</div>
              <button onClick={startQuiz} style={{ padding: '10px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
                Play Again
              </button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>
                Question {quizIndex + 1} of {savedWords.length} — Score: {quizScore}
              </div>
              <div style={{ padding: '20px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>{savedWords[quizIndex].partOfSpeech}</div>
                <div style={{ fontSize: '15px', color: '#374151' }}>{savedWords[quizIndex].definition}</div>
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>Which word matches this definition?</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {quizOptions.map(opt => (
                  <button
                    key={opt}
                    onClick={() => !quizFeedback && submitQuizAnswer(opt)}
                    disabled={!!quizFeedback}
                    style={{
                      padding: '10px', borderRadius: '8px', cursor: quizFeedback ? 'default' : 'pointer', fontSize: '14px', fontWeight: 500,
                      border: '2px solid',
                      borderColor: !quizFeedback ? '#d1d5db' : opt === quizFeedback.answer ? '#22c55e' : opt === quizAnswer ? '#ef4444' : '#d1d5db',
                      background: !quizFeedback ? 'white' : opt === quizFeedback.answer ? '#f0fdf4' : 'white',
                      color: '#374151',
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {quizFeedback && (
                <button onClick={nextQuizQuestion} style={{ marginTop: '12px', padding: '10px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
                  {quizIndex + 1 >= savedWords.length ? 'See Results' : 'Next →'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
