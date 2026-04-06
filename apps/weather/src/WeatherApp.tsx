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

// WMO weather code to description + icon
function wmoToWeather(code: number): { description: string; icon: string } {
  if (code === 0) return { description: 'Clear sky', icon: '☀️' }
  if (code === 1) return { description: 'Mainly clear', icon: '🌤️' }
  if (code === 2) return { description: 'Partly cloudy', icon: '⛅' }
  if (code === 3) return { description: 'Overcast', icon: '☁️' }
  if (code === 45 || code === 48) return { description: 'Fog', icon: '🌫️' }
  if (code === 51 || code === 53 || code === 55) return { description: 'Drizzle', icon: '🌧️' }
  if (code === 56 || code === 57) return { description: 'Freezing drizzle', icon: '🌧️' }
  if (code >= 61 && code <= 65) return { description: 'Rain', icon: '🌧️' }
  if (code === 66 || code === 67) return { description: 'Freezing rain', icon: '🌧️' }
  if (code >= 71 && code <= 77) return { description: 'Snow', icon: '❄️' }
  if (code >= 80 && code <= 82) return { description: 'Rain showers', icon: '🌦️' }
  if (code === 85 || code === 86) return { description: 'Snow showers', icon: '🌨️' }
  if (code === 95) return { description: 'Thunderstorm', icon: '⛈️' }
  if (code === 96 || code === 99) return { description: 'Thunderstorm with hail', icon: '⛈️' }
  return { description: 'Unknown', icon: '🌡️' }
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

function formatTime(isoTime: string): string {
  const h = new Date(isoTime).getHours()
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

const OPEN_METEO_PARAMS = 'current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&hourly=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,precipitation_probability&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=3'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseOpenMeteo(data: any, cityName: string, isLocal?: boolean): CityWeather {
  const current = data.current
  const curWeather = wmoToWeather(current.weather_code)

  const daily = data.daily
  const hourly = data.hourly
  const forecast: DailyData[] = daily.time.map((date: string, i: number) => {
    const dayWeather = wmoToWeather(daily.weather_code[i])
    // Get hourly data for this day (24 entries per day)
    const startIdx = i * 24
    const dayHourly: HourlyData[] = []
    for (let h = 0; h < 24; h++) {
      const idx = startIdx + h
      if (idx >= hourly.time.length) break
      const hWeather = wmoToWeather(hourly.weather_code[idx])
      dayHourly.push({
        time: hourly.time[idx],
        tempF: Math.round(hourly.temperature_2m[idx]),
        description: hWeather.description,
        icon: hWeather.icon,
        chanceOfRain: hourly.precipitation_probability[idx] || 0,
        humidity: hourly.relative_humidity_2m[idx] || 0,
        wind: Math.round(hourly.wind_speed_10m[idx] || 0),
        feelsLike: Math.round(hourly.temperature_2m[idx]),
      })
    }
    return {
      date,
      dayName: getDayName(date, i),
      high: Math.round(daily.temperature_2m_max[i]),
      low: Math.round(daily.temperature_2m_min[i]),
      description: dayWeather.description,
      icon: dayWeather.icon,
      hourly: dayHourly,
    }
  })

  return {
    city: cityName,
    temp: Math.round(current.temperature_2m),
    description: curWeather.description,
    humidity: current.relative_humidity_2m,
    wind: Math.round(current.wind_speed_10m),
    feelsLike: Math.round(current.apparent_temperature),
    high: Math.round(daily.temperature_2m_max[0]),
    low: Math.round(daily.temperature_2m_min[0]),
    icon: curWeather.icon,
    isLocal,
    forecast,
  }
}

interface GeoResult {
  name: string
  lat: number
  lon: number
  country: string
  admin1?: string // state/region
}

async function geocodeCity(city: string): Promise<GeoResult> {
  const results = await geocodeSearch(city)
  if (!results.length) throw new Error('City not found')
  return results[0]
}

async function geocodeSearch(query: string): Promise<GeoResult[]> {
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=en`)
  if (!res.ok) return []
  const data = await res.json()
  if (!data.results?.length) return []
  return data.results.map((r: Record<string, unknown>) => ({
    name: r.name as string,
    lat: r.latitude as number,
    lon: r.longitude as number,
    country: (r.country_code as string) || '',
    admin1: (r.admin1 as string) || undefined,
  }))
}

function formatGeoLabel(g: GeoResult): string {
  const parts = [g.name]
  if (g.admin1) parts.push(g.admin1)
  if (g.country) parts.push(g.country)
  return parts.join(', ')
}

async function fetchCityByGeo(geo: GeoResult): Promise<CityWeather> {
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${geo.lat}&longitude=${geo.lon}&${OPEN_METEO_PARAMS}`)
  if (!res.ok) throw new Error('Weather data unavailable')
  const label = geo.admin1 ? `${geo.name}, ${geo.admin1}` : geo.name
  return parseOpenMeteo(await res.json(), label)
}

async function fetchCity(city: string): Promise<CityWeather> {
  const geo = await geocodeCity(city)
  return fetchCityByGeo(geo)
}

async function fetchCoords(lat: number, lon: number, cityName?: string): Promise<CityWeather> {
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&${OPEN_METEO_PARAMS}`)
  if (!res.ok) throw new Error('Location not found')
  return parseOpenMeteo(await res.json(), cityName || 'Your Location', true)
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
  const [suggestions, setSuggestions] = useState<GeoResult[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightIdx, setHighlightIdx] = useState(-1)
  const [loading, setLoading] = useState(false)
  const [geoLoading, setGeoLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  // Debounced geocode search for autocomplete
  function handleQueryChange(value: string) {
    setQuery(value)
    setHighlightIdx(-1)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.trim().length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      const results = await geocodeSearch(value.trim())
      setSuggestions(results)
      setShowSuggestions(results.length > 0)
    }, 300)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function selectSuggestion(geo: GeoResult) {
    setShowSuggestions(false)
    setSuggestions([])
    setQuery('')
    setHighlightIdx(-1)

    const label = geo.admin1 ? `${geo.name}, ${geo.admin1}` : geo.name
    if (cities.some(c => c.city.toLowerCase() === label.toLowerCase())) {
      setError(`${label} is already on your list`)
      setTimeout(() => setError(null), 2000)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const w = await fetchCityByGeo(geo)
      setCities(prev => {
        if (prev.some(c => c.city.toLowerCase() === w.city.toLowerCase())) return prev
        const updated = [...prev, w]
        sendToPlatform('state_update', '', { type: 'weather_lookup', lastCity: w.city, cities: updated.map(c => c.city) })
        return updated
      })
    } catch {
      setError(`Could not fetch weather for "${label}"`)
    } finally {
      setLoading(false)
    }
  }

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

      {/* Search bar with autocomplete */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
            onKeyDown={e => {
              if (!showSuggestions || suggestions.length === 0) return
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setHighlightIdx(prev => Math.min(prev + 1, suggestions.length - 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setHighlightIdx(prev => Math.max(prev - 1, 0))
              } else if (e.key === 'Enter' && highlightIdx >= 0) {
                e.preventDefault()
                selectSuggestion(suggestions[highlightIdx])
              } else if (e.key === 'Escape') {
                setShowSuggestions(false)
              }
            }}
            placeholder="Search for a city..."
            autoComplete="off"
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

        {/* Autocomplete dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={dropdownRef}
            style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
              marginTop: 4, background: 'white', border: '1px solid #e2e8f0',
              borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              maxHeight: 280, overflowY: 'auto',
            }}
          >
            {suggestions.map((geo, i) => (
              <button
                key={`${geo.lat}-${geo.lon}`}
                onClick={() => selectSuggestion(geo)}
                onMouseEnter={() => setHighlightIdx(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '10px 14px', border: 'none',
                  background: i === highlightIdx ? '#f1f5f9' : 'transparent',
                  cursor: 'pointer', textAlign: 'left', fontSize: 14, color: '#1e293b',
                  borderBottom: i < suggestions.length - 1 ? '1px solid #f1f5f9' : 'none',
                }}
              >
                <span style={{ fontSize: 16 }}>📍</span>
                <div>
                  <div style={{ fontWeight: 500 }}>{geo.name}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    {[geo.admin1, geo.country].filter(Boolean).join(', ')}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

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
