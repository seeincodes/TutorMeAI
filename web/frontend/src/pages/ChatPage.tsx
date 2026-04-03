import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { api, type AppInfo, type Conversation, type Message } from '@/lib/api'
import AppIframe, { type AppIframeHandle } from '@/components/AppIframe'
import ChatMessage from '@/components/ChatMessage'

interface AppState {
  appId: string
  iframeUrl: string
  state?: Record<string, unknown>
}

export default function ChatPage() {
  const { user, logout } = useAuth()
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const appIframeRef = useRef<AppIframeHandle>(null)
  const userCityRef = useRef<string | null>(null)

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
          setActiveApp(null)
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

  const APP_DISPLAY: Record<string, { label: string; emoji: string; prompt: string }> = {
    calculator: { label: 'Math Helper', emoji: '🧮', prompt: 'I want to use the calculator' },
    chess: { label: 'Chess', emoji: '♟️', prompt: 'Let\'s play chess' },
    dictionary: { label: 'Reading & Vocabulary', emoji: '📖', prompt: 'I want to look up a word in the dictionary' },
    weather: { label: 'Weather', emoji: '🌤️', prompt: 'Open the weather app' },
    flashcards: { label: 'Flashcards', emoji: '🗂️', prompt: 'I want to study with flashcards' },
    'life-skills': { label: 'Level Up Life', emoji: '🎮', prompt: 'I want to play Level Up Life' },
    'google-classroom': { label: 'Google Classroom', emoji: '🎓', prompt: 'Open Google Classroom' },
  }

  async function handleAppLaunch(appId: string) {
    const display = APP_DISPLAY[appId]
    if (!display) return
    const conv = await api.createConversation(display.label)
    setConversations(prev => [conv, ...prev])
    setActiveConversation(conv.id)
    setActiveApp(null)

    // Send a message that will trigger the intent classifier to open the app
    const userMessage: Message = {
      id: crypto.randomUUID(), role: 'user', content: display.prompt,
      tool_call_id: null, tool_name: null, created_at: new Date().toISOString(),
    }
    setMessages([userMessage])
    setInput('')
    setStreaming(true)
    setStreamingContent('')

    await api.sendMessage(
      conv.id,
      display.prompt,
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
      },
      (error) => {
        setStreamingContent('')
        setStreaming(false)
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(), role: 'assistant', content: `Error: ${error}`,
          tool_call_id: null, tool_name: null, created_at: new Date().toISOString(),
        }])
      },
      (intentAppId) => {
        setActiveApp({ appId: intentAppId, iframeUrl: buildAppUrl(intentAppId) })
      },
      async (toolAppId, tool, params, correlationId) => {
        if (!appIframeRef.current) {
          setActiveApp({ appId: toolAppId, iframeUrl: buildAppUrl(toolAppId) })
          await new Promise(r => setTimeout(r, 2000))
        }
        try {
          let result: Record<string, unknown> = { status: 'no_iframe' }
          if (appIframeRef.current) {
            result = await appIframeRef.current.invokeTool(tool, params)
          }
          await api.submitToolResult(conv.id, correlationId, result)
        } catch (err) {
          await api.submitToolResult(conv.id, correlationId, {
            error: err instanceof Error ? err.message : 'Tool execution failed',
          })
        }
      },
      (oauthAppId: string, message: string) => {
        setOauthPrompt({ appId: oauthAppId, message })
      },
    )
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
    setStreaming(true)
    setStreamingContent('')

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
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h1 className="text-sm font-semibold text-gray-900">ChatBridge</h1>
            <button onClick={handleNewConversation} className="rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700" aria-label="New conversation">
              + New
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto p-2" aria-label="Conversations">
            {conversations.map(conv => (
              <button key={conv.id} onClick={() => setActiveConversation(conv.id)}
                className={`mb-1 w-full rounded-md px-3 py-2 text-left text-sm ${activeConversation === conv.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                {conv.title || 'New conversation'}
              </button>
            ))}
          </nav>
          <div className="border-t border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">{user?.display_name || user?.username}</span>
              <button onClick={logout} className="rounded px-2 py-0.5 text-xs font-medium text-red-600 hover:bg-red-50">Not you? Sign out</button>
            </div>
          </div>
        </aside>

        {/* Full chat */}
        <main className="flex flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-4 py-6">
            {visibleMessages.length === 0 && !streaming ? (
              <div className="mx-auto max-w-2xl flex flex-col items-center justify-center h-full">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Hi{user?.display_name ? `, ${user.display_name}` : ''}!</h2>
                <p className="text-gray-500 mb-6 text-center">What would you like to do today? Pick an app or just start chatting.</p>
                {availableApps.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg mb-8">
                    {availableApps.map(app => {
                      const display = APP_DISPLAY[app.app_id]
                      if (!display) return null
                      return (
                        <button
                          key={app.app_id}
                          onClick={() => handleAppLaunch(app.app_id)}
                          disabled={streaming}
                          className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-4 text-sm font-medium text-gray-700 shadow-sm hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors disabled:opacity-50"
                        >
                          <span className="text-2xl">{display.emoji}</span>
                          <span>{display.label}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            ) : (
            <div className="mx-auto max-w-2xl space-y-4">
              {visibleMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 shadow-sm border border-gray-200'}`}>
                    <ChatMessage content={msg.content || ''} role={msg.role} onAppLaunch={handleAppLaunch} disabled={streaming} />
                  </div>
                </div>
              ))}
              {streaming && streamingContent && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 shadow-sm" aria-live="polite">
                    <ChatMessage content={streamingContent} role="assistant" onAppLaunch={handleAppLaunch} disabled={streaming} />
                  </div>
                </div>
              )}
              {oauthPrompt && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm">
                    <p className="text-gray-700 mb-2">{oauthPrompt.message}</p>
                    <button
                      onClick={() => handleOAuthConnect(oauthPrompt.appId)}
                      className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
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
          <div className="border-t border-gray-200 bg-white px-4 py-3">
            <form onSubmit={handleSend} className="mx-auto flex max-w-2xl gap-2">
              <label htmlFor="chat-input" className="sr-only">Message</label>
              <input id="chat-input" type="text" value={input} onChange={e => setInput(e.target.value)}
                placeholder="Type a message..." disabled={streaming}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50" />
              <button type="submit" disabled={streaming || !input.trim()}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">Send</button>
            </form>
          </div>
        </main>
      </div>
    )
  }

  // ============================================================
  // LAYOUT MODE 2: App active — app fills screen, chat is a drawer
  // ============================================================
  return (
    <div className="relative flex h-screen flex-col bg-gray-50">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2 z-20">
        <div className="flex items-center gap-3">
          {/* Menu button */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="rounded p-1.5 text-gray-500 hover:bg-gray-100" aria-label="Menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          </button>
          <h1 className="text-sm font-semibold text-gray-900">ChatBridge</h1>
          <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">{activeApp.appId}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setActiveApp(null); setChatDrawerOpen(false) }}
            className="rounded px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-100 border border-gray-200">
            Close app
          </button>
          <span className="text-xs text-gray-400">{user?.display_name || user?.username}</span>
        </div>
      </header>

      {/* Menu overlay */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 bg-black/20 z-30" onClick={() => setMenuOpen(false)} />
          <div className="absolute left-0 top-[45px] z-40 w-72 bg-white border border-gray-200 rounded-br-lg shadow-lg">
            <div className="p-3 border-b border-gray-100">
              <button onClick={handleNewConversation}
                className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
                + New Conversation
              </button>
            </div>
            <nav className="max-h-64 overflow-y-auto p-2" aria-label="Conversations">
              {conversations.map(conv => (
                <button key={conv.id} onClick={() => { setActiveConversation(conv.id); setMenuOpen(false) }}
                  className={`mb-1 w-full rounded-md px-3 py-2 text-left text-sm ${activeConversation === conv.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                  {conv.title || 'New conversation'}
                </button>
              ))}
            </nav>
            <div className="border-t border-gray-100 p-3">
              <button onClick={logout} className="text-xs text-red-600 hover:underline">Not you? Sign out</button>
            </div>
          </div>
        </>
      )}

      {/* App — fills all remaining space */}
      <div className="flex-1 relative z-10 min-h-0 overflow-hidden">
        <AppIframe
          key={activeApp.appId}
          ref={appIframeRef}
          appId={activeApp.appId}
          iframeUrl={activeApp.iframeUrl}
          onError={(err) => {
            setMessages(prev => [...prev, {
              id: crypto.randomUUID(), role: 'assistant',
              content: `The ${activeApp.appId} app encountered an error: ${err}. You can try again or ask me something else.`,
              tool_call_id: null, tool_name: null, created_at: new Date().toISOString(),
            }])
            setChatDrawerOpen(true)
          }}
          onCompletion={async (data) => {
            // Verify completion claim by polling app state before trusting it
            let verified = false
            try {
              if (appIframeRef.current) {
                const state = await appIframeRef.current.invokeTool('get_state', {})
                // Check if app state confirms completion (e.g., game over, quiz finished)
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
              // If get_state fails or times out, accept the completion (graceful degradation)
              verified = true
            }
            if (verified) {
              setMessages(prev => [...prev, {
                id: crypto.randomUUID(), role: 'assistant',
                content: `The ${activeApp.appId} app has completed. ${data.summary || ''}`,
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
            if (activeConversation) {
              fetch(`/api/conversations/${activeConversation}/app-state`, {
                method: 'POST', credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ appId: activeApp.appId, state: data }),
              }).catch(() => {})
            }
          }}
        />
      </div>

      {/* Chat drawer — slides up from bottom */}
      {chatDrawerOpen ? (
        <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]"
          style={{ maxHeight: '50vh' }}>
          {/* Drawer handle */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 cursor-pointer"
            onClick={() => setChatDrawerOpen(false)}>
            <span className="text-xs font-medium text-gray-500">Chat with your tutor</span>
            <button className="rounded p-1 text-gray-400 hover:text-gray-600" aria-label="Close chat">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
            </button>
          </div>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <div className="space-y-3">
              {visibleMessages.slice(-10).map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-lg px-3 py-1.5 text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                    <ChatMessage content={msg.content || ''} role={msg.role} onAppLaunch={handleAppLaunch} disabled={streaming} />
                  </div>
                </div>
              ))}
              {streaming && streamingContent && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-900" aria-live="polite">
                    <ChatMessage content={streamingContent} role="assistant" onAppLaunch={handleAppLaunch} disabled={streaming} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          {/* Input */}
          <div className="border-t border-gray-100 px-4 py-2">
            <form onSubmit={handleSend} className="flex gap-2">
              <input type="text" value={input} onChange={e => setInput(e.target.value)}
                placeholder="Ask your tutor..." disabled={streaming} autoFocus
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50" />
              <button type="submit" disabled={streaming || !input.trim()}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">Send</button>
            </form>
          </div>
        </div>
      ) : (
        /* Floating "Ask your tutor" button */
        <button
          onClick={() => setChatDrawerOpen(true)}
          className="absolute bottom-4 right-4 z-20 flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg hover:bg-blue-700 active:scale-95 transition-transform"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Ask your tutor
          {visibleMessages.length > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">
              {visibleMessages.length}
            </span>
          )}
        </button>
      )}
    </div>
  )
}
