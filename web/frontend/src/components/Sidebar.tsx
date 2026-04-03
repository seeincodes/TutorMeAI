/**
 * Sidebar component adapted from the forked chatbox codebase
 * (src/renderer/Sidebar.tsx).
 *
 * Simplified for ChatBridge: removed Mantine, TanStack Router, Zustand,
 * i18n, task mode, image generation, copilots. Uses Tailwind + our
 * design tokens. Keeps the visual layout and conversation list pattern.
 */
import { cn } from '@/lib/utils'
import type { Conversation, AppInfo } from '@/lib/api'

const APP_DISPLAY: Record<string, { label: string; emoji: string }> = {
  calculator: { label: 'Math Helper', emoji: '🧮' },
  chess: { label: 'Chess', emoji: '♟️' },
  dictionary: { label: 'Reading & Vocab', emoji: '📖' },
  weather: { label: 'Weather', emoji: '🌤️' },
  flashcards: { label: 'Flashcards', emoji: '🗂️' },
  'life-skills': { label: 'Level Up Life', emoji: '🎮' },
  'google-classroom': { label: 'Classroom', emoji: '🎓' },
}

interface SidebarProps {
  conversations: Conversation[]
  activeConversation: string | null
  onSelectConversation: (id: string) => void
  onNewConversation: () => void
  onAppLaunch: (appId: string) => void
  availableApps: AppInfo[]
  username: string
  role?: string
  onLogout: () => void
  onToggleDarkMode?: () => void
  darkMode?: boolean
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export default function Sidebar({
  conversations,
  activeConversation,
  onSelectConversation,
  onNewConversation,
  onAppLaunch,
  availableApps,
  username,
  role,
  onLogout,
  onToggleDarkMode,
  darkMode,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        'flex flex-col border-r border-chatbox-border-primary bg-chatbox-background-primary transition-all duration-200',
        collapsed ? 'w-0 overflow-hidden' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-chatbox-border-primary px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-chatbox-tint-primary">ChatBridge</span>
        </div>
        <div className="flex items-center gap-1">
          {onToggleDarkMode && (
            <button
              onClick={onToggleDarkMode}
              className="rounded p-1 text-chatbox-tint-tertiary hover:bg-chatbox-background-secondary"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>
          )}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="rounded p-1 text-chatbox-tint-tertiary hover:bg-chatbox-background-secondary"
              aria-label="Collapse sidebar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 19l-7-7 7-7M18 19l-7-7 7-7"/></svg>
            </button>
          )}
        </div>
      </div>

      {/* New Chat button */}
      <div className="px-3 pt-3 pb-1">
        <button
          onClick={onNewConversation}
          className="flex w-full items-center gap-2 rounded-md bg-chatbox-background-brand-primary px-3 py-2 text-sm font-medium text-chatbox-tint-white hover:bg-chatbox-background-brand-primary-hover transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
          New Chat
        </button>
      </div>

      {/* Apps section */}
      {availableApps.length > 0 && (
        <div className="px-3 pt-3">
          <h3 className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Apps</h3>
          <div className="flex flex-wrap gap-1.5">
            {availableApps.map(app => {
              const display = APP_DISPLAY[app.app_id]
              if (!display) return null
              return (
                <button
                  key={app.app_id}
                  onClick={() => onAppLaunch(app.app_id)}
                  className="flex items-center gap-1 rounded-md border border-chatbox-border-primary bg-chatbox-background-primary px-2 py-1 text-xs text-chatbox-tint-secondary hover:border-chatbox-border-brand hover:bg-chatbox-background-brand-secondary transition-colors"
                  title={display.label}
                >
                  <span>{display.emoji}</span>
                  <span className="max-w-[5rem] truncate">{display.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Conversation list */}
      <div className="px-3 pt-3">
        <h3 className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Chat</h3>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-2" aria-label="Conversations">
        {conversations.length === 0 ? (
          <p className="px-1 py-4 text-center text-xs text-chatbox-tint-tertiary">No conversations yet</p>
        ) : (
          conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              className={cn(
                'mb-0.5 w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
                activeConversation === conv.id
                  ? 'bg-chatbox-background-brand-secondary text-chatbox-tint-brand font-medium'
                  : 'text-chatbox-tint-secondary hover:bg-chatbox-background-secondary'
              )}
            >
              <span className="block truncate">{conv.title || 'New conversation'}</span>
            </button>
          ))
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-chatbox-border-primary px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* User avatar */}
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-chatbox-background-brand-primary text-xs font-medium text-chatbox-tint-white">
              {username.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-chatbox-tint-primary">{username}</span>
              {role && (
                <span className="text-[10px] text-chatbox-tint-tertiary capitalize">{role}</span>
              )}
            </div>
          </div>
          <button
            onClick={onLogout}
            className="rounded px-2 py-0.5 text-xs text-chatbox-tint-error hover:bg-chatbox-background-error-secondary transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  )
}
