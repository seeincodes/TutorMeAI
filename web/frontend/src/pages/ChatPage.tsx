import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { api, type Conversation, type Message } from '@/lib/api'
import AppIframe, { type AppIframeHandle } from '@/components/AppIframe'

interface AppState {
  appId: string
  iframeUrl: string
  state?: Record<string, unknown> // e.g. { fen: "...", playerColor: "white" }
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
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [chatOpen, setChatOpen] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const appIframeRef = useRef<AppIframeHandle>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Keyboard: Escape closes app panel
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && activeApp) {
        setActiveApp(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeApp])

  useEffect(() => { scrollToBottom() }, [messages, streamingContent, scrollToBottom])

  useEffect(() => {
    api.listConversations().then(setConversations).catch(() => {})
  }, [])

  useEffect(() => {
    if (activeConversation) {
      api.getMessages(activeConversation).then(msgs => {
        setMessages(msgs)

        // Check for saved app state in system messages (most recent one wins)
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
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      tool_call_id: null,
      tool_name: null,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setStreaming(true)
    setStreamingContent('')

    await api.sendMessage(
      conversationId,
      input,
      (token) => setStreamingContent(prev => prev + token),
      (messageId) => {
        setStreamingContent(prev => {
          const assistantMessage: Message = {
            id: messageId,
            role: 'assistant',
            content: prev,
            tool_call_id: null,
            tool_name: null,
            created_at: new Date().toISOString(),
          }
          setMessages(msgs => [...msgs, assistantMessage])
          return ''
        })
        setStreaming(false)
      },
      (error) => {
        setStreamingContent('')
        setStreaming(false)
        setMessages(prev => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `Error: ${error}`,
            tool_call_id: null,
            tool_name: null,
            created_at: new Date().toISOString(),
          },
        ])
      },
      (appId) => {
        // Intent detected — show iframe with student's allowed levels
        const levels = user?.allowed_levels?.join(',') || ''
        const grade = user?.grade || ''
        const params = levels ? `?levels=${encodeURIComponent(levels)}&grade=${grade}` : ''
        setActiveApp({ appId, iframeUrl: `/apps/${appId}/index.html${params}` })
      },
      async (appId, tool, params, correlationId) => {
        // LLM made a real tool call — dispatch to iframe and return result
        if (!appIframeRef.current) {
          // If iframe not open yet, open it first
          const levels = user?.allowed_levels?.join(',') || ''
          const grade = user?.grade || ''
          const qp = levels ? `?levels=${encodeURIComponent(levels)}&grade=${grade}` : ''
          setActiveApp({ appId, iframeUrl: `/apps/${appId}/index.html${qp}` })
          // Wait a bit for iframe to load
          await new Promise(r => setTimeout(r, 2000))
        }

        try {
          let result: Record<string, unknown> = { status: 'no_iframe' }
          if (appIframeRef.current) {
            result = await appIframeRef.current.invokeTool(tool, params)
          }
          // POST result back to backend to unblock the LLM
          if (activeConversation) {
            await api.submitToolResult(activeConversation, correlationId, result)
          }
        } catch (err) {
          // Send error result so LLM can handle gracefully
          if (activeConversation) {
            await api.submitToolResult(activeConversation, correlationId, {
              error: err instanceof Error ? err.message : 'Tool execution failed',
            })
          }
        }
      },
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar — collapsible */}
      {sidebarOpen ? (
        <aside className="flex w-64 flex-col border-r border-gray-200 bg-white transition-all">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h1 className="text-sm font-semibold text-gray-900">ChatBridge</h1>
            <div className="flex gap-1">
              <button
                onClick={handleNewConversation}
                className="rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
                aria-label="New conversation"
              >
                + New
              </button>
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Collapse sidebar"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 19l-7-7 7-7"/><path d="M18 19l-7-7 7-7" opacity="0.5"/></svg>
              </button>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-2" aria-label="Conversations">
            {conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => setActiveConversation(conv.id)}
                className={`mb-1 w-full rounded-md px-3 py-2 text-left text-sm ${
                  activeConversation === conv.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {conv.title || 'New conversation'}
              </button>
            ))}
          </nav>

          <div className="border-t border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {user?.display_name || user?.username}
              </span>
              <button
                onClick={logout}
                className="rounded px-2 py-0.5 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                Not you? Sign out
              </button>
            </div>
          </div>
        </aside>
      ) : (
        <div className="flex flex-col items-center border-r border-gray-200 bg-white py-3 px-1 gap-2">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Expand sidebar"
            title="Show history"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 5l7 7-7 7"/><path d="M6 5l7 7-7 7" opacity="0.5"/></svg>
          </button>
          <button
            onClick={handleNewConversation}
            className="rounded p-1.5 text-blue-600 hover:bg-blue-50"
            aria-label="New conversation"
            title="New chat"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
          </button>
        </div>
      )}

      {/* Chat area — collapsible when app is active */}
      {chatOpen ? (
        <main className={`flex flex-1 flex-col ${activeApp ? 'max-w-[50%]' : ''} transition-all`}>
          {/* Chat header with collapse toggle */}
          {activeApp && (
            <div className="flex items-center justify-between border-b border-gray-200 bg-white px-3 py-1.5">
              <span className="text-xs text-gray-500">Chat</span>
              <button
                onClick={() => setChatOpen(false)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Collapse chat"
                title="Hide chat"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 19l-7-7 7-7"/><path d="M18 19l-7-7 7-7" opacity="0.5"/></svg>
              </button>
            </div>
          )}
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="mx-auto max-w-2xl space-y-4">
              {messages.filter(m => m.role !== 'system').map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-900 shadow-sm border border-gray-200'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}

              {streaming && streamingContent && (
                <div className="flex justify-start">
                  <div
                    className="max-w-[80%] rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 shadow-sm"
                    aria-live="polite"
                    aria-atomic="false"
                  >
                    <p className="whitespace-pre-wrap">{streamingContent}</p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 bg-white px-4 py-3">
            <form onSubmit={handleSend} className="mx-auto flex max-w-2xl gap-2">
              <label htmlFor="chat-input" className="sr-only">Message</label>
              <input
                id="chat-input"
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type a message..."
                disabled={streaming}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={streaming || !input.trim()}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        </main>
      ) : (
        <div className="flex flex-col items-center border-r border-gray-200 bg-white py-3 px-1">
          <button
            onClick={() => setChatOpen(true)}
            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Expand chat"
            title="Show chat"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 5l7 7-7 7"/><path d="M6 5l7 7-7 7" opacity="0.5"/></svg>
          </button>
        </div>
      )}

      {/* App panel */}
      {activeApp && (
        <aside className="flex w-1/2 flex-col border-l border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
            <span className="text-sm font-medium text-gray-700">{activeApp.appId}</span>
            <button
              onClick={() => setActiveApp(null)}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              aria-label="Close app"
            >
              &times;
            </button>
          </div>
          <div className="flex-1">
            <AppIframe
              key={activeApp.appId}
              ref={appIframeRef}
              appId={activeApp.appId}
              iframeUrl={activeApp.iframeUrl}
              onError={(err) => {
                setMessages(prev => [
                  ...prev,
                  {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: `The ${activeApp.appId} app encountered an error: ${err}. You can try again or ask me something else.`,
                    tool_call_id: null,
                    tool_name: null,
                    created_at: new Date().toISOString(),
                  },
                ])
              }}
              onCompletion={(data) => {
                setMessages(prev => [
                  ...prev,
                  {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: `The ${activeApp.appId} app has completed. ${data.summary || ''}`,
                    tool_call_id: null,
                    tool_name: null,
                    created_at: new Date().toISOString(),
                  },
                ])
              }}
              onReady={() => {
                if (pendingRestore && appIframeRef.current) {
                  appIframeRef.current.invokeTool('restore_state', pendingRestore).catch(() => {})
                  setPendingRestore(null)
                }
              }}
              onStateUpdate={(data) => {
                // Flag inappropriate searches to teacher dashboard
                if (data.type === 'inappropriate_search') {
                  fetch('/api/teacher/flags', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      app_id: activeApp.appId,
                      word: data.word,
                      reason: data.reason || 'blocked_word',
                      conversation_id: activeConversation,
                      timestamp: data.timestamp,
                    }),
                  }).catch(() => {})
                  return // Don't save flagged searches as app state
                }

                // Save app state for any app on every meaningful state change
                if (activeConversation) {
                  const statePayload = JSON.stringify({ appId: activeApp.appId, state: data })
                  fetch(`/api/conversations/${activeConversation}/app-state`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: statePayload,
                  }).catch(() => {})
                }
              }}
            />
          </div>
        </aside>
      )}
    </div>
  )
}
