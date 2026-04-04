import { useState, useEffect } from 'react'
import { playPop, playCorrect } from './sounds'

function sendToPlatform(type: string, correlationId: string, data: Record<string, unknown>) {
  window.parent.postMessage({ type, correlationId, data }, '*')
}

interface BookResult {
  key: string
  title: string
  author_name?: string[]
  cover_i?: number
  first_publish_year?: number
  number_of_pages_median?: number
  subject?: string[]
}

interface SavedBook {
  key: string
  title: string
  author: string
  coverId?: number
}

const CATEGORIES = [
  { id: 'adventure', label: 'Adventure', emoji: '\u2694\uFE0F' },
  { id: 'science', label: 'Science', emoji: '\uD83D\uDD2C' },
  { id: 'animals', label: 'Animals', emoji: '\uD83D\uDC3E' },
  { id: 'fairy tales', label: 'Fairy Tales', emoji: '\uD83E\uDDD9' },
  { id: 'history', label: 'History', emoji: '\uD83C\uDFDB\uFE0F' },
  { id: 'space', label: 'Space', emoji: '\uD83D\uDE80' },
]

type View = 'home' | 'results' | 'detail' | 'mybooks'

export default function BooksApp() {
  const [view, setView] = useState<View>('home')
  const [books, setBooks] = useState<BookResult[]>([])
  const [selectedBook, setSelectedBook] = useState<BookResult | null>(null)
  const [savedBooks, setSavedBooks] = useState<SavedBook[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentCategory, setCurrentCategory] = useState('')

  useEffect(() => {
    sendToPlatform('ui_ready', '', {})
  }, [])

  // Tool handlers
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const msg = event.data
      if (!msg || msg.type !== 'tool_invoke') return
      const { correlationId, tool, args } = msg
      if (tool === 'get_state') {
        sendToPlatform('tool_result', correlationId, {
          tool: 'get_state',
          view,
          currentCategory,
          booksCount: books.length,
          savedBooksCount: savedBooks.length,
          selectedBook: selectedBook ? selectedBook.title : null,
        })
      } else if (tool === 'restore_state') {
        sendToPlatform('tool_result', correlationId, { tool: 'restore_state', message: 'Restored' })
      } else if (tool === 'search_books') {
        const query = args?.query || 'adventure'
        fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10`)
          .then(r => r.json())
          .then(data => {
            const results = (data.docs || []).map((d: BookResult) => ({
              title: d.title,
              author: d.author_name?.[0] || 'Unknown',
              cover_i: d.cover_i,
              first_publish_year: d.first_publish_year,
            }))
            sendToPlatform('tool_result', correlationId, { tool: 'search_books', results })
          })
          .catch(() => {
            sendToPlatform('error', correlationId, { message: 'Failed to search books' })
          })
      } else {
        sendToPlatform('error', correlationId, { message: `Unknown tool: ${tool}` })
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [view, books, savedBooks, selectedBook, currentCategory])

  const searchBooks = async (query: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10`)
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      setBooks(data.docs || [])
      setView('results')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to search books')
    } finally {
      setLoading(false)
    }
  }

  const handleCategory = (cat: string) => {
    playPop()
    setCurrentCategory(cat)
    searchBooks(cat)
  }

  const handleSearch = () => {
    playPop()
    if (searchQuery.trim()) {
      setCurrentCategory(searchQuery.trim())
      searchBooks(searchQuery.trim())
    }
  }

  const handleBookClick = (book: BookResult) => {
    playPop()
    setSelectedBook(book)
    setView('detail')
  }

  const handleSaveBook = (book: BookResult) => {
    playCorrect()
    const entry: SavedBook = {
      key: book.key,
      title: book.title,
      author: book.author_name?.[0] || 'Unknown',
      coverId: book.cover_i,
    }
    if (!savedBooks.find(b => b.key === book.key)) {
      setSavedBooks(prev => [...prev, entry])
    }
  }

  const handleRemoveBook = (key: string) => {
    playPop()
    setSavedBooks(prev => prev.filter(b => b.key !== key))
  }

  const font = 'system-ui, -apple-system, sans-serif'

  const btnStyle = (color = '#3b82f6'): React.CSSProperties => ({
    padding: '10px 18px',
    fontSize: '15px',
    fontWeight: 700,
    color: 'white',
    background: color,
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    transition: 'transform 0.1s',
  })

  const coverUrl = (coverId?: number) =>
    coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null

  // Loading spinner
  const Spinner = () => (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <div style={{
        width: '48px', height: '48px', border: '4px solid #e5e7eb', borderTopColor: '#3b82f6',
        borderRadius: '50%', margin: '0 auto 16px',
        animation: 'spin 1s linear infinite',
      }} />
      <div style={{ color: '#6b7280', fontSize: '16px' }}>Searching books...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  // Nav tabs
  const NavTabs = () => (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', justifyContent: 'center' }}>
      <button
        onClick={() => { playPop(); setView('home') }}
        style={{
          ...btnStyle(view === 'home' || view === 'results' || view === 'detail' ? '#3b82f6' : '#d1d5db'),
          fontSize: '13px', padding: '8px 14px',
        }}
      >
        Browse
      </button>
      <button
        onClick={() => { playPop(); setView('mybooks') }}
        style={{
          ...btnStyle(view === 'mybooks' ? '#3b82f6' : '#d1d5db'),
          fontSize: '13px', padding: '8px 14px',
        }}
      >
        My Books ({savedBooks.length})
      </button>
    </div>
  )

  // My Books view
  if (view === 'mybooks') {
    return (
      <div style={{ padding: '24px 16px', maxWidth: '500px', margin: '0 auto', fontFamily: font }}>
        <NavTabs />
        <div style={{ fontSize: '22px', fontWeight: 700, color: '#111827', textAlign: 'center', marginBottom: '16px' }}>
          My Reading List
        </div>
        {savedBooks.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px 20px', fontSize: '16px' }}>
            No books saved yet! Browse and tap "Save to My List" to add books.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {savedBooks.map(book => (
              <div key={book.key} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                background: 'white', border: '2px solid #e5e7eb', borderRadius: '12px',
              }}>
                {book.coverId ? (
                  <img src={coverUrl(book.coverId)!} alt="" style={{ width: '40px', height: '56px', objectFit: 'cover', borderRadius: '4px' }} />
                ) : (
                  <div style={{ width: '40px', height: '56px', background: '#e5e7eb', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                    &#x1F4D6;
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{book.title}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>{book.author}</div>
                </div>
                <button onClick={() => handleRemoveBook(book.key)} style={{
                  padding: '6px 10px', fontSize: '12px', color: '#ef4444', background: '#fee2e2',
                  border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600,
                }}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Detail view
  if (view === 'detail' && selectedBook) {
    const cover = coverUrl(selectedBook.cover_i)
    const isSaved = savedBooks.some(b => b.key === selectedBook.key)
    return (
      <div style={{ padding: '24px 16px', maxWidth: '500px', margin: '0 auto', fontFamily: font }}>
        <NavTabs />
        <button onClick={() => { playPop(); setView('results') }} style={{
          background: 'none', border: 'none', color: '#3b82f6', fontSize: '14px',
          cursor: 'pointer', fontWeight: 600, marginBottom: '16px', padding: 0,
        }}>
          &larr; Back to results
        </button>
        <div style={{
          borderRadius: '20px', background: 'white', border: '2px solid #e5e7eb',
          overflow: 'hidden', padding: '24px', textAlign: 'center',
        }}>
          {cover ? (
            <img src={cover} alt={selectedBook.title} style={{ width: '150px', height: 'auto', borderRadius: '8px', marginBottom: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
          ) : (
            <div style={{ width: '150px', height: '200px', background: '#e5e7eb', borderRadius: '8px', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>
              &#x1F4DA;
            </div>
          )}
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
            {selectedBook.title}
          </div>
          <div style={{ fontSize: '16px', color: '#6b7280', marginBottom: '16px' }}>
            {selectedBook.author_name?.[0] || 'Unknown Author'}
          </div>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
            {selectedBook.first_publish_year && (
              <div style={{ padding: '8px 14px', background: '#f3f4f6', borderRadius: '8px', fontSize: '13px', color: '#374151' }}>
                Published: {selectedBook.first_publish_year}
              </div>
            )}
            {selectedBook.number_of_pages_median && (
              <div style={{ padding: '8px 14px', background: '#f3f4f6', borderRadius: '8px', fontSize: '13px', color: '#374151' }}>
                Pages: {selectedBook.number_of_pages_median}
              </div>
            )}
          </div>
          {selectedBook.subject && selectedBook.subject.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '16px' }}>
              {selectedBook.subject.slice(0, 8).map((s, i) => (
                <span key={i} style={{
                  padding: '4px 10px', background: '#eff6ff', color: '#2563eb',
                  borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                }}>
                  {s}
                </span>
              ))}
            </div>
          )}
          <button
            onClick={() => !isSaved && handleSaveBook(selectedBook)}
            style={btnStyle(isSaved ? '#9ca3af' : '#059669')}
            disabled={isSaved}
          >
            {isSaved ? 'Saved!' : 'Save to My List'}
          </button>
        </div>
      </div>
    )
  }

  // Results view
  if (view === 'results') {
    return (
      <div style={{ padding: '24px 16px', maxWidth: '500px', margin: '0 auto', fontFamily: font }}>
        <NavTabs />
        <button onClick={() => { playPop(); setView('home') }} style={{
          background: 'none', border: 'none', color: '#3b82f6', fontSize: '14px',
          cursor: 'pointer', fontWeight: 600, marginBottom: '12px', padding: 0,
        }}>
          &larr; Back to categories
        </button>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '16px', textAlign: 'center' }}>
          Results for "{currentCategory}"
        </div>

        {loading && <Spinner />}

        {error && (
          <div style={{ padding: '20px', borderRadius: '14px', background: '#fee2e2', color: '#991b1b', marginBottom: '20px', fontSize: '15px' }}>
            {error}
          </div>
        )}

        {!loading && !error && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px',
          }}>
            {books.map((book, i) => {
              const cover = coverUrl(book.cover_i)
              return (
                <div key={book.key || i} onClick={() => handleBookClick(book)} style={{
                  background: 'white', border: '2px solid #e5e7eb', borderRadius: '14px',
                  overflow: 'hidden', cursor: 'pointer', transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#93c5fd'; e.currentTarget.style.background = '#eff6ff' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = 'white' }}
                >
                  {cover ? (
                    <img src={cover} alt="" style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '140px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>
                      &#x1F4D6;
                    </div>
                  )}
                  <div style={{ padding: '10px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', lineHeight: 1.3, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {book.title}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {book.author_name?.[0] || 'Unknown'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Home view
  return (
    <div style={{ padding: '24px 16px', maxWidth: '500px', margin: '0 auto', fontFamily: font, textAlign: 'center' }}>
      <NavTabs />
      <div style={{ fontSize: '48px', marginBottom: '4px' }}>&#x1F4DA;</div>
      <div style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>Book Explorer</div>
      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>Discover amazing books!</div>

      {/* Search bar */}
      <div style={{
        display: 'flex', gap: '8px', marginBottom: '24px',
        padding: '12px', borderRadius: '12px', background: '#f9fafb', border: '1px solid #e5e7eb',
      }}>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="Search for books..."
          style={{
            flex: 1, padding: '8px 12px', fontSize: '14px', border: '1px solid #d1d5db',
            borderRadius: '8px', outline: 'none', fontFamily: font,
          }}
        />
        <button onClick={handleSearch} style={{
          padding: '8px 16px', fontSize: '14px', fontWeight: 600, color: 'white',
          background: '#3b82f6', border: 'none', borderRadius: '8px', cursor: 'pointer',
        }}>
          Search
        </button>
      </div>

      {/* Category buttons */}
      <div style={{ fontSize: '16px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>
        Browse by Category
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => handleCategory(cat.id)} style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '16px',
            background: 'white', border: '2px solid #e5e7eb', borderRadius: '14px',
            cursor: 'pointer', textAlign: 'left', fontSize: '15px', transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#93c5fd'; e.currentTarget.style.background = '#eff6ff' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = 'white' }}
          >
            <span style={{ fontSize: '28px' }}>{cat.emoji}</span>
            <span style={{ fontWeight: 700, color: '#111827' }}>{cat.label}</span>
          </button>
        ))}
      </div>

      {loading && <Spinner />}

      {error && (
        <div style={{ padding: '20px', borderRadius: '14px', background: '#fee2e2', color: '#991b1b', marginTop: '20px', fontSize: '15px' }}>
          {error}
        </div>
      )}
    </div>
  )
}
