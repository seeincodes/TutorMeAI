/**
 * API client for the ChatBridge web platform.
 *
 * Message role constants are imported from the Chatbox source
 * (src/shared/types/session.ts) to keep role definitions consistent
 * between the Electron desktop client and our web platform.
 */
import { MessageRoleEnum, type MessageRole } from '@/lib/chatbox-types'

// Re-export Chatbox message role constants for use across the frontend
export { MessageRoleEnum, type MessageRole }

const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(body.detail || res.statusText)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export interface User {
  id: string
  username: string
  display_name: string | null
  role: 'student' | 'teacher' | 'admin' | 'district_admin'
  grade: number | null
  allowed_levels: string[] | null
}

export interface Conversation {
  id: string
  title: string | null
  active_app_id: string | null
  starred: boolean
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  role: MessageRole  // Uses Chatbox's MessageRole type (src/shared/types/session.ts)
  content: string | null
  tool_call_id: string | null
  tool_name: string | null
  created_at: string
}

export interface AppInfo {
  app_id: string
  name: string
  description: string
  auth_type: string
  status: string
  age_rating: string
}

export interface District {
  id: string
  name: string
  state: string | null
}

export interface CatalogApp {
  app_id: string
  name: string
  description: string
  status: string
  trust_tier: string
  developer_name: string | null
  is_active: boolean
}

export interface AppHealthEntry {
  app_id: string
  invocation_count: number
  success_count: number
  error_count: number
  timeout_count: number
  avg_duration_ms: number | null
}

export interface CostDashboard {
  total_input_tokens: number
  total_output_tokens: number
  per_app: { app_id: string; input_tokens: number; output_tokens: number; invocation_count: number }[]
}

export interface ScreeningQueueEntry {
  app_id: string
  name: string
  flag_count: number
  auto_suspend_threshold: number
  is_active: boolean
}

export const api = {
  login: (username: string, password: string) =>
    request<{ user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  refresh: () => request<{ message: string }>('/auth/refresh', { method: 'POST' }),

  logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),

  me: () => request<{ user: User }>('/users/me'),

  listApps: () => request<AppInfo[]>('/apps'),

  listConversations: () => request<Conversation[]>('/conversations'),

  createConversation: (title?: string) =>
    request<Conversation>('/conversations', {
      method: 'POST',
      body: JSON.stringify({ title }),
    }),

  updateConversation: (conversationId: string, data: { title?: string; starred?: boolean }) =>
    request<Conversation>(`/conversations/${conversationId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  copyConversation: (conversationId: string) =>
    request<Conversation>(`/conversations/${conversationId}/copy`, { method: 'POST' }),

  deleteConversation: (conversationId: string) =>
    request<void>(`/conversations/${conversationId}`, { method: 'DELETE' }),

  getMessages: (conversationId: string) =>
    request<Message[]>(`/conversations/${conversationId}/messages`),

  submitToolResult: (conversationId: string, correlationId: string, result: Record<string, unknown>) =>
    request<{ status: string }>(`/conversations/${conversationId}/tool-result`, {
      method: 'POST',
      body: JSON.stringify({ correlation_id: correlationId, result }),
    }),

  sendMessage: async (
    conversationId: string,
    content: string,
    onToken: (token: string) => void,
    onDone: (messageId: string) => void,
    onError: (error: string) => void,
    onIntent?: (appId: string) => void,
    onToolCall?: (appId: string, tool: string, params: Record<string, unknown>, correlationId: string) => void,
    onOAuthPrompt?: (appId: string, message: string) => void,
  ) => {
    const res = await fetch(`${BASE}/conversations/${conversationId}/messages`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: res.statusText }))
      onError(body.detail || res.statusText)
      return
    }
    const reader = res.body?.getReader()
    if (!reader) return

    const decoder = new TextDecoder()
    let buffer = ''
    let currentEvent = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim()
          continue
        }
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          try {
            const parsed = JSON.parse(data)
            if (currentEvent === 'intent' && 'app_id' in parsed) {
              onIntent?.(parsed.app_id)
            } else if (currentEvent === 'tool_call' && 'tool' in parsed) {
              onToolCall?.(parsed.app_id, parsed.tool, parsed.params, parsed.correlation_id)
            } else if (currentEvent === 'oauth_prompt' && 'app_id' in parsed) {
              onOAuthPrompt?.(parsed.app_id, parsed.message || 'Connect your account')
            } else if ('content' in parsed) {
              onToken(parsed.content)
            } else if ('message_id' in parsed) {
              onDone(parsed.message_id)
            } else if ('detail' in parsed) {
              onError(parsed.detail)
            }
          } catch {
            // ignore parse errors
          }
          currentEvent = ''
        }
      }
    }
  },

  // Dashboard API
  fetchDistricts: () => request<District[]>('/districts'),

  approveDistrictApp: (districtId: string, appId: string) =>
    request<{ app_id: string; status: string }>(`/districts/${districtId}/apps`, {
      method: 'POST',
      body: JSON.stringify({ app_id: appId }),
    }),

  revokeDistrictApp: (districtId: string, appId: string) =>
    request<{ status: string }>(`/districts/${districtId}/apps/${appId}`, {
      method: 'DELETE',
    }),

  fetchMarketplaceCatalog: () => request<CatalogApp[]>('/marketplace/catalog'),

  updateTrustTier: (appId: string, trustTier: string) =>
    request<{ app_id: string; trust_tier: string }>(`/marketplace/${appId}/trust`, {
      method: 'PATCH',
      body: JSON.stringify({ trust_tier: trustTier }),
    }),

  fetchScreeningQueue: () => request<ScreeningQueueEntry[]>('/marketplace/screening-queue'),

  clearAppFlags: (appId: string) =>
    request<{ app_id: string; flag_count: number; is_active: boolean }>(`/marketplace/${appId}/clear-flags`, {
      method: 'POST',
    }),

  fetchAppHealth: () => request<AppHealthEntry[]>('/observability/app-health'),

  fetchCostDashboard: () => request<CostDashboard>('/observability/cost-dashboard'),
}
