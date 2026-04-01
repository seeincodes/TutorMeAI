import { useState, useEffect } from 'react'
import { evaluate } from 'mathjs'

function sendToPlatform(type: string, correlationId: string, data: Record<string, unknown>) {
  window.parent.postMessage({ type, correlationId, data }, '*')
}

export default function CalculatorApp() {
  const [expression, setExpression] = useState('')
  const [result, setResult] = useState<string | null>(null)

  useEffect(() => {
    sendToPlatform('ui_ready', '', {})
  }, [])

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const msg = event.data
      if (!msg || msg.type !== 'tool_invoke') return
      const { correlationId, tool, params } = msg

      if (tool === 'calculate') {
        const expr = params?.expression as string
        if (!expr) {
          sendToPlatform('error', correlationId, { message: 'No expression provided' })
          return
        }
        try {
          const res = evaluate(expr)
          const resultStr = String(res)
          setExpression(expr)
          setResult(resultStr)
          sendToPlatform('tool_result', correlationId, {
            tool: 'calculate',
            expression: expr,
            result: resultStr,
          })
          sendToPlatform('completion', correlationId, {
            summary: `${expr} = ${resultStr}`,
          })
        } catch (e) {
          sendToPlatform('error', correlationId, {
            message: `Cannot evaluate: ${expr}. ${e instanceof Error ? e.message : ''}`,
          })
        }
      } else {
        sendToPlatform('error', correlationId, { message: `Unknown tool: ${tool}` })
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  return (
    <div style={{ textAlign: 'center', padding: '24px' }}>
      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>Math Calculator</div>
      {expression && (
        <div style={{ fontSize: '20px', fontFamily: 'monospace' }}>
          <div style={{ color: '#374151' }}>{expression}</div>
          <div style={{ color: '#2563eb', fontWeight: 600, marginTop: '8px' }}>= {result}</div>
        </div>
      )}
      {!expression && (
        <div style={{ fontSize: '12px', color: '#9ca3af' }}>Ask the chatbot to calculate something</div>
      )}
    </div>
  )
}
