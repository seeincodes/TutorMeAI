import { useState, useEffect } from 'react'
import { playPop } from './sounds'

function sendToPlatform(type: string, correlationId: string, data: Record<string, unknown>) {
  window.parent.postMessage({ type, correlationId, data }, '*')
}

interface Track {
  id: string
  title: string
  artist: string
  duration: string
}

interface Playlist {
  id: string
  title: string
  description: string
  emoji: string
  color: string
  tracks: Track[]
}

const PLAYLISTS: Playlist[] = [
  {
    id: 'focus',
    title: 'Focus Music',
    description: 'Lo-fi beats for studying',
    emoji: '\uD83C\uDFA7',
    color: '#6366f1',
    tracks: [
      { id: 'f1', title: 'Quiet Study Beats', artist: 'Lo-Fi Lab', duration: '3:24' },
      { id: 'f2', title: 'Rainy Day Focus', artist: 'Chill Waves', duration: '4:12' },
      { id: 'f3', title: 'Deep Concentration', artist: 'Study Zone', duration: '5:01' },
      { id: 'f4', title: 'Homework Flow', artist: 'Lo-Fi Lab', duration: '3:45' },
      { id: 'f5', title: 'Calm Mind', artist: 'Ambient Dreams', duration: '4:33' },
    ],
  },
  {
    id: 'classical',
    title: 'Classical for Kids',
    description: 'Mozart, Beethoven & more',
    emoji: '\uD83C\uDFBB',
    color: '#d97706',
    tracks: [
      { id: 'c1', title: 'Eine Kleine Nachtmusik', artist: 'Mozart', duration: '5:42' },
      { id: 'c2', title: 'Fur Elise', artist: 'Beethoven', duration: '3:05' },
      { id: 'c3', title: 'The Four Seasons - Spring', artist: 'Vivaldi', duration: '3:32' },
      { id: 'c4', title: 'Swan Lake', artist: 'Tchaikovsky', duration: '4:15' },
      { id: 'c5', title: 'Clair de Lune', artist: 'Debussy', duration: '5:00' },
    ],
  },
  {
    id: 'nature',
    title: 'Nature Sounds',
    description: 'Rain, ocean & forest',
    emoji: '\uD83C\uDF3F',
    color: '#059669',
    tracks: [
      { id: 'n1', title: 'Gentle Rain', artist: 'Nature Sounds', duration: '10:00' },
      { id: 'n2', title: 'Ocean Waves', artist: 'Nature Sounds', duration: '8:30' },
      { id: 'n3', title: 'Forest Birds', artist: 'Nature Sounds', duration: '7:15' },
      { id: 'n4', title: 'Thunderstorm', artist: 'Nature Sounds', duration: '12:00' },
      { id: 'n5', title: 'River Stream', artist: 'Nature Sounds', duration: '9:45' },
    ],
  },
  {
    id: 'phonics',
    title: 'Phonics Songs',
    description: 'ABC learning songs',
    emoji: '\uD83C\uDFB6',
    color: '#e11d48',
    tracks: [
      { id: 'p1', title: 'The ABC Song', artist: 'Learning Tunes', duration: '2:15' },
      { id: 'p2', title: 'Phonics Fun A-E', artist: 'Kidz Bop', duration: '3:00' },
      { id: 'p3', title: 'Letter Sounds Rap', artist: 'Learning Tunes', duration: '2:45' },
      { id: 'p4', title: 'Vowel Song', artist: 'ABC Academy', duration: '2:30' },
      { id: 'p5', title: 'Spelling Bee Dance', artist: 'Kidz Bop', duration: '3:10' },
    ],
  },
]

type View = 'connect' | 'playlists' | 'tracks'

export default function SpotifyApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [demoMode, setDemoMode] = useState(false)
  const [view, setView] = useState<View>('connect')
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null)
  const [nowPlaying, setNowPlaying] = useState<Track | null>(null)

  useEffect(() => {
    sendToPlatform('ui_ready', '', {})

    // Check for token in URL params
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      setIsAuthenticated(true)
      setView('playlists')
    }
  }, [])

  // Listen for auth messages from parent
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const msg = event.data
      if (!msg) return

      // Handle OAuth token from parent
      if (msg.type === 'spotify_auth' && msg.token) {
        setIsAuthenticated(true)
        setView('playlists')
        return
      }

      // Handle tool invocations
      if (msg.type !== 'tool_invoke') return
      const { correlationId, tool } = msg
      if (tool === 'get_state') {
        sendToPlatform('tool_result', correlationId, {
          tool: 'get_state',
          isAuthenticated,
          demoMode,
          view,
          selectedPlaylist: selectedPlaylist?.title || null,
          nowPlaying: nowPlaying ? { title: nowPlaying.title, artist: nowPlaying.artist } : null,
        })
      } else if (tool === 'restore_state') {
        sendToPlatform('tool_result', correlationId, { tool: 'restore_state', message: 'Restored' })
      } else if (tool === 'play_playlist') {
        const playlistId = msg.args?.playlistId
        const playlist = PLAYLISTS.find(p => p.id === playlistId)
        if (playlist) {
          sendToPlatform('tool_result', correlationId, {
            tool: 'play_playlist',
            title: playlist.title,
            trackCount: playlist.tracks.length,
            tracks: playlist.tracks.map(t => t.title),
          })
        } else {
          sendToPlatform('error', correlationId, { message: 'Playlist not found' })
        }
      } else if (tool === 'get_now_playing') {
        sendToPlatform('tool_result', correlationId, {
          tool: 'get_now_playing',
          nowPlaying: nowPlaying ? { title: nowPlaying.title, artist: nowPlaying.artist, duration: nowPlaying.duration } : null,
        })
      } else {
        sendToPlatform('error', correlationId, { message: `Unknown tool: ${tool}` })
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [isAuthenticated, demoMode, view, selectedPlaylist, nowPlaying])

  const handleConnect = () => {
    playPop()
    // Request OAuth from parent platform
    sendToPlatform('state_update', '', { type: 'request_oauth', provider: 'spotify' })
  }

  const handleDemoMode = () => {
    playPop()
    setDemoMode(true)
    setView('playlists')
  }

  const handleSelectPlaylist = (playlist: Playlist) => {
    playPop()
    setSelectedPlaylist(playlist)
    setView('tracks')
  }

  const handlePlayTrack = (track: Track) => {
    playPop()
    setNowPlaying(track)
    sendToPlatform('state_update', '', {
      type: 'now_playing',
      title: track.title,
      artist: track.artist,
    })
  }

  const font = 'system-ui, -apple-system, sans-serif'

  // Connect screen
  if (view === 'connect' && !isAuthenticated && !demoMode) {
    return (
      <div style={{
        padding: '40px 24px', maxWidth: '420px', margin: '0 auto', fontFamily: font,
        textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>&#x1F3B5;</div>
        <div style={{ fontSize: '28px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
          Spotify Music
        </div>
        <div style={{ fontSize: '16px', color: '#6b7280', marginBottom: '32px', lineHeight: 1.5 }}>
          Connect your Spotify account to listen to study music!
        </div>
        <button onClick={handleConnect} style={{
          padding: '16px 32px', fontSize: '18px', fontWeight: 700, color: 'white',
          background: '#1DB954', border: 'none', borderRadius: '50px', cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(29,185,84,0.4)', transition: 'transform 0.1s',
          display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px',
        }}
          onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
          onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          Connect Spotify
        </button>
        <button onClick={handleDemoMode} style={{
          padding: '12px 24px', fontSize: '15px', fontWeight: 600, color: '#6b7280',
          background: '#f3f4f6', border: '2px solid #e5e7eb', borderRadius: '12px',
          cursor: 'pointer', transition: 'all 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#93c5fd'; e.currentTarget.style.background = '#eff6ff' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = '#f3f4f6' }}
        >
          Try Demo Mode
        </button>
      </div>
    )
  }

  // Tracks view
  if (view === 'tracks' && selectedPlaylist) {
    return (
      <div style={{ padding: '24px 16px', maxWidth: '500px', margin: '0 auto', fontFamily: font, paddingBottom: nowPlaying ? '80px' : '24px' }}>
        <button onClick={() => { playPop(); setView('playlists') }} style={{
          background: 'none', border: 'none', color: '#3b82f6', fontSize: '14px',
          cursor: 'pointer', fontWeight: 600, marginBottom: '16px', padding: 0,
        }}>
          &larr; Back to playlists
        </button>
        <div style={{
          borderRadius: '20px', background: selectedPlaylist.color, padding: '24px',
          textAlign: 'center', marginBottom: '20px', color: 'white',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>{selectedPlaylist.emoji}</div>
          <div style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>{selectedPlaylist.title}</div>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>{selectedPlaylist.description}</div>
          <div style={{ fontSize: '13px', opacity: 0.7, marginTop: '8px' }}>{selectedPlaylist.tracks.length} tracks</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {selectedPlaylist.tracks.map((track, i) => {
            const isPlaying = nowPlaying?.id === track.id
            return (
              <div key={track.id} onClick={() => handlePlayTrack(track)} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px',
                background: isPlaying ? '#eff6ff' : 'white', border: `2px solid ${isPlaying ? '#3b82f6' : '#e5e7eb'}`,
                borderRadius: '12px', cursor: 'pointer', transition: 'all 0.15s',
              }}
                onMouseEnter={e => { if (!isPlaying) { e.currentTarget.style.background = '#f9fafb' } }}
                onMouseLeave={e => { if (!isPlaying) { e.currentTarget.style.background = 'white' } }}
              >
                <span style={{ fontSize: '14px', color: '#9ca3af', width: '20px', textAlign: 'center', fontWeight: 600 }}>
                  {isPlaying ? '\u25B6' : i + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: isPlaying ? 700 : 600, color: isPlaying ? '#2563eb' : '#111827' }}>
                    {track.title}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>{track.artist}</div>
                </div>
                <span style={{ fontSize: '13px', color: '#9ca3af' }}>{track.duration}</span>
              </div>
            )
          })}
        </div>

        {/* Now Playing bar */}
        {nowPlaying && (
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 20px',
            background: '#1e293b', color: 'white', display: 'flex', alignItems: 'center', gap: '12px',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
          }}>
            <span style={{ fontSize: '20px' }}>\u25B6\uFE0F</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 700 }}>{nowPlaying.title}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>{nowPlaying.artist}</div>
            </div>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>{nowPlaying.duration}</span>
          </div>
        )}
      </div>
    )
  }

  // Playlists view
  return (
    <div style={{ padding: '24px 16px', maxWidth: '500px', margin: '0 auto', fontFamily: font, textAlign: 'center', paddingBottom: nowPlaying ? '80px' : '24px' }}>
      <div style={{ fontSize: '48px', marginBottom: '4px' }}>&#x1F3B5;</div>
      <div style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>Spotify Music</div>
      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
        {demoMode ? 'Demo Mode' : 'Connected'}
      </div>
      {demoMode && (
        <div style={{
          padding: '8px 16px', background: '#fef3c7', color: '#92400e', borderRadius: '8px',
          fontSize: '12px', marginBottom: '16px', display: 'inline-block',
        }}>
          Demo mode: showing sample playlists
        </div>
      )}
      <div style={{ fontSize: '16px', fontWeight: 600, color: '#374151', marginBottom: '12px', marginTop: '8px' }}>
        Study Playlists
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {PLAYLISTS.map(playlist => (
          <div key={playlist.id} onClick={() => handleSelectPlaylist(playlist)} style={{
            display: 'flex', alignItems: 'center', gap: '16px', padding: '18px',
            background: 'white', border: '2px solid #e5e7eb', borderRadius: '16px',
            cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#93c5fd'; e.currentTarget.style.background = '#eff6ff' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = 'white' }}
          >
            <div style={{
              width: '56px', height: '56px', borderRadius: '12px', background: playlist.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px',
              flexShrink: 0,
            }}>
              {playlist.emoji}
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '2px' }}>
                {playlist.title}
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                {playlist.description} &middot; {playlist.tracks.length} tracks
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Now Playing bar */}
      {nowPlaying && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 20px',
          background: '#1e293b', color: 'white', display: 'flex', alignItems: 'center', gap: '12px',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
        }}>
          <span style={{ fontSize: '20px' }}>\u25B6\uFE0F</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: 700 }}>{nowPlaying.title}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{nowPlaying.artist}</div>
          </div>
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>{nowPlaying.duration}</span>
        </div>
      )}
    </div>
  )
}
