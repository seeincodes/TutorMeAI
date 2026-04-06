import { useState, useEffect } from 'react'
import { playPop, playCelebration } from './sounds'

function sendToPlatform(type: string, correlationId: string, data: Record<string, unknown>) {
  window.parent.postMessage({ type, correlationId, data }, '*')
}

interface ApodData {
  title: string
  explanation: string
  url: string
  hdurl?: string
  date: string
  media_type: string
}

const SPACE_FACTS = [
  "The Sun is 93 million miles away!",
  "Jupiter has 95 moons!",
  "A day on Venus is longer than a year on Venus!",
  "Neutron stars can spin 600 times per second!",
  "There are more stars in the universe than grains of sand on Earth!",
  "Saturn could float in water because it is mostly gas!",
  "The footprints on the Moon will be there for 100 million years!",
  "One million Earths could fit inside the Sun!",
  "Space is completely silent because there is no air to carry sound!",
  "A spacesuit costs about $12 million!",
  "The Milky Way galaxy is about 100,000 light-years across!",
  "Mars has the tallest volcano in the solar system — Olympus Mons!",
  "Light from the Sun takes about 8 minutes to reach Earth!",
  "There are more trees on Earth than stars in the Milky Way!",
  "The International Space Station orbits Earth every 90 minutes!",
  "Pluto is smaller than the United States!",
  "Astronauts grow about 2 inches taller in space!",
]

function randomDateStr(): string {
  const start = new Date('2015-01-01').getTime()
  const end = new Date().getTime()
  const d = new Date(start + Math.random() * (end - start))
  return d.toISOString().split('T')[0]
}

type View = 'apod' | 'facts'

export default function NasaApp() {
  const [view, setView] = useState<View>('apod')
  const [apod, setApod] = useState<ApodData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [factIndex, setFactIndex] = useState(0)
  const [dateInput, setDateInput] = useState('')

  const fetchApod = async (date?: string) => {
    setLoading(true)
    setError(null)
    try {
      const param = date ? `?date=${date}` : ''
      const res = await fetch(`/api/nasa/apod${param}`, { credentials: 'include' })
      if (!res.ok) {
        if (res.status === 429) throw new Error('Rate limited! Please wait a moment and try again.')
        throw new Error(`NASA API error: ${res.status}`)
      }
      const data: ApodData = await res.json()
      setApod(data)
      playCelebration()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load image')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    sendToPlatform('ui_ready', '', {})
    fetchApod()
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
          currentApod: apod ? { title: apod.title, date: apod.date } : null,
          factIndex,
        })
      } else if (tool === 'restore_state') {
        sendToPlatform('tool_result', correlationId, { tool: 'restore_state', message: 'Restored' })
      } else if (tool === 'get_apod') {
        const date = args?.date
        fetch(`/api/nasa/apod${date ? `?date=${date}` : ''}`, { credentials: 'include' })
          .then(r => r.json())
          .then(data => {
            sendToPlatform('tool_result', correlationId, {
              tool: 'get_apod',
              title: data.title,
              explanation: data.explanation,
              date: data.date,
            })
          })
          .catch(() => {
            sendToPlatform('error', correlationId, { message: 'Failed to fetch APOD' })
          })
      } else {
        sendToPlatform('error', correlationId, { message: `Unknown tool: ${tool}` })
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [view, apod, factIndex])

  const handleNewPicture = () => {
    playPop()
    fetchApod(randomDateStr())
  }

  const handleDateSearch = () => {
    playPop()
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      fetchApod(dateInput)
    } else {
      setError('Please enter a date in YYYY-MM-DD format')
    }
  }

  const handleSpaceFacts = () => {
    playPop()
    setView('facts')
    setFactIndex(Math.floor(Math.random() * SPACE_FACTS.length))
  }

  const handleNextFact = () => {
    playPop()
    setFactIndex((factIndex + 1) % SPACE_FACTS.length)
  }

  const handleAskTutor = () => {
    playPop()
    if (apod) {
      sendToPlatform('state_update', '', {
        type: 'ask_tutor',
        message: `Tell me more about "${apod.title}" from NASA's Astronomy Picture of the Day!`,
      })
    }
  }

  const font = 'system-ui, -apple-system, sans-serif'

  const btnStyle = (color = '#3b82f6'): React.CSSProperties => ({
    padding: '12px 20px',
    fontSize: '16px',
    fontWeight: 700,
    color: 'white',
    background: color,
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    transition: 'transform 0.1s',
  })

  // Facts view
  if (view === 'facts') {
    return (
      <div style={{ padding: '24px 16px', maxWidth: '500px', margin: '0 auto', fontFamily: font, textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>&#x1F31F;</div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '24px' }}>Space Facts</div>
        <div style={{
          padding: '32px 24px', borderRadius: '20px', background: 'white', border: '2px solid #e5e7eb',
          fontSize: '20px', color: '#1e3a5f', lineHeight: 1.6, marginBottom: '24px',
          minHeight: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {SPACE_FACTS[factIndex]}
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={handleNextFact} style={btnStyle('#8b5cf6')}>Next Fact</button>
          <button onClick={() => { playPop(); setView('apod') }} style={btnStyle('#6b7280')}>Back to Pictures</button>
        </div>
      </div>
    )
  }

  // APOD view (main)
  return (
    <div style={{ padding: '24px 16px', maxWidth: '500px', margin: '0 auto', fontFamily: font, textAlign: 'center' }}>
      <div style={{ fontSize: '48px', marginBottom: '4px' }}>&#x1F680;</div>
      <div style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>NASA Space Explorer</div>
      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>Astronomy Picture of the Day</div>

      {loading && (
        <div style={{
          padding: '60px 24px', borderRadius: '20px', background: 'white', border: '2px solid #e5e7eb',
          marginBottom: '20px',
        }}>
          <div style={{
            width: '48px', height: '48px', border: '4px solid #e5e7eb', borderTopColor: '#3b82f6',
            borderRadius: '50%', margin: '0 auto 16px',
            animation: 'spin 1s linear infinite',
          }} />
          <div style={{ color: '#6b7280', fontSize: '16px' }}>Loading from NASA...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {error && !loading && (
        <div style={{
          padding: '20px', borderRadius: '14px', background: '#fee2e2', color: '#991b1b',
          marginBottom: '20px', fontSize: '15px',
        }}>
          {error}
        </div>
      )}

      {apod && !loading && (
        <div style={{
          borderRadius: '20px', background: 'white', border: '2px solid #e5e7eb',
          overflow: 'hidden', marginBottom: '20px',
        }}>
          {apod.media_type === 'image' ? (
            <img
              src={apod.url}
              alt={apod.title}
              style={{ width: '100%', maxHeight: '350px', objectFit: 'cover' }}
            />
          ) : (
            <iframe
              src={apod.url}
              title={apod.title}
              style={{ width: '100%', height: '280px', border: 'none' }}
              allowFullScreen
            />
          )}
          <div style={{ padding: '16px', textAlign: 'left' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
              {apod.title}
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>{apod.date}</div>
            <div style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6, maxHeight: '120px', overflow: 'auto' }}>
              {apod.explanation}
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
        <button onClick={handleNewPicture} style={btnStyle('#2563eb')}>New Picture</button>
        <button onClick={handleSpaceFacts} style={btnStyle('#8b5cf6')}>Space Facts</button>
        <button onClick={handleAskTutor} style={btnStyle('#059669')}>Ask Tutor</button>
      </div>

      {/* Date search */}
      <div style={{
        display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center',
        padding: '12px', borderRadius: '12px', background: '#f9fafb', border: '1px solid #e5e7eb',
      }}>
        <input
          type="text"
          value={dateInput}
          onChange={e => setDateInput(e.target.value)}
          placeholder="YYYY-MM-DD"
          style={{
            padding: '8px 12px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '8px',
            outline: 'none', width: '140px', fontFamily: font,
          }}
        />
        <button onClick={handleDateSearch} style={{
          padding: '8px 16px', fontSize: '14px', fontWeight: 600, color: 'white',
          background: '#3b82f6', border: 'none', borderRadius: '8px', cursor: 'pointer',
        }}>
          Search Date
        </button>
      </div>
    </div>
  )
}
