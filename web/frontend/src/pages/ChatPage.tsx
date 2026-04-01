import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { api, type Conversation, type Message } from '@/lib/api'
import AppIframe, { type AppIframeHandle } from '@/components/AppIframe'

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
  const [menuOpen, setMenuOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const appIframeRef = useRef<AppIframeHandle>(null)

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
    api.listConversations().then(setConversations).catch(() => {})
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
        const levels = user?.allowed_levels?.join(',') || ''
        const grade = user?.grade || ''
        const params = levels ? `?levels=${encodeURIComponent(levels)}&grade=${grade}` : ''
        setActiveApp({ appId, iframeUrl: `/apps/${appId}/index.html${params}` })
      },
      async (appId, tool, params, correlationId) => {
        if (!appIframeRef.current) {
          const levels = user?.allowed_levels?.join(',') || ''
          const grade = user?.grade || ''
          const qp = levels ? `?levels=${encodeURIComponent(levels)}&grade=${grade}` : ''
          setActiveApp({ appId, iframeUrl: `/apps/${appId}/index.html${qp}` })
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
            <div className="mx-auto max-w-2xl space-y-4">
              {visibleMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 shadow-sm border border-gray-200'}`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {streaming && streamingContent && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 shadow-sm" aria-live="polite">
                    <p className="whitespace-pre-wrap">{streamingContent}</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
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
      <div className="flex-1 relative z-10">
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
          onCompletion={(data) => {
            setMessages(prev => [...prev, {
              id: crypto.randomUUID(), role: 'assistant',
              content: `The ${activeApp.appId} app has completed. ${data.summary || ''}`,
              tool_call_id: null, tool_name: null, created_at: new Date().toISOString(),
            }])
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
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {streaming && streamingContent && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-900" aria-live="polite">
                    <p className="whitespace-pre-wrap">{streamingContent}</p>
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
