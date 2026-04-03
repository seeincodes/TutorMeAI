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
import { APP_DISPLAY, sortApps } from '@/lib/apps'
import type { Conversation, AppInfo } from '@/lib/api'

const MAX_VISIBLE_APPS = 4

interface SidebarProps {
  conversations: Conversation[]
  activeConversation: string | null
  onSelectConversation: (id: string) => void
  onNewConversation: () => void
  onToggleStar: (id: string, starred: boolean) => void
  onRename: (id: string, title: string) => void
  onCopy: (id: string) => void
  onDelete: (id: string) => void
  onAppLaunch: (appId: string) => void
  availableApps: AppInfo[]
  username: string
  role?: string
  onLogout: () => void
  onNavigate?: (path: string) => void
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
  onRename,
  onCopy,
  onDelete,
  onAppLaunch,
  availableApps,
  username,
  role,
  onLogout,
  onNavigate,
  onToggleDarkMode,
  darkMode,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  const [search, setSearch] = useState('')

  const filteredConversations = search.trim()
    ? conversations.filter(c =>
        (c.title || '').toLowerCase().includes(search.toLowerCase())
      )
    : conversations

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

      {/* Apps section — students only */}
      {role === 'student' && availableApps.length > 0 && (
        <AppsSection apps={availableApps} onAppLaunch={onAppLaunch} />
      )}

      {/* Search + Conversation list */}
      <div className="px-3 pt-3">
        <div className="relative mb-2">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-chatbox-tint-tertiary" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search chats..."
            className="w-full rounded-md border border-chatbox-border-primary bg-chatbox-background-secondary py-1.5 pl-8 pr-3 text-xs text-chatbox-tint-primary placeholder:text-chatbox-tint-placeholder focus:border-chatbox-border-brand focus:bg-chatbox-background-primary focus:outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-chatbox-tint-tertiary hover:text-chatbox-tint-primary"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          )}
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-2" aria-label="Conversations">
        {filteredConversations.length === 0 ? (
          <p className="px-1 py-4 text-center text-xs text-chatbox-tint-tertiary">
            {search ? 'No matching chats' : 'No conversations yet'}
          </p>
        ) : (
          [...filteredConversations]
            .sort((a, b) => {
              if (a.starred && !b.starred) return -1
              if (!a.starred && b.starred) return 1
              return 0
            })
            .map(conv => (
            <div
              key={conv.id}
              className={cn(
                'group/conv mb-0.5 flex items-center gap-2.5 rounded-sm px-xs py-2.5 cursor-pointer transition-colors',
                activeConversation === conv.id
                  ? 'bg-chatbox-background-brand-secondary'
                  : 'hover:bg-chatbox-background-secondary'
              )}
              onClick={() => onSelectConversation(conv.id)}
            >
              {/* Avatar — shows app emoji if conversation has an active app, chat bubble otherwise */}
              <div className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center text-sm leading-none',
                !conv.active_app_id && (activeConversation === conv.id ? 'text-chatbox-tint-brand' : 'text-chatbox-tint-tertiary')
              )}>
                {conv.active_app_id && APP_DISPLAY[conv.active_app_id] ? (
                  <span>{APP_DISPLAY[conv.active_app_id].emoji}</span>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                )}
              </div>
              <div className="flex flex-1 flex-col overflow-hidden">
                <span className={cn(
                  'truncate text-sm',
                  activeConversation === conv.id
                    ? 'text-chatbox-tint-brand font-medium'
                    : 'text-chatbox-tint-primary'
                )}>
                  {conv.title || 'New conversation'}
                </span>
                <span className="text-[11px] text-chatbox-tint-tertiary">
                  {formatRelativeTime(conv.updated_at)}
                </span>
              </div>
              <ConversationActions
                conversationId={conv.id}
                title={conv.title || 'New conversation'}
                starred={conv.starred}
                onToggleStar={onToggleStar}
                onRename={onRename}
                onCopy={onCopy}
                onDelete={onDelete}
              />
            </div>
          ))
        )}
      </nav>

      {/* Bottom nav — only renders for teacher/admin */}
      {(role === 'teacher' || role === 'admin') && onNavigate && (
      <div className="border-t border-chatbox-border-primary px-3 py-2 space-y-0.5">
        <button
          onClick={() => onNavigate('/dashboard')}
          className="flex w-full items-center gap-2.5 rounded-md bg-chatbox-background-brand-secondary px-2.5 py-2.5 text-sm font-medium text-chatbox-tint-brand hover:bg-chatbox-background-brand-primary hover:text-chatbox-tint-white transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          Dashboard
        </button>
      </div>
      )}

      {/* User footer */}
      <div className="border-t border-chatbox-border-primary px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
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

/** Menu item row matching Mantine Menu.Item visual style */
function MenuItem({
  icon,
  label,
  color = 'text-chatbox-tint-primary',
  onClick,
}: {
  icon: React.ReactNode
  label: string
  color?: string
  onClick: (e: React.MouseEvent) => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-sm px-3 py-[7px] text-[13px] transition-colors hover:bg-chatbox-background-secondary',
        color
      )}
    >
      <span className="flex h-[14px] w-[14px] shrink-0 items-center justify-center">{icon}</span>
      {label}
    </button>
  )
}

function ConversationActions({
  conversationId,
  title,
  starred,
  onToggleStar,
  onRename,
  onCopy,
  onDelete,
}: {
  conversationId: string
  title: string
  starred: boolean
  onToggleStar: (id: string, starred: boolean) => void
  onRename: (id: string, title: string) => void
  onCopy: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(title)
  const menuRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      const inTrigger = menuRef.current?.contains(target)
      const inDropdown = dropdownRef.current?.contains(target)
      if (!inTrigger && !inDropdown) {
        setMenuOpen(false)
        setConfirmDelete(false)
        setRenaming(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  // Reset confirm state after 5s (matches chatbox DoubleCheckMenuItem timeout)
  useEffect(() => {
    if (!confirmDelete) return
    const tid = setTimeout(() => setConfirmDelete(false), 5000)
    return () => clearTimeout(tid)
  }, [confirmDelete])

  // Focus rename input when entering rename mode
  useEffect(() => {
    if (renaming) renameInputRef.current?.focus()
  }, [renaming])

  return (
    <div className="relative shrink-0" ref={menuRef}>
      {/* Trigger: filled star if starred, dots (⋯) if not — matches chatbox SessionItem */}
      <button
        ref={triggerRef}
        onClick={(e) => {
          e.stopPropagation()
          if (!menuOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect()
            setMenuPos({ top: rect.bottom + 4, left: Math.max(4, rect.right - 160) })
          }
          setMenuOpen(m => !m)
          setConfirmDelete(false)
          setRenaming(false)
        }}
        className={cn(
          'rounded p-0.5 transition-colors',
          starred
            ? 'text-chatbox-tint-brand'
            : 'text-chatbox-tint-tertiary opacity-0 group-hover/conv:opacity-100',
          menuOpen && '!opacity-100'
        )}
        aria-label="Conversation actions"
      >
        {starred ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
        )}
      </button>

      {/* Dropdown menu — styled to match Mantine Menu.Dropdown */}
      {menuOpen && (
        <div
          ref={dropdownRef}
          className="fixed z-50 min-w-[150px] rounded-md border border-chatbox-border-primary bg-chatbox-background-primary py-1 shadow-lg"
          style={{ top: menuPos.top, left: menuPos.left }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Rename — inline input when active, menu item otherwise */}
          {renaming ? (
            <form
              className="px-2 py-1"
              onSubmit={(e) => {
                e.preventDefault()
                if (renameValue.trim()) {
                  onRename(conversationId, renameValue.trim())
                }
                setRenaming(false)
                setMenuOpen(false)
              }}
            >
              <input
                ref={renameInputRef}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') { setRenaming(false); setMenuOpen(false) }
                }}
                className="w-full rounded border border-chatbox-border-brand bg-chatbox-background-primary px-2 py-1 text-[13px] text-chatbox-tint-primary outline-none"
              />
            </form>
          ) : (
            <MenuItem
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>}
              label="Edit"
              onClick={() => { setRenameValue(title); setRenaming(true) }}
            />
          )}

          {/* Copy */}
          <MenuItem
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>}
            label="Copy"
            onClick={(e) => {
              e.stopPropagation()
              onCopy(conversationId)
              setMenuOpen(false)
            }}
          />

          {/* Star/Unstar */}
          <MenuItem
            icon={starred ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            )}
            label={starred ? 'Unstar' : 'Star'}
            onClick={(e) => {
              e.stopPropagation()
              onToggleStar(conversationId, !starred)
              setMenuOpen(false)
            }}
          />

          {/* Divider */}
          <div className="mx-2 my-1 border-t border-chatbox-border-primary" />

          {/* Delete with double-check — matches chatbox DoubleCheckMenuItem */}
          <MenuItem
            icon={confirmDelete ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            )}
            label={confirmDelete ? 'Confirm?' : 'Delete'}
            color="text-chatbox-tint-error"
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
          />
        </div>
      )}
    </div>
  )
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function AppsSection({ apps, onAppLaunch }: { apps: AppInfo[]; onAppLaunch: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)

  const displayableApps = sortApps(apps.filter(a => APP_DISPLAY[a.app_id]))
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
              className="flex items-center gap-1.5 rounded-md border border-chatbox-border-primary bg-chatbox-background-primary px-2.5 py-1.5 text-xs text-chatbox-tint-secondary hover:border-chatbox-border-brand hover:bg-chatbox-background-brand-secondary transition-colors"
              title={display.label}
            >
              <span className="text-sm leading-none">{display.emoji}</span>
              <span>{display.shortLabel}</span>
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
