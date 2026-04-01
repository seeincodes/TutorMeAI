import { useState, useEffect } from 'react'

function sendToPlatform(type: string, correlationId: string, data: Record<string, unknown>) {
  window.parent.postMessage({ type, correlationId, data }, '*')
}

interface Playlist {
  name: string
  id?: string
  tracks?: string[]
}

export default function SpotifyApp() {
  const [connected, setConnected] = useState(false)
  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => { sendToPlatform('ui_ready', '', {}) }, [])

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const msg = event.data
      if (!msg || msg.type !== 'tool_invoke') return
      const { correlationId, tool, params } = msg

      switch (tool) {
        case 'create_playlist': {
          const name = (params?.name as string) || 'My Study Playlist'
          const description = (params?.description as string) || 'Created by ChatBridge'
          // Actual Spotify API call handled by backend with stored OAuth tokens
          sendToPlatform('tool_result', correlationId, {
            tool: 'create_playlist',
            name,
            description,
            request: {
              endpoint: '/api/spotify/playlists',
              method: 'POST',
              body: { name, description },
            },
            message: `Creating playlist "${name}"...`,
          })
          setPlaylist({ name })
          setMessage(`Playlist "${name}" created!`)
          sendToPlatform('completion', correlationId, { summary: `Created playlist "${name}"` })
          break
        }

        case 'search_tracks': {
          const query = (params?.query as string) || ''
          sendToPlatform('tool_result', correlationId, {
            tool: 'search_tracks',
            query,
            request: {
              endpoint: `/api/spotify/search?q=${encodeURIComponent(query)}`,
            },
            message: `Searching for "${query}"...`,
          })
          setMessage(`Searched for "${query}"`)
          sendToPlatform('completion', correlationId, { summary: `Search: "${query}"` })
          break
        }

        case 'get_playlists': {
          sendToPlatform('tool_result', correlationId, {
            tool: 'get_playlists',
            request: { endpoint: '/api/spotify/playlists' },
            message: 'Fetching your playlists...',
          })
          setMessage('Fetched playlists')
          sendToPlatform('completion', correlationId, { summary: 'Playlists retrieved' })
          break
        }

        default:
          sendToPlatform('error', correlationId, { message: `Unknown tool: ${tool}` })
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  return (
    <div style={{ textAlign: 'center', padding: '24px', maxWidth: '400px' }}>
      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>Spotify</div>
      {message && (
        <div style={{ fontSize: '14px', color: '#374151', marginBottom: '12px' }}>{message}</div>
      )}
      {playlist && (
        <div style={{
          background: '#1DB954', borderRadius: '8px', padding: '16px', color: 'white',
        }}>
          <div style={{ fontSize: '16px', fontWeight: 600 }}>{playlist.name}</div>
          <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>Spotify Playlist</div>
        </div>
      )}
      {!playlist && !message && (
        <div style={{ fontSize: '12px', color: '#9ca3af' }}>
          Ask the chatbot to create a playlist or search for music
        </div>
      )}
    </div>
  )
}
