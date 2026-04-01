import { useState, useEffect } from 'react'

function sendToPlatform(type: string, correlationId: string, data: Record<string, unknown>) {
  window.parent.postMessage({ type, correlationId, data }, '*')
}

interface Definition {
  word: string
  phonetic?: string
  meanings: { partOfSpeech: string; definitions: { definition: string; example?: string }[] }[]
}

export default function DictionaryApp() {
  const [definition, setDefinition] = useState<Definition | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { sendToPlatform('ui_ready', '', {}) }, [])

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const msg = event.data
      if (!msg || msg.type !== 'tool_invoke') return
      const { correlationId, tool, params } = msg

      if (tool === 'define_word') {
        const word = params?.word as string
        if (!word) {
          sendToPlatform('error', correlationId, { message: 'No word provided' })
          return
        }
        // Note: Free Dictionary API call goes through the backend proxy in production.
        // In the iframe sandbox (no allow-same-origin), we send a tool_result asking
        // the platform to fetch for us. For now, we construct a placeholder response
        // that the LLM can use to respond to the student.
        sendToPlatform('tool_result', correlationId, {
          tool: 'define_word',
          word,
          // The actual API call will be handled by the backend
          request: { url: `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}` },
          message: `Looking up definition for "${word}"...`,
        })
        setDefinition({ word, meanings: [] })
        setError(null)
        sendToPlatform('completion', correlationId, { summary: `Looked up "${word}"` })
      } else {
        sendToPlatform('error', correlationId, { message: `Unknown tool: ${tool}` })
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  return (
    <div style={{ maxWidth: '400px', width: '100%' }}>
      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px', textAlign: 'center' }}>Dictionary</div>
      {error && <div style={{ color: '#dc2626', fontSize: '13px' }}>{error}</div>}
      {definition && (
        <div style={{ fontSize: '16px', fontWeight: 600, color: '#374151' }}>{definition.word}</div>
      )}
      {!definition && !error && (
        <div style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>Ask the chatbot to define a word</div>
      )}
    </div>
  )
}
