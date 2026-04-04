import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { api, type AppInfo, type Conversation, type Message } from '@/lib/api'
import AppIframe, { type AppIframeHandle } from '@/components/AppIframe'
import ChatMessage from '@/components/ChatMessage'
import Sidebar from '@/components/Sidebar'
import { APP_DISPLAY, sortApps } from '@/lib/apps'
import { useSounds } from '@/lib/useSounds'

interface AppState {
  appId: string
  iframeUrl: string
  state?: Record<string, unknown>
}

export default function ChatPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [activeApp, setActiveApp] = useState<AppState | null>(null)
  const [pendingRestore, setPendingRestore] = useState<Record<string, unknown> | null>(null)
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false)
  const [oauthPrompt, setOauthPrompt] = useState<{ appId: string; message: string } | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [availableApps, setAvailableApps] = useState<AppInfo[]>([])
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const appIframeRef = useRef<AppIframeHandle>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const userCityRef = useRef<string | null>(null)
  const { muted, toggleMute, playMessageSent, playMessageReceived, playAppLaunch } = useSounds()

  // Dark mode toggle — sync with <html> class and localStorage
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  // Detect user's city once via IP geolocation (used for weather app)
  useEffect(() => {
    fetch('https://ipwho.is/')
      .then(r => r.json())
      .then(data => { if (data.city) userCityRef.current = data.city })
      .catch(() => {})
  }, [])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (chatDrawerOpen) setChatDrawerOpen(false)
        else if (menuOpen) setMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [chatDrawerOpen, menuOpen])

  useEffect(() => { scrollToBottom() }, [messages, streamingContent, scrollToBottom])

  useEffect(() => {
    function handleOAuthComplete(event: MessageEvent) {
      if (event.data?.type === 'oauth_complete') {
        setOauthPrompt(null)
      }
    }
    window.addEventListener('message', handleOAuthComplete)
    return () => window.removeEventListener('message', handleOAuthComplete)
  }, [])

  async function handleOAuthConnect(appId: string) {
    try {
      const resp = await fetch(`/api/oauth/${appId}/authorize`, { credentials: 'include' })
      const data = await resp.json()
      if (data.authorize_url) {
        window.open(data.authorize_url, 'oauth_popup', 'width=500,height=600,popup=yes')
      }
    } catch {
      // fallback
    }
  }

  useEffect(() => {
    api.listConversations().then(setConversations).catch(() => {})
    api.listApps().then(setAvailableApps).catch(() => {})
  }, [])

  useEffect(() => {
    if (activeConversation) {
      api.getMessages(activeConversation).then(msgs => {
        setMessages(msgs)
        const appStateMsg = [...msgs].reverse().find(
          m => m.role === 'system' && m.tool_name === 'app_state'
        )
        if (appStateMsg?.content) {
          try {
            const saved = JSON.parse(appStateMsg.content) as { appId: string; state: Record<string, unknown> }
            setActiveApp({ appId: saved.appId, iframeUrl: `/apps/${saved.appId}/index.html`, state: saved.state })
            setPendingRestore(saved.state)
          } catch { /* ignore */ }
        } else {
          // Only clear activeApp if it wasn't just set by handleAppLaunch
          // (new conversations have no messages yet, but activeApp may already be set)
          setActiveApp(prev => {
            if (prev && msgs.length === 0) return prev  // keep the app that was just launched
            return null
          })
          setPendingRestore(null)
        }
      }).catch(() => {})
    } else {
      setMessages([])
      setActiveApp(null)
      setPendingRestore(null)
    }
  }, [activeConversation])

  async function handleNewConversation() {
    const conv = await api.createConversation()
    setConversations(prev => [conv, ...prev])
    setActiveConversation(conv.id)
    setActiveApp(null)
    setMenuOpen(false)
  }

  function buildAppUrl(appId: string) {
    const levels = user?.allowed_levels?.join(',') || ''
    const grade = user?.grade || ''
    const params = new URLSearchParams()
    if (levels) params.set('levels', levels)
    if (grade) params.set('grade', String(grade))
    if (appId === 'weather' && userCityRef.current) {
      params.set('city', userCityRef.current)
    }
    const qs = params.toString()
    return `/apps/${appId}/index.html${qs ? `?${qs}` : ''}`
  }

  // Apps that have their own setup UI (e.g. difficulty picker) should open
  // without sending an AI message first. The AI message is deferred until the
  // user completes setup, triggered by the app's state_update event.
  const DEFERRED_PROMPT_APPS = new Set(['chess', 'flashcards'])

  // Deterministic welcome messages — instant, no AI call
  const APP_WELCOME: Record<string, string> = {
    calculator: "Welcome to Math Helper! Pick a grade level and lesson to get started. I can help explain any problem — just ask!",
    dictionary: "Welcome to Reading & Vocabulary! Choose a passage to read, then test your comprehension. Save words you want to remember and I'll quiz you on them!",
    weather: "Here's the weather dashboard! You can check the forecast for any city. Ask me about weather patterns or what to wear today!",
    'life-skills': "Welcome to Level Up Life! Pick a scenario to practice real-world decision making. I'll guide you through each choice and explain the outcomes.",
  }

  async function handleAppLaunch(appId: string) {
    const display = APP_DISPLAY[appId]
    if (!display) return
    playAppLaunch()
    const conv = await api.createConversation(display.label)
    setConversations(prev => [conv, ...prev])
    setActiveConversation(conv.id)

    // All apps open immediately with the iframe
    setActiveApp({ appId, iframeUrl: buildAppUrl(appId) })

    // Tell the backend which app is active so it routes tools correctly
    fetch(`/api/conversations/${conv.id}/app-state`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appId }),
    }).catch(() => {})

    if (DEFERRED_PROMPT_APPS.has(appId)) {
      // Chess/flashcards: wait for user to complete setup before showing welcome
      setMessages([])
      return
    }

    // All other apps: show deterministic welcome message instantly
    const welcome = APP_WELCOME[appId] || `${display.label} is ready! Ask me anything or start using the app.`
    setMessages([{
      id: crypto.randomUUID(), role: 'assistant', content: welcome,
      tool_call_id: null, tool_name: null, created_at: new Date().toISOString(),
    }])
    playMessageReceived()
    return
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || streaming) return

    let conversationId = activeConversation
    if (!conversationId) {
      const conv = await api.createConversation(input.slice(0, 50))
      setConversations(prev => [conv, ...prev])
      conversationId = conv.id
      setActiveConversation(conv.id)
    }

    const userMessage: Message = {
      id: crypto.randomUUID(), role: 'user', content: input,
      tool_call_id: null, tool_name: null, created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
    setStreaming(true)
    setStreamingContent('')
    playMessageSent()

    // Auto-open chat drawer when sending in app mode
    if (activeApp) setChatDrawerOpen(true)

    await api.sendMessage(
      conversationId,
      input,
      (token) => setStreamingContent(prev => prev + token),
      (messageId) => {
        setStreamingContent(prev => {
          const assistantMessage: Message = {
            id: messageId, role: 'assistant', content: prev,
            tool_call_id: null, tool_name: null, created_at: new Date().toISOString(),
          }
          setMessages(msgs => [...msgs, assistantMessage])
          return ''
        })
        setStreaming(false)
        playMessageReceived()
      },
      (error) => {
        setStreamingContent('')
        setStreaming(false)
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(), role: 'assistant', content: `Error: ${error}`,
          tool_call_id: null, tool_name: null, created_at: new Date().toISOString(),
        }])
      },
      (appId) => {
        setActiveApp({ appId, iframeUrl: buildAppUrl(appId) })
      },
      async (appId, tool, params, correlationId) => {
        if (!appIframeRef.current) {
          setActiveApp({ appId, iframeUrl: buildAppUrl(appId) })
          await new Promise(r => setTimeout(r, 2000))
        }
        try {
          let result: Record<string, unknown> = { status: 'no_iframe' }
          if (appIframeRef.current) {
            result = await appIframeRef.current.invokeTool(tool, params)
          }
          if (activeConversation) await api.submitToolResult(activeConversation, correlationId, result)
        } catch (err) {
          if (activeConversation) await api.submitToolResult(activeConversation, correlationId, {
            error: err instanceof Error ? err.message : 'Tool execution failed',
          })
        }
      },
      (appId: string, message: string) => {
        setOauthPrompt({ appId, message })
      },
    )
  }

  const visibleMessages = messages.filter(m => m.role !== 'system')

  // ============================================================
  // LAYOUT MODE 1: No active app — classic chat layout
  // ============================================================
  if (!activeApp) {
    return (
      <div className="flex h-screen bg-chatbox-background-secondary">
        <Sidebar
          conversations={conversations}
          activeConversation={activeConversation}
          onSelectConversation={setActiveConversation}
          onNewConversation={handleNewConversation}
          onToggleStar={async (id, starred) => {
            await api.updateConversation(id, { starred })
            setConversations(prev => prev.map(c => c.id === id ? { ...c, starred } : c))
          }}
          onRename={async (id, title) => {
            await api.updateConversation(id, { title })
            setConversations(prev => prev.map(c => c.id === id ? { ...c, title } : c))
          }}
          onCopy={async (id) => {
            const copy = await api.copyConversation(id)
            setConversations(prev => [copy, ...prev])
            setActiveConversation(copy.id)
          }}
          onDelete={async (id) => {
            await api.deleteConversation(id)
            setConversations(prev => prev.filter(c => c.id !== id))
            if (activeConversation === id) {
              setActiveConversation(null)
              setMessages([])
              setActiveApp(null)
            }
          }}
          onAppLaunch={handleAppLaunch}
          availableApps={availableApps}
          username={user?.display_name || user?.username || ''}
          role={user?.role}
          onLogout={logout}
          onNavigate={(path) => navigate(path)}
          onToggleDarkMode={() => setDarkMode(d => !d)}
          darkMode={darkMode}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(c => !c)}
        />

        {/* Expand button when sidebar is collapsed */}
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="absolute left-2 top-3 z-20 rounded p-1.5 text-chatbox-tint-tertiary hover:bg-chatbox-background-secondary"
            aria-label="Expand sidebar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 5l7 7-7 7M6 5l7 7-7 7"/></svg>
          </button>
        )}

        {/* Full chat */}
        <main className="flex flex-1 flex-col bg-chatbox-background-primary">
          <div className="flex-1 overflow-y-auto px-4 py-6">
            {visibleMessages.length === 0 && !streaming ? (
              /* ---- Welcome screen ---- */
              <div className="mx-auto flex h-full max-w-xl flex-col items-center justify-center px-4">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-chatbox-background-brand-primary">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <h2 className="mb-1 text-2xl font-bold text-chatbox-tint-primary">
                  Hi{user?.display_name ? `, ${user.display_name}` : ''}!
                </h2>
                <p className="mb-6 text-center text-sm text-chatbox-tint-tertiary">
                  {user?.role === 'student'
                    ? 'What would you like to do today? Pick an app or just start chatting.'
                    : <>Start a conversation or head to the <button onClick={() => navigate('/dashboard')} className="text-chatbox-tint-brand underline hover:text-chatbox-tint-primary transition-colors">dashboard</button>.</>}
                </p>
                {user?.role === 'student' && availableApps.length > 0 && (
                  <div className="grid w-full grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {sortApps(availableApps).map(app => {
                      const display = APP_DISPLAY[app.app_id]
                      if (!display) return null
                      return (
                        <button
                          key={app.app_id}
                          onClick={() => handleAppLaunch(app.app_id)}
                          disabled={streaming}
                          className="group flex flex-col items-center gap-2 rounded-xl border border-chatbox-border-primary bg-chatbox-background-primary px-3 py-4 text-xs font-medium text-chatbox-tint-secondary shadow-sm transition-all hover:border-chatbox-border-brand hover:bg-chatbox-background-brand-secondary hover:text-chatbox-tint-brand hover:shadow-md disabled:opacity-50"
                        >
                          <span className="flex h-8 w-8 items-center justify-center text-2xl leading-none transition-transform group-hover:scale-110">{display.emoji}</span>
                          <span>{display.label}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* ---- Messages ---- */
              <div className="mx-auto max-w-2xl space-y-4">
                {visibleMessages.map(msg => (
                  <div key={msg.id} className={`animate-message-in flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar */}
                    {msg.role === 'user' ? (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-chatbox-background-brand-primary">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </div>
                    ) : (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-chatbox-background-success-primary">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      </div>
                    )}
                    {/* Bubble */}
                    <div className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm ${msg.role === 'user' ? 'bg-chatbox-background-brand-primary text-chatbox-tint-white' : 'bg-chatbox-background-secondary text-chatbox-tint-primary'}`}>
                      <ChatMessage content={msg.content || ''} role={msg.role} onAppLaunch={handleAppLaunch} disabled={streaming} />
                    </div>
                  </div>
                ))}
                {/* Typing indicator */}
                {streaming && !streamingContent && (
                  <div className="animate-message-in flex items-start gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-chatbox-background-success-primary">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    </div>
                    <div className="rounded-lg bg-chatbox-background-secondary px-4 py-3 text-chatbox-tint-tertiary">
                      <span className="flex items-center gap-1.5">
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                      </span>
                    </div>
                  </div>
                )}
                {streaming && streamingContent && (
                  <div className="animate-message-in flex items-start gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-chatbox-background-success-primary">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    </div>
                    <div className="max-w-[80%] rounded-lg bg-chatbox-background-secondary px-4 py-2.5 text-sm text-chatbox-tint-primary" aria-live="polite">
                      <ChatMessage content={streamingContent} role="assistant" onAppLaunch={handleAppLaunch} disabled={streaming} />
                    </div>
                  </div>
                )}
                {oauthPrompt && (
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-chatbox-background-brand-primary">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3"/></svg>
                    </div>
                    <div className="max-w-[80%] rounded-lg border border-chatbox-border-brand bg-chatbox-background-brand-secondary px-4 py-3 text-sm">
                      <p className="mb-2 text-chatbox-tint-primary">{oauthPrompt.message}</p>
                      <button
                        onClick={() => handleOAuthConnect(oauthPrompt.appId)}
                        className="rounded-md bg-chatbox-background-brand-primary px-3 py-1.5 text-xs font-medium text-chatbox-tint-white hover:bg-chatbox-background-brand-primary-hover transition-colors"
                      >
                        Connect {oauthPrompt.appId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </button>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input bar */}
          <div className="bg-chatbox-background-primary px-4 py-3">
            <form onSubmit={handleSend} className="mx-auto flex max-w-2xl items-end gap-2">
              <button type="button" onClick={toggleMute} title={muted ? 'Unmute sounds' : 'Mute sounds'}
                className="rounded-lg p-2.5 text-chatbox-tint-tertiary hover:bg-chatbox-background-secondary transition-colors" aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}>
                {muted ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                )}
              </button>
              <label htmlFor="chat-input" className="sr-only">Message</label>
              <textarea
                id="chat-input"
                ref={inputRef}
                value={input}
                onChange={e => {
                  setInput(e.target.value)
                  const el = e.target
                  el.style.height = 'auto'
                  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
                }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e) } }}
                placeholder="Type a message..."
                disabled={streaming}
                rows={1}
                className="flex-1 resize-none rounded-lg border border-chatbox-border-primary bg-chatbox-background-secondary px-3 py-2.5 text-sm text-chatbox-tint-primary placeholder:text-chatbox-tint-placeholder focus:border-chatbox-border-brand focus:bg-chatbox-background-primary focus:outline-none focus:ring-1 focus:ring-chatbox-border-brand disabled:opacity-50"
                style={{ maxHeight: '120px' }}
              />
              <button type="submit" disabled={streaming || !input.trim()}
                className="rounded-lg bg-chatbox-background-brand-primary p-2.5 text-chatbox-tint-white hover:bg-chatbox-background-brand-primary-hover disabled:opacity-50 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
              </button>
            </form>
          </div>
        </main>
      </div>
    )
  }

  // ============================================================
  // LAYOUT MODE 2: App active
  //   Desktop (md+): side-by-side — app 65% left, chat 35% right
  //   Mobile: app fullscreen with bottom drawer + FAB
  // ============================================================

  // Shared iframe element (used in both desktop and mobile layouts)
  const appIframeElement = (
    <AppIframe
      key={activeApp.appId}
      ref={appIframeRef}
      appId={activeApp.appId}
      iframeUrl={activeApp.iframeUrl}
      onError={(err) => {
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(), role: 'assistant',
          content: `The ${APP_DISPLAY[activeApp.appId]?.label || activeApp.appId} app encountered an error: ${err}. You can try again or ask me something else.`,
          tool_call_id: null, tool_name: null, created_at: new Date().toISOString(),
        }])
        setChatDrawerOpen(true)
      }}
      onCompletion={async (data) => {
        let verified = false
        try {
          if (appIframeRef.current) {
            const state = await appIframeRef.current.invokeTool('get_state', {})
            const isComplete = state.completed === true
              || state.game_over === true
              || state.status === 'completed'
              || state.status === 'finished'
              || state.is_checkmate === true
              || state.all_answered === true
            if (isComplete) {
              verified = true
            } else {
              console.warn(`[ChatPage] ${activeApp.appId}: completion signal contradicted by state poll, ignoring`)
            }
          }
        } catch {
          verified = true
        }
        if (verified) {
          setMessages(prev => [...prev, {
            id: crypto.randomUUID(), role: 'assistant',
            content: `The ${APP_DISPLAY[activeApp.appId]?.label || activeApp.appId} session has finished. ${data.summary || ''}`,
            tool_call_id: null, tool_name: null, created_at: new Date().toISOString(),
          }])
        }
      }}
      onReady={() => {
        if (pendingRestore && appIframeRef.current) {
          appIframeRef.current.invokeTool('restore_state', pendingRestore).catch(() => {})
          setPendingRestore(null)
        }
      }}
      onStateUpdate={(data) => {
        if (data.type === 'inappropriate_search') {
          fetch('/api/teacher/flags', {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              app_id: activeApp.appId, word: data.word,
              reason: data.reason || 'blocked_word',
              conversation_id: activeConversation, timestamp: data.timestamp,
            }),
          }).catch(() => {})
          return
        }
        // Deferred welcome: when a setup-first app signals it's ready
        // (e.g. user picked chess difficulty), show a deterministic welcome
        // message instantly — no AI call needed.
        if (data.type === 'game_start' && DEFERRED_PROMPT_APPS.has(activeApp.appId) && visibleMessages.length === 0) {
          const difficulty = (data.difficulty as string) || 'explorer'
          const WELCOME_MESSAGES: Record<string, Record<string, string>> = {
            chess: {
              explorer:   "Game on! You're playing white at Explorer level. Make your first move on the board, or ask me for help anytime!",
              apprentice: "Game on! You're playing white at Apprentice level. Make your first move, or ask me for a suggestion!",
              challenger: "Game on! You're playing white at Challenger level. Good luck — I'm here if you need strategy tips!",
              expert:     "Game on! You're playing white at Expert level. This will be tough — ask me to analyze any position!",
            },
          }
          const welcomeText = WELCOME_MESSAGES[activeApp.appId]?.[difficulty]
            || `Let's go! Make your first move, or ask me for help.`
          setMessages([{
            id: crypto.randomUUID(), role: 'assistant', content: welcomeText,
            tool_call_id: null, tool_name: null, created_at: new Date().toISOString(),
          }])
          playMessageReceived()
          return
        }
        if (activeConversation) {
          fetch(`/api/conversations/${activeConversation}/app-state`, {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ appId: activeApp.appId, state: data }),
          }).catch(() => {})
        }
      }}
    />
  )

  // Shared chat message list (used in both desktop panel and mobile drawer)
  const chatMessageList = (
    <div className="space-y-3">
      {visibleMessages.map(msg => (
        <div key={msg.id} className={`animate-message-in flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
          {msg.role !== 'user' && (
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-chatbox-background-success-primary">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
          )}
          <div className={`max-w-[85%] rounded-lg px-3 py-1.5 text-sm ${msg.role === 'user' ? 'bg-chatbox-background-brand-primary text-chatbox-tint-white' : 'bg-chatbox-background-secondary text-chatbox-tint-primary'}`}>
            <ChatMessage content={msg.content || ''} role={msg.role} onAppLaunch={handleAppLaunch} disabled={streaming} />
          </div>
        </div>
      ))}
      {/* Typing indicator — shows while AI is thinking before any tokens arrive */}
      {streaming && !streamingContent && (
        <div className="animate-message-in flex items-start gap-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-chatbox-background-success-primary">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <div className="rounded-lg bg-chatbox-background-secondary px-4 py-2.5 text-chatbox-tint-tertiary">
            <span className="flex items-center gap-1.5">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </span>
          </div>
        </div>
      )}
      {streaming && streamingContent && (
        <div className="animate-message-in flex items-start gap-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-chatbox-background-success-primary">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <div className="max-w-[85%] rounded-lg bg-chatbox-background-secondary px-3 py-1.5 text-sm text-chatbox-tint-primary" aria-live="polite">
            <ChatMessage content={streamingContent} role="assistant" onAppLaunch={handleAppLaunch} disabled={streaming} />
          </div>
        </div>
      )}
      {oauthPrompt && (
        <div className="flex items-start gap-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-chatbox-background-brand-primary">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3"/></svg>
          </div>
          <div className="max-w-[85%] rounded-lg border border-chatbox-border-brand bg-chatbox-background-brand-secondary px-3 py-2 text-sm">
            <p className="mb-2 text-chatbox-tint-primary">{oauthPrompt.message}</p>
            <button
              onClick={() => handleOAuthConnect(oauthPrompt.appId)}
              className="rounded-md bg-chatbox-background-brand-primary px-3 py-1.5 text-xs font-medium text-chatbox-tint-white hover:bg-chatbox-background-brand-primary-hover transition-colors"
            >
              Connect {oauthPrompt.appId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  )

  // Shared chat input bar
  const chatInputBar = (
    <form onSubmit={handleSend} className="flex items-end gap-2">
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e) } }}
        placeholder="Ask your tutor..."
        disabled={streaming}
        rows={1}
        className="flex-1 resize-none rounded-lg border border-chatbox-border-primary bg-chatbox-background-secondary px-3 py-2 text-sm text-chatbox-tint-primary placeholder:text-chatbox-tint-placeholder focus:border-chatbox-border-brand focus:bg-chatbox-background-primary focus:outline-none focus:ring-1 focus:ring-chatbox-border-brand disabled:opacity-50"
        style={{ maxHeight: '80px' }}
      />
      <button type="submit" disabled={streaming || !input.trim()}
        className="rounded-lg bg-chatbox-background-brand-primary p-2 text-chatbox-tint-white hover:bg-chatbox-background-brand-primary-hover disabled:opacity-50 transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
      </button>
    </form>
  )

  return (
    <div className="relative flex h-screen flex-col bg-chatbox-background-secondary">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-chatbox-border-primary bg-chatbox-background-primary px-4 py-2 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => setMenuOpen(!menuOpen)} className="rounded p-1.5 text-chatbox-tint-tertiary hover:bg-chatbox-background-secondary transition-colors" aria-label="Menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          </button>
          <span className="text-sm font-bold text-chatbox-tint-primary">ChatBridge</span>
          <span className="rounded-md bg-chatbox-background-brand-secondary px-2 py-0.5 text-xs font-medium text-chatbox-tint-brand">
            {APP_DISPLAY[activeApp.appId]?.label || activeApp.appId}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleMute} title={muted ? 'Unmute sounds' : 'Mute sounds'}
            className="rounded p-1.5 text-chatbox-tint-tertiary hover:bg-chatbox-background-secondary transition-colors" aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}>
            {muted ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
            )}
          </button>
          <button onClick={() => { setActiveApp(null); setChatDrawerOpen(false) }}
            className="rounded-md border border-chatbox-border-primary px-2.5 py-1 text-xs text-chatbox-tint-secondary hover:bg-chatbox-background-secondary transition-colors">
            Close app
          </button>
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-chatbox-background-brand-primary text-[10px] font-medium text-chatbox-tint-white">
            {(user?.display_name || user?.username || '?').charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* Menu overlay */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 bg-black/20 z-30" onClick={() => setMenuOpen(false)} />
          <div className="absolute left-0 top-[45px] z-40 w-72 rounded-br-lg border border-chatbox-border-primary bg-chatbox-background-primary shadow-lg">
            <div className="border-b border-chatbox-border-primary p-3">
              <button onClick={handleNewConversation}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-chatbox-background-brand-primary px-3 py-2 text-sm font-medium text-chatbox-tint-white hover:bg-chatbox-background-brand-primary-hover transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
                New Conversation
              </button>
            </div>
            <nav className="max-h-64 overflow-y-auto p-2" aria-label="Conversations">
              {conversations.map(conv => (
                <button key={conv.id} onClick={() => { setActiveConversation(conv.id); setMenuOpen(false) }}
                  className={`mb-0.5 w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${activeConversation === conv.id ? 'bg-chatbox-background-brand-secondary text-chatbox-tint-brand font-medium' : 'text-chatbox-tint-secondary hover:bg-chatbox-background-secondary'}`}>
                  {conv.title || 'New conversation'}
                </button>
              ))}
            </nav>
            <div className="border-t border-chatbox-border-primary p-3">
              <button onClick={logout} className="text-xs text-chatbox-tint-error hover:underline">Not you? Sign out</button>
            </div>
          </div>
        </>
      )}

      {/* ── Desktop (md+): Side-by-side layout ── */}
      <div className="hidden md:flex flex-1 min-h-0">
        {/* App panel — 65% */}
        <div className="w-[65%] relative z-10 min-h-0 overflow-hidden">
          {appIframeElement}
        </div>

        {/* Chat panel — 35%, always visible */}
        <div className="w-[35%] flex flex-col border-l border-chatbox-border-primary bg-chatbox-background-primary min-h-0">
          {/* Panel header */}
          <div className="flex items-center gap-2 border-b border-chatbox-border-primary px-4 py-2.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-chatbox-background-success-primary">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <span className="text-sm font-medium text-chatbox-tint-primary">Your Tutor</span>
            {streaming && (
              <span className="ml-auto text-xs text-chatbox-tint-tertiary animate-pulse">thinking...</span>
            )}
          </div>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {visibleMessages.length === 0 && !streaming ? (
              <div className="flex h-full flex-col items-center justify-center text-center px-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-chatbox-background-success-primary/10 mb-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-chatbox-tint-brand">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <p className="text-sm font-medium text-chatbox-tint-secondary">Need help?</p>
                <p className="mt-1 text-xs text-chatbox-tint-tertiary">Ask me anything about {APP_DISPLAY[activeApp.appId]?.label || 'the app'}!</p>
              </div>
            ) : (
              chatMessageList
            )}
          </div>
          {/* Input */}
          <div className="border-t border-chatbox-border-primary px-4 py-2.5">
            {chatInputBar}
          </div>
        </div>
      </div>

      {/* ── Mobile: App fullscreen + bottom drawer/FAB ── */}
      <div className="flex md:hidden flex-1 flex-col min-h-0 relative">
        {/* App — fills all remaining space */}
        <div className="flex-1 relative z-10 min-h-0 overflow-hidden">
          {appIframeElement}
        </div>

        {/* Chat drawer — slides up from bottom */}
        {chatDrawerOpen ? (
          <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col border-t border-chatbox-border-primary bg-chatbox-background-primary shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
            style={{ maxHeight: '50vh' }}>
            {/* Drawer handle */}
            <div className="flex items-center justify-between border-b border-chatbox-border-primary px-4 py-2 cursor-pointer"
              onClick={() => setChatDrawerOpen(false)}>
              <span className="text-xs font-medium text-chatbox-tint-tertiary">Chat with your tutor</span>
              <button className="rounded p-1 text-chatbox-tint-tertiary hover:text-chatbox-tint-primary transition-colors" aria-label="Close chat">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
              </button>
            </div>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {chatMessageList}
            </div>
            {/* Input */}
            <div className="border-t border-chatbox-border-primary px-4 py-2">
              {chatInputBar}
            </div>
          </div>
        ) : (
          /* Floating "Ask your tutor" FAB */
          <button
            onClick={() => setChatDrawerOpen(true)}
            className="absolute bottom-4 right-4 z-20 flex items-center gap-2 rounded-full bg-chatbox-background-brand-primary px-5 py-3 text-sm font-medium text-chatbox-tint-white shadow-lg hover:bg-chatbox-background-brand-primary-hover active:scale-95 transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Ask your tutor
            {visibleMessages.length > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[11px]">
                {visibleMessages.length}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
