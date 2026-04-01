// Platform → App
export interface PlatformMessage {
  type: 'tool_invoke' | 'tool_cancel' | 'state_request' | 'shutdown'
  correlationId: string
  tool: string
  params: Record<string, unknown>
}

// App → Platform
export interface AppMessage {
  type: 'tool_result' | 'state_update' | 'completion' | 'error' | 'ui_ready'
  correlationId: string
  data: Record<string, unknown>
}

export function isPlatformMessage(msg: unknown): msg is PlatformMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    'correlationId' in msg &&
    typeof (msg as PlatformMessage).type === 'string' &&
    ['tool_invoke', 'tool_cancel', 'state_request', 'shutdown'].includes((msg as PlatformMessage).type)
  )
}

export function isAppMessage(msg: unknown): msg is AppMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    typeof (msg as AppMessage).type === 'string' &&
    ['tool_result', 'state_update', 'completion', 'error', 'ui_ready'].includes((msg as AppMessage).type)
  )
}

export function createCorrelationId(): string {
  return crypto.randomUUID()
}
