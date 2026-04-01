import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { api, type Conversation, type Message } from '@/lib/api'
import AppIframe from '@/components/AppIframe'

export default function ChatPage() {
  const { user, logout } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [activeApp, setActiveApp] = useState<{ appId: string; iframeUrl: string } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, streamingContent, scrollToBottom])

  useEffect(() => {
    api.listConversations().then(setConversations).catch(() => {})
  }, [])

  useEffect(() => {
    if (activeConversation) {
      api.getMessages(activeConversation).then(setMessages).catch(() => {})
    } else {
      setMessages([])
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
        // Intent detected — show iframe for this app
        setActiveApp({ appId, iframeUrl: `/apps/${appId}/index.html` })
      },
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h1 className="text-sm font-semibold text-gray-900">ChatBridge</h1>
          <button
            onClick={handleNewConversation}
            className="rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
            aria-label="New conversation"
          >
            + New
          </button>
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
              {user?.username} ({user?.role})
            </span>
            <button
              onClick={logout}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Chat area */}
      <main className={`flex flex-1 flex-col ${activeApp ? 'max-w-[50%]' : ''}`}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mx-auto max-w-2xl space-y-4">
            {messages.map(msg => (
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
              appId={activeApp.appId}
              iframeUrl={activeApp.iframeUrl}
              onError={(err) => {
                // Dual error display: chatbot acknowledges the error
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
            />
          </div>
        </aside>
      )}
    </div>
  )
}
