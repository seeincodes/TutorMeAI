import { type ReactNode, useMemo } from 'react'
import Markdown from './Markdown'
import { APP_DISPLAY } from '@/lib/apps'
import { countWord } from '@/lib/chatbox-utils'

const APP_BUTTONS_RE = /\[APP_BUTTONS\](.*?)\[\/APP_BUTTONS\]/g

interface ChatMessageProps {
  content: string
  role: 'user' | 'assistant' | 'tool' | 'system'
  onAppLaunch?: (appId: string) => void
  disabled?: boolean
  showWordCount?: boolean
}

export default function ChatMessage({ content, role, onAppLaunch, disabled, showWordCount }: ChatMessageProps) {
  // CJK-aware word counting from the Chatbox source (src/shared/utils/word_count.ts)
  const wordCount = useMemo(() => (showWordCount && content ? countWord(content) : null), [showWordCount, content])

  if (!content) {
    return null
  }

  if (role === 'user') {
    return (
      <div>
        <p className="whitespace-pre-wrap">{content}</p>
        {wordCount !== null && wordCount > 0 && (
          <span className="mt-1 block text-xs text-chatbox-tint-tertiary">{wordCount} words</span>
        )}
      </div>
    )
  }

  // Parse content for [APP_BUTTONS]...[/APP_BUTTONS] tags
  const parts: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  const regex = new RegExp(APP_BUTTONS_RE)
  while ((match = regex.exec(content)) !== null) {
    // Text before this match
    if (match.index > lastIndex) {
      parts.push(
        <Markdown key={`text-${lastIndex}`}>
          {content.slice(lastIndex, match.index)}
        </Markdown>
      )
    }

    // Parse app IDs
    const appIds = match[1].split(',').map(id => id.trim()).filter(Boolean)
    parts.push(
      <div key={`apps-${match.index}`} className="my-2 flex flex-wrap gap-1.5">
        {appIds.map(appId => {
          const display = APP_DISPLAY[appId]
          if (!display) return null
          return (
            <button
              key={appId}
              onClick={() => onAppLaunch?.(appId)}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 rounded-lg border border-chatbox-border-primary bg-chatbox-background-primary px-3 py-1.5 text-sm font-medium text-chatbox-tint-secondary shadow-sm transition-colors hover:border-chatbox-border-brand hover:bg-chatbox-background-brand-secondary hover:text-chatbox-tint-brand disabled:opacity-50"
            >
              <span className="text-sm leading-none">{display.emoji}</span>
              <span>{display.label}</span>
            </button>
          )
        })}
      </div>
    )

    lastIndex = match.index + match[0].length
  }

  // Remaining text after last match
  if (lastIndex < content.length) {
    parts.push(
      <Markdown key={`text-${lastIndex}`}>
        {content.slice(lastIndex)}
      </Markdown>
    )
  }

  // No buttons found — render full content as Markdown
  if (parts.length === 0) {
    return <Markdown>{content}</Markdown>
  }

  return <div>{parts}</div>
}
