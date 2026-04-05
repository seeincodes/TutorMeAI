import { useRef, useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react'
import {
  type AppMessage,
  type PlatformMessage,
  isAppMessage,
  createCorrelationId,
} from '@/lib/postMessage'

const TOOL_TIMEOUT_MS = 30_000
const MAX_MESSAGES_PER_SECOND = 10
const FLOOD_RELOAD_THRESHOLD = 100

interface PendingInvocation {
  correlationId: string
  resolve: (result: Record<string, unknown>) => void
  reject: (error: Error) => void
  timer: ReturnType<typeof setTimeout>
}

interface AppIframeProps {
  appId: string
  iframeUrl: string
  onToolResult?: (tool: string, correlationId: string, result: Record<string, unknown>) => void
  onCompletion?: (data: Record<string, unknown>) => void
  onError?: (error: string) => void
  onStateUpdate?: (data: Record<string, unknown>) => void
  onReady?: () => void
}

export type AppIframeHandle = {
  invokeTool: (tool: string, params: Record<string, unknown>) => Promise<Record<string, unknown>>
}

const AppIframe = forwardRef<AppIframeHandle, AppIframeProps>(function AppIframe({
  appId,
  iframeUrl,
  onToolResult,
  onCompletion,
  onError,
  onStateUpdate,
  onReady,
}, ref) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const pendingRef = useRef<Map<string, PendingInvocation>>(new Map())

  // PostMessage rate limiter — drop excess messages, reload iframe on persistent flood
  const msgCountRef = useRef(0)
  const droppedCountRef = useRef(0)
  const rateLimitTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    rateLimitTimerRef.current = setInterval(() => {
      msgCountRef.current = 0
    }, 1000)
    return () => {
      if (rateLimitTimerRef.current) clearInterval(rateLimitTimerRef.current)
    }
  }, [])

  // Handle messages from iframe
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      // Origin is "null" for sandboxed iframes without allow-same-origin
      // We validate by checking the message structure instead
      const msg = event.data

      // Handle TTS stop from iframe — cancel parent speech
      if (msg && typeof msg === 'object' && (msg as Record<string, unknown>).type === 'tts_stop') {
        speechSynthesis.cancel()
        return
      }

      if (!isAppMessage(msg)) return

      // Rate limit: drop messages exceeding MAX_MESSAGES_PER_SECOND
      msgCountRef.current++
      if (msgCountRef.current > MAX_MESSAGES_PER_SECOND) {
        droppedCountRef.current++
        // Reload iframe on persistent flood (adversarial behavior)
        if (droppedCountRef.current >= FLOOD_RELOAD_THRESHOLD) {
          droppedCountRef.current = 0
          console.warn(`[AppIframe] ${appId}: postMessage flood detected, reloading iframe`)
          handleRetry()
        }
        return
      }
      droppedCountRef.current = 0

      const appMsg = msg as AppMessage

      switch (appMsg.type) {
        case 'ui_ready':
          setReady(true)
          setLoading(false)
          setError(null)
          onReady?.()
          // Stop any parent TTS before iframe starts its own
          speechSynthesis.cancel()
          // Tell iframe TTS is unlocked (user clicked to open app = user gesture)
          if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage({ type: 'tts_unlock' }, '*')
          }
          break

        case 'tool_result': {
          const pending = pendingRef.current.get(appMsg.correlationId)
          if (pending) {
            clearTimeout(pending.timer)
            pendingRef.current.delete(appMsg.correlationId)
            pending.resolve(appMsg.data)
            onToolResult?.(appMsg.data.tool as string, appMsg.correlationId, appMsg.data)
          }
          break
        }

        case 'completion':
          onCompletion?.(appMsg.data)
          break

        case 'error': {
          const errorMsg = (appMsg.data?.message as string) || 'App error'
          setError(errorMsg)
          onError?.(errorMsg)
          // Reject any pending invocation with matching correlationId
          const pendingErr = pendingRef.current.get(appMsg.correlationId)
          if (pendingErr) {
            clearTimeout(pendingErr.timer)
            pendingRef.current.delete(appMsg.correlationId)
            pendingErr.reject(new Error(errorMsg))
          }
          break
        }

        case 'state_update':
          onStateUpdate?.(appMsg.data)
          break
      }
    },
    [onToolResult, onCompletion, onError, onStateUpdate, onReady],
  )

  useEffect(() => {
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [handleMessage])

  // Timeout for ui_ready — if iframe doesn't signal ready in 30s, show error
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!ready) {
        setLoading(false)
        setError('App failed to load (timeout)')
        onError?.('App failed to load (timeout)')
      }
    }, TOOL_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [ready, onError])

  // Send a tool invocation to the iframe
  const invokeTool = useCallback(
    (tool: string, params: Record<string, unknown>): Promise<Record<string, unknown>> => {
      return new Promise((resolve, reject) => {
        if (!iframeRef.current?.contentWindow) {
          reject(new Error('Iframe not available'))
          return
        }
        if (!ready) {
          reject(new Error('App not ready'))
          return
        }

        const correlationId = createCorrelationId()
        const timer = setTimeout(() => {
          pendingRef.current.delete(correlationId)
          const err = `Tool '${tool}' timed out after ${TOOL_TIMEOUT_MS / 1000}s`
          setError(err)
          onError?.(err)
          reject(new Error(err))
        }, TOOL_TIMEOUT_MS)

        pendingRef.current.set(correlationId, { correlationId, resolve, reject, timer })

        const message: PlatformMessage = {
          type: 'tool_invoke',
          correlationId,
          tool,
          params,
        }

        // targetOrigin is "*" for sandboxed iframes (no origin to match)
        iframeRef.current.contentWindow.postMessage(message, '*')
      })
    },
    [ready, onError],
  )

  useImperativeHandle(ref, () => ({ invokeTool }), [invokeTool])

  function handleRetry() {
    setError(null)
    setLoading(true)
    setReady(false)
    // Force iframe reload by toggling src
    if (iframeRef.current) {
      const src = iframeRef.current.src
      iframeRef.current.src = ''
      setTimeout(() => {
        if (iframeRef.current) iframeRef.current.src = src
      }, 50)
    }
  }

  function handleDismissError() {
    setError(null)
  }

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {/* Error banner — dual error display (inline banner) */}
      {error && (
        <div
          className="flex items-center gap-2 border-b border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          <span className="flex-1">{error}</span>
          <button
            onClick={handleRetry}
            className="rounded border border-red-300 px-2 py-0.5 text-xs hover:bg-red-100"
          >
            Retry
          </button>
          <button
            onClick={handleDismissError}
            className="text-red-400 hover:text-red-600"
            aria-label="Dismiss error"
          >
            &times;
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
          <span className="text-sm text-gray-400">Loading {appId}...</span>
        </div>
      )}

      {/* Sandboxed iframe — all apps are first-party, allow-same-origin needed for React event handling */}
      <iframe
        ref={iframeRef}
        src={iframeUrl}
        sandbox="allow-scripts allow-same-origin allow-forms"
        allow="geolocation"
        title={`${appId} app`}
        className="h-full w-full border-0"
      />
    </div>
  )
})

export default AppIframe
