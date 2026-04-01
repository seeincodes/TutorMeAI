import { useState, useEffect } from 'react'

function sendToPlatform(type: string, correlationId: string, data: Record<string, unknown>) {
  window.parent.postMessage({ type, correlationId, data }, '*')
}

interface WeatherData {
  city: string
  temperature?: number
  description?: string
  humidity?: number
  windSpeed?: number
}

export default function WeatherApp() {
  const [weather, setWeather] = useState<WeatherData | null>(null)

  useEffect(() => { sendToPlatform('ui_ready', '', {}) }, [])

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const msg = event.data
      if (!msg || msg.type !== 'tool_invoke') return
      const { correlationId, tool, params } = msg

      if (tool === 'get_weather') {
        const city = params?.city as string
        if (!city) {
          sendToPlatform('error', correlationId, { message: 'No city provided' })
          return
        }
        // Weather API call goes through backend proxy (iframe can't make external requests)
        // Send tool_result with the request info for the backend to fulfill
        setWeather({ city })
        sendToPlatform('tool_result', correlationId, {
          tool: 'get_weather',
          city,
          request: { endpoint: `/api/weather?city=${encodeURIComponent(city)}` },
          message: `Fetching weather for ${city}...`,
        })
        sendToPlatform('completion', correlationId, { summary: `Weather for ${city}` })
      } else {
        sendToPlatform('error', correlationId, { message: `Unknown tool: ${tool}` })
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  return (
    <div style={{ textAlign: 'center', padding: '24px' }}>
      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>Weather</div>
      {weather ? (
        <div>
          <div style={{ fontSize: '18px', fontWeight: 600, color: '#374151' }}>{weather.city}</div>
          {weather.temperature !== undefined && (
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#2563eb', margin: '8px 0' }}>
              {weather.temperature}°F
            </div>
          )}
          {weather.description && (
            <div style={{ fontSize: '14px', color: '#6b7280' }}>{weather.description}</div>
          )}
        </div>
      ) : (
        <div style={{ fontSize: '12px', color: '#9ca3af' }}>Ask the chatbot about the weather</div>
      )}
    </div>
  )
}
