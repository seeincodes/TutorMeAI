import { useState, useEffect, useRef } from 'react'

function sendToPlatform(type: string, correlationId: string, data: Record<string, unknown>) {
  window.parent.postMessage({ type, correlationId, data }, '*')
}

// --- Types ---

interface HourlyData {
  time: string
  tempF: number
  description: string
  icon: string
  chanceOfRain: number
  humidity: number
  wind: number
  feelsLike: number
}

interface DailyData {
  date: string
  dayName: string
  high: number
  low: number
  description: string
  icon: string
  hourly: HourlyData[]
}

interface CityWeather {
  city: string
  temp: number
  description: string
  humidity: number
  wind: number
  feelsLike: number
  high: number
  low: number
  icon: string
  isLocal?: boolean
  forecast: DailyData[]
}

// --- Helpers ---

const WEATHER_ICONS: Record<string, string> = {
  'Sunny': '☀️', 'Clear': '🌙', 'Partly cloudy': '⛅', 'Partly Cloudy': '⛅',
  'Cloudy': '☁️', 'Overcast': '☁️', 'Mist': '🌫️', 'Fog': '🌫️',
  'Patchy rain possible': '🌦️', 'Patchy rain nearby': '🌦️',
  'Light rain': '🌧️', 'Light drizzle': '🌧️', 'Moderate rain': '🌧️',
  'Heavy rain': '🌧️', 'Light rain shower': '🌦️',
  'Moderate or heavy rain shower': '🌧️', 'Torrential rain shower': '🌧️',
  'Thundery outbreaks possible': '⛈️', 'Patchy light rain with thunder': '⛈️',
  'Moderate or heavy rain with thunder': '⛈️',
  'Patchy light snow': '🌨️', 'Light snow': '🌨️',
  'Moderate snow': '❄️', 'Heavy snow': '❄️', 'Blizzard': '🌨️',
}

function getIcon(desc: string): string {
  return WEATHER_ICONS[desc.trim()] || '🌡️'
}

function getGradient(desc: string): string {
  const d = desc.toLowerCase()
  if (d.includes('rain') || d.includes('drizzle')) return 'linear-gradient(135deg, #667eea, #764ba2)'
  if (d.includes('snow') || d.includes('blizzard')) return 'linear-gradient(135deg, #e0e5ec, #a8b5c8)'
  if (d.includes('cloud') || d.includes('overcast')) return 'linear-gradient(135deg, #89a0b8, #6b7d94)'
  if (d.includes('thunder') || d.includes('storm')) return 'linear-gradient(135deg, #4a5568, #2d3748)'
  if (d.includes('fog') || d.includes('mist')) return 'linear-gradient(135deg, #b8c6d4, #8fa3b8)'
  return 'linear-gradient(135deg, #56a8f7, #1d6ad8)'
}

function formatTime(t: string): string {
  const h = parseInt(t) / 100
  if (h === 0) return '12 AM'
  if (h < 12) return `${h} AM`
  if (h === 12) return '12 PM'
  return `${h - 12} PM`
}

function getDayName(dateStr: string, index: number): string {
  if (index === 0) return 'Today'
  if (index === 1) return 'Tomorrow'
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short' })
}

function parseHourly(raw: Record<string, unknown>): HourlyData {
  const desc = ((raw.weatherDesc as Array<{ value: string }>)?.[0]?.value || '').trim()
  return {
    time: raw.time as string,
    tempF: parseInt(raw.tempF as string || '0'),
    description: desc,
    icon: getIcon(desc),
    chanceOfRain: parseInt(raw.chanceofrain as string || '0'),
    humidity: parseInt(raw.humidity as string || '0'),
    wind: parseInt(raw.windspeedMiles as string || '0'),
    feelsLike: parseInt(raw.FeelsLikeF as string || '0'),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseApiResponse(data: any, cityFallback: string, isLocal?: boolean): CityWeather {
  const current = data.current_condition?.[0]
  const areaName = data.nearest_area?.[0]?.areaName?.[0]?.value || cityFallback
  const desc = (current?.weatherDesc?.[0]?.value || '').trim()
  const forecast: DailyData[] = (data.weather || []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (day: any, i: number) => {
      const dayDesc = (day.hourly?.[4]?.weatherDesc?.[0]?.value || day.hourly?.[3]?.weatherDesc?.[0]?.value || '').trim()
      return {
        date: day.date,
        dayName: getDayName(day.date, i),
        high: parseInt(day.maxtempF || '0'),
        low: parseInt(day.mintempF || '0'),
        description: dayDesc,
        icon: getIcon(dayDesc),
        hourly: (day.hourly || []).map(parseHourly),
      }
    }
  )
  return {
    city: areaName,
    temp: parseInt(current?.temp_F || '0'),
    description: desc,
    humidity: parseInt(current?.humidity || '0'),
    wind: parseInt(current?.windspeedMiles || '0'),
    feelsLike: parseInt(current?.FeelsLikeF || '0'),
    high: parseInt(data.weather?.[0]?.maxtempF || '0'),
    low: parseInt(data.weather?.[0]?.mintempF || '0'),
    icon: getIcon(desc),
    isLocal,
    forecast,
  }
}

async function fetchCity(city: string): Promise<CityWeather> {
  const res = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`)
  if (!res.ok) throw new Error('City not found')
  return parseApiResponse(await res.json(), city)
}

async function fetchCoords(lat: number, lon: number): Promise<CityWeather> {
  const res = await fetch(`https://wttr.in/${lat},${lon}?format=j1`)
  if (!res.ok) throw new Error('Location not found')
  return parseApiResponse(await res.json(), 'Your Location', true)
}

// --- Components ---

function HourlyRow({ hours }: { hours: HourlyData[] }) {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <div
      ref={ref}
      style={{
        display: 'flex', gap: 2, overflowX: 'auto', paddingBottom: 8,
        scrollbarWidth: 'thin',
      }}
    >
      {hours.map((h, i) => (
        <div key={i} style={{
          minWidth: 64, display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 4, padding: '8px 6px', borderRadius: 10,
          background: 'rgba(255,255,255,0.08)', flexShrink: 0,
        }}>
          <div style={{ fontSize: 11, opacity: 0.7 }}>{formatTime(h.time)}</div>
          <div style={{ fontSize: 20 }}>{h.icon}</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{h.tempF}°</div>
          {h.chanceOfRain > 0 && (
            <div style={{ fontSize: 10, opacity: 0.7 }}>💧 {h.chanceOfRain}%</div>
          )}
        </div>
      ))}
    </div>
  )
}

function DailyForecast({ forecast, onSelectDay, selectedDay }: {
  forecast: DailyData[]
  onSelectDay: (i: number) => void
  selectedDay: number
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {forecast.map((day, i) => (
        <button
          key={day.date}
          onClick={() => onSelectDay(i)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 8px', background: selectedDay === i ? 'rgba(255,255,255,0.12)' : 'transparent',
            border: 'none', borderRadius: 8, cursor: 'pointer', color: 'white',
            width: '100%', textAlign: 'left', transition: 'background 0.15s',
          }}
        >
          <span style={{ width: 56, fontSize: 13, fontWeight: selectedDay === i ? 600 : 400 }}>{day.dayName}</span>
          <span style={{ fontSize: 18 }}>{day.icon}</span>
          <span style={{ flex: 1, fontSize: 12, opacity: 0.7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {day.description}
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, minWidth: 60, textAlign: 'right' }}>
            {day.high}° <span style={{ opacity: 0.6, fontWeight: 400 }}>{day.low}°</span>
          </span>
        </button>
      ))}
    </div>
  )
}

function WeatherCard({ w, onRemove, onRefresh }: {
  w: CityWeather
  onRemove: () => void
  onRefresh: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [selectedDay, setSelectedDay] = useState(0)

  return (
    <div style={{
      background: getGradient(w.description),
      borderRadius: 16, color: 'white', position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative circle */}
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 100, height: 100, borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)', pointerEvents: 'none',
      }} />

      {/* Main card content */}
      <div style={{ padding: '20px 18px 14px' }}>
        {/* Top row: city + actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              {w.isLocal && <span style={{ fontSize: 12 }}>📍</span>}
              {w.city}
            </div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>{w.description}</div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={onRefresh} title="Refresh"
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, padding: '4px 8px', color: 'white', cursor: 'pointer', fontSize: 13 }}>
              ↻
            </button>
            <button onClick={onRemove} title="Remove"
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, padding: '4px 8px', color: 'white', cursor: 'pointer', fontSize: 13 }}>
              ✕
            </button>
          </div>
        </div>

        {/* Temperature row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '12px 0' }}>
          <span style={{ fontSize: 44 }}>{w.icon}</span>
          <div>
            <div style={{ fontSize: 42, fontWeight: 700, lineHeight: 1 }}>{w.temp}°</div>
            <div style={{ fontSize: 13, opacity: 0.8, marginTop: 2 }}>
              Feels like {w.feelsLike}°  ·  H:{w.high}° L:{w.low}°
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'flex', gap: 16, fontSize: 13, opacity: 0.85,
          borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 12, marginTop: 4,
        }}>
          <span>💧 {w.humidity}%</span>
          <span>💨 {w.wind} mph</span>
        </div>
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%', padding: '8px 0', background: 'rgba(0,0,0,0.1)',
          border: 'none', color: 'white', cursor: 'pointer', fontSize: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          opacity: 0.8, transition: 'opacity 0.15s',
        }}
      >
        {expanded ? '▲ Hide forecast' : '▼ Hourly & 3-day forecast'}
      </button>

      {/* Expanded forecast section */}
      {expanded && w.forecast.length > 0 && (
        <div style={{ padding: '12px 18px 18px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          {/* 3-day forecast */}
          <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.7, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            3-Day Forecast
          </div>
          <DailyForecast forecast={w.forecast} selectedDay={selectedDay} onSelectDay={setSelectedDay} />

          {/* Hourly for selected day */}
          {w.forecast[selectedDay] && (
            <>
              <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.7, marginTop: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {w.forecast[selectedDay].dayName} — Hourly
              </div>
              <HourlyRow hours={w.forecast[selectedDay].hourly} />
            </>
          )}
        </div>
      )}
    </div>
  )
}

// --- Main App ---

export default function WeatherApp() {
  const [cities, setCities] = useState<CityWeather[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [geoLoading, setGeoLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { sendToPlatform('ui_ready', '', {}) }, [])

  // Auto-detect location on mount:
  // 1. Check URL param (passed by parent from IP geolocation)
  // 2. Try browser geolocation
  // 3. Fall back to IP-based geolocation
  useEffect(() => {
    let cancelled = false

    async function setLocalWeather(w: CityWeather) {
      if (cancelled) return
      setCities([w])
      sendToPlatform('state_update', '', { type: 'weather_lookup', lastCity: w.city, cities: [w.city] })
      setGeoLoading(false)
    }

    async function detectLocation() {
      // 1. Check if parent passed city via URL param
      const urlCity = new URLSearchParams(window.location.search).get('city')
      if (urlCity) {
        try {
          const w = await fetchCity(urlCity)
          w.isLocal = true
          await setLocalWeather(w)
          return
        } catch {
          // Fall through
        }
      }

      // 2. Try browser geolocation
      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
          })
          if (cancelled) return
          const w = await fetchCoords(pos.coords.latitude, pos.coords.longitude)
          await setLocalWeather(w)
          return
        } catch {
          // Fall through
        }
      }

      // 3. IP geolocation fallback
      try {
        const geoRes = await fetch('https://ipwho.is/')
        if (!geoRes.ok) throw new Error()
        const geoData = await geoRes.json()
        const city = geoData.city as string
        if (!city || cancelled) throw new Error()
        const w = await fetchCity(city)
        w.isLocal = true
        await setLocalWeather(w)
      } catch {
        if (!cancelled) setGeoLoading(false)
      }
    }

    detectLocation()
    return () => { cancelled = true }
  }, [])

  // postMessage handler
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const msg = event.data
      if (!msg || msg.type !== 'tool_invoke') return
      const { correlationId, tool, params } = msg

      if (tool === 'get_weather' || tool === 'get_forecast') {
        const city = (params?.city as string)?.trim()
        if (city) {
          addCity(city)
          sendToPlatform('tool_result', correlationId, { tool, city, message: `Fetching weather for ${city}` })
          sendToPlatform('completion', correlationId, { summary: `Weather for ${city}` })
        } else {
          // No city specified — auto-detect via IP geolocation
          fetch('https://ipwho.is/')
            .then(r => r.json())
            .then(geo => fetchCity(geo.city as string))
            .then(w => {
              w.isLocal = true
              setCities(prev => {
                if (prev.some(c => c.city.toLowerCase() === w.city.toLowerCase())) return prev
                const updated = [w, ...prev]
                sendToPlatform('state_update', '', { type: 'weather_lookup', lastCity: w.city, cities: updated.map(c => c.city) })
                return updated
              })
              sendToPlatform('tool_result', correlationId, { tool, city: w.city, message: `Showing weather for ${w.city}` })
              sendToPlatform('completion', correlationId, { summary: `Weather for ${w.city}` })
            })
            .catch(() => {
              sendToPlatform('tool_result', correlationId, { tool, message: 'Showing local weather' })
              sendToPlatform('completion', correlationId, { summary: 'Local weather' })
            })
        }
      } else if (tool === 'restore_state') {
        const saved = params as Record<string, unknown>
        const cityNames = (saved.cities as string[] | undefined) || (saved.history as string[] | undefined) || (saved.lastCity ? [saved.lastCity as string] : [])
        if (cityNames.length > 0) {
          Promise.all(cityNames.map(c => fetchCity(c).catch(() => null))).then(results => {
            setCities(results.filter((r): r is CityWeather => r !== null))
          })
        }
        sendToPlatform('tool_result', correlationId, { tool: 'restore_state', message: 'Restored' })
      } else {
        sendToPlatform('error', correlationId, { message: `Unknown tool: ${tool}` })
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [cities])

  async function addCity(name: string) {
    if (cities.some(c => c.city.toLowerCase() === name.toLowerCase())) {
      setError(`${name} is already on your list`)
      setTimeout(() => setError(null), 2000)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const w = await fetchCity(name)
      setCities(prev => {
        if (prev.some(c => c.city.toLowerCase() === w.city.toLowerCase())) return prev
        const updated = [...prev, w]
        sendToPlatform('state_update', '', { type: 'weather_lookup', lastCity: w.city, cities: updated.map(c => c.city) })
        return updated
      })
      setQuery('')
    } catch {
      setError(`Could not find weather for "${name}"`)
    } finally {
      setLoading(false)
    }
  }

  function removeCity(cityName: string) {
    setCities(prev => {
      const updated = prev.filter(c => c.city !== cityName)
      sendToPlatform('state_update', '', { type: 'weather_lookup', lastCity: updated[0]?.city || '', cities: updated.map(c => c.city) })
      return updated
    })
  }

  async function refreshCity(cityName: string) {
    try {
      const w = await fetchCity(cityName)
      setCities(prev => prev.map(c => c.city === cityName ? { ...w, isLocal: c.isLocal } : c))
    } catch { /* silently fail */ }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    addCity(query.trim())
  }

  return (
    <div style={{ maxWidth: 480, width: '100%', margin: '0 auto', padding: '16px 12px', fontFamily: 'system-ui, -apple-system, sans-serif', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Weather</div>
        <div style={{ fontSize: 12, color: '#94a3b8' }}>
          {cities.length} {cities.length === 1 ? 'city' : 'cities'}
        </div>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Add a city..."
          style={{ flex: 1, padding: '10px 14px', fontSize: 14, border: '1px solid #e2e8f0', borderRadius: 10, outline: 'none', background: 'white', color: '#1e293b' }}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          style={{ padding: '10px 18px', background: loading ? '#94a3b8' : '#3b82f6', color: 'white', border: 'none', borderRadius: 10, cursor: loading ? 'default' : 'pointer', fontSize: 14, fontWeight: 600 }}
        >
          {loading ? '...' : '+ Add'}
        </button>
      </form>

      {error && (
        <div style={{ color: '#dc2626', fontSize: 13, padding: '8px 12px', background: '#fee2e2', borderRadius: 8, marginBottom: 12 }}>{error}</div>
      )}

      {geoLoading && cities.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📍</div>
          <div style={{ fontSize: 14 }}>Finding your location...</div>
        </div>
      )}

      {/* Weather cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {cities.map((w, i) => (
          <WeatherCard
            key={w.city + i}
            w={w}
            onRemove={() => removeCity(w.city)}
            onRefresh={() => refreshCity(w.city)}
          />
        ))}
      </div>

      {!geoLoading && cities.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🌤️</div>
          <div style={{ fontSize: 15, fontWeight: 500, color: '#64748b', marginBottom: 4 }}>No cities added yet</div>
          <div style={{ fontSize: 13 }}>Search for a city above to see the weather</div>
        </div>
      )}
    </div>
  )
}
