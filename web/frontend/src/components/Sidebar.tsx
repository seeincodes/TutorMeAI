/**
 * Sidebar component adapted from the forked chatbox codebase
 * (src/renderer/Sidebar.tsx).
 *
 * Simplified for ChatBridge: removed Mantine, TanStack Router, Zustand,
 * i18n, task mode, image generation, copilots. Uses Tailwind + our
 * design tokens. Keeps the visual layout and conversation list pattern.
 */
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import type { Conversation, AppInfo } from '@/lib/api'

const MAX_VISIBLE_APPS = 4

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
  onToggleStar: (id: string, starred: boolean) => void
  onDelete: (id: string) => void
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
  onToggleStar,
  onDelete,
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
        <AppsSection apps={availableApps} onAppLaunch={onAppLaunch} />
      )}

      {/* Conversation list */}
      <div className="px-3 pt-3">
        <h3 className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Chat</h3>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-2" aria-label="Conversations">
        {conversations.length === 0 ? (
          <p className="px-1 py-4 text-center text-xs text-chatbox-tint-tertiary">No conversations yet</p>
        ) : (
          [...conversations]
            .sort((a, b) => {
              if (a.starred && !b.starred) return -1
              if (!a.starred && b.starred) return 1
              return 0
            })
            .map(conv => (
            <div
              key={conv.id}
              className={cn(
                'group/conv mb-0.5 flex items-center rounded-md transition-colors',
                activeConversation === conv.id
                  ? 'bg-chatbox-background-brand-secondary'
                  : 'hover:bg-chatbox-background-secondary'
              )}
            >
              <button
                onClick={() => onSelectConversation(conv.id)}
                className={cn(
                  'flex-1 truncate px-3 py-2 text-left text-sm',
                  activeConversation === conv.id
                    ? 'text-chatbox-tint-brand font-medium'
                    : 'text-chatbox-tint-secondary'
                )}
              >
                {conv.title || 'New conversation'}
              </button>
              <ConversationActions
                conversationId={conv.id}
                starred={conv.starred}
                onToggleStar={onToggleStar}
                onDelete={onDelete}
              />
            </div>
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

function ConversationActions({
  conversationId,
  starred,
  onToggleStar,
  onDelete,
}: {
  conversationId: string
  starred: boolean
  onToggleStar: (id: string, starred: boolean) => void
  onDelete: (id: string) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
        setConfirmDelete(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  // Reset confirm state after 5s (matches chatbox timeout)
  useEffect(() => {
    if (!confirmDelete) return
    const tid = setTimeout(() => setConfirmDelete(false), 5000)
    return () => clearTimeout(tid)
  }, [confirmDelete])

  return (
    <div className="relative shrink-0 mr-1" ref={menuRef}>
      {/* Trigger: filled star if starred, dots if not */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          setMenuOpen(m => !m)
          setConfirmDelete(false)
        }}
        className={cn(
          'rounded p-1 transition-colors',
          starred
            ? 'text-chatbox-tint-brand'
            : 'text-chatbox-tint-tertiary opacity-0 group-hover/conv:opacity-100',
          menuOpen && 'opacity-100'
        )}
        aria-label="Conversation actions"
      >
        {starred ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
        )}
      </button>

      {/* Dropdown menu */}
      {menuOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-md border border-chatbox-border-primary bg-chatbox-background-primary py-1 shadow-lg">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleStar(conversationId, !starred)
              setMenuOpen(false)
            }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-chatbox-tint-secondary hover:bg-chatbox-background-secondary"
          >
            {starred ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            )}
            {starred ? 'Unstar' : 'Star'}
          </button>
          <div className="mx-2 my-1 border-t border-chatbox-border-primary" />
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (confirmDelete) {
                onDelete(conversationId)
                setMenuOpen(false)
                setConfirmDelete(false)
              } else {
                setConfirmDelete(true)
              }
            }}
            className={cn(
              'flex w-full items-center gap-2 px-3 py-1.5 text-xs',
              confirmDelete
                ? 'text-chatbox-tint-error font-medium'
                : 'text-chatbox-tint-error hover:bg-chatbox-background-error-secondary'
            )}
          >
            {confirmDelete ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                Confirm?
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                Delete
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

function AppsSection({ apps, onAppLaunch }: { apps: AppInfo[]; onAppLaunch: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)

  const displayableApps = apps.filter(a => APP_DISPLAY[a.app_id])
  const needsExpand = displayableApps.length > MAX_VISIBLE_APPS
  const visibleApps = expanded ? displayableApps : displayableApps.slice(0, MAX_VISIBLE_APPS)
  const hiddenCount = displayableApps.length - MAX_VISIBLE_APPS

  return (
    <div className="px-3 pt-3">
      <h3 className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Apps</h3>
      <div className="flex flex-wrap gap-1.5">
        {visibleApps.map(app => {
          const display = APP_DISPLAY[app.app_id]!
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
        {needsExpand && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1 rounded-md border border-chatbox-border-primary bg-chatbox-background-secondary px-2 py-1 text-xs text-chatbox-tint-tertiary hover:bg-chatbox-background-secondary-hover transition-colors"
          >
            {expanded ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6"/></svg>
                Less
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                +{hiddenCount} more
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
