import { useState, useEffect } from 'react'

function sendToPlatform(type: string, correlationId: string, data: Record<string, unknown>) {
  window.parent.postMessage({ type, correlationId, data }, '*')
}

interface WeatherData {
  city: string
  temp?: number
  description?: string
  humidity?: number
  wind?: number
  icon?: string
}

export default function WeatherApp() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<string[]>([])

  useEffect(() => { sendToPlatform('ui_ready', '', {}) }, [])

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const msg = event.data
      if (!msg || msg.type !== 'tool_invoke') return
      const { correlationId, tool, params } = msg

      if (tool === 'get_weather') {
        const city = params?.city as string
        if (city) { setQuery(city); fetchWeather(city) }
        sendToPlatform('tool_result', correlationId, { tool: 'get_weather', city, message: `Fetching weather for ${city}` })
        sendToPlatform('completion', correlationId, { summary: `Weather for ${city}` })
      } else if (tool === 'restore_state') {
        const saved = params as Record<string, unknown>
        if (saved.lastCity) { setQuery(saved.lastCity as string); fetchWeather(saved.lastCity as string) }
        if (saved.history) setHistory(saved.history as string[])
        sendToPlatform('tool_result', correlationId, { tool: 'restore_state', message: 'Restored' })
      } else {
        sendToPlatform('error', correlationId, { message: `Unknown tool: ${tool}` })
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  async function fetchWeather(city: string) {
    setLoading(true)
    setError(null)
    try {
      // Use wttr.in — free, no API key, returns JSON
      const res = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`)
      if (!res.ok) throw new Error('City not found')
      const data = await res.json()
      const current = data.current_condition?.[0]
      const w: WeatherData = {
        city: data.nearest_area?.[0]?.areaName?.[0]?.value || city,
        temp: parseInt(current?.temp_F || '0'),
        description: current?.weatherDesc?.[0]?.value || '',
        humidity: parseInt(current?.humidity || '0'),
        wind: parseInt(current?.windspeedMiles || '0'),
      }
      setWeather(w)
      const newHistory = [city, ...history.filter(h => h.toLowerCase() !== city.toLowerCase())].slice(0, 5)
      setHistory(newHistory)
      sendToPlatform('state_update', '', { type: 'weather_lookup', lastCity: city, history: newHistory })
    } catch {
      setError(`Could not find weather for "${city}"`)
      setWeather(null)
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    fetchWeather(query.trim())
  }

  return (
    <div style={{ maxWidth: '380px', width: '100%', margin: '0 auto', padding: '16px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827', textAlign: 'center', marginBottom: '12px' }}>Weather</div>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          type="text" value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Enter a city..."
          autoFocus
          style={{ flex: 1, padding: '10px 12px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none' }}
        />
        <button type="submit" disabled={loading} style={{ padding: '10px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
          {loading ? '...' : 'Go'}
        </button>
      </form>

      {error && <div style={{ color: '#dc2626', fontSize: '13px', padding: '8px', background: '#fee2e2', borderRadius: '6px', marginBottom: '12px' }}>{error}</div>}

      {weather && (
        <div style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', borderRadius: '12px', padding: '20px', color: 'white', textAlign: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: 500, opacity: 0.9 }}>{weather.city}</div>
          <div style={{ fontSize: '48px', fontWeight: 700, margin: '8px 0' }}>{weather.temp}°F</div>
          <div style={{ fontSize: '15px', opacity: 0.9, marginBottom: '12px' }}>{weather.description}</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', fontSize: '13px', opacity: 0.8 }}>
            <span>💧 {weather.humidity}%</span>
            <span>💨 {weather.wind} mph</span>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>Recent searches</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {history.map(h => (
              <button key={h} onClick={() => { setQuery(h); fetchWeather(h) }}
                style={{ padding: '4px 10px', fontSize: '12px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '16px', cursor: 'pointer', color: '#374151' }}>
                {h}
              </button>
            ))}
          </div>
        </div>
      )}

      {!weather && !error && (
        <div style={{ textAlign: 'center', padding: '24px', color: '#9ca3af', fontSize: '13px' }}>
          Search for a city to see the weather
        </div>
      )}
    </div>
  )
}
