import { type ReactNode } from 'react'
import Markdown from './Markdown'

interface AppDisplay {
  label: string
  emoji: string
}

const APP_DISPLAY: Record<string, AppDisplay> = {
  calculator: { label: 'Math Helper', emoji: '🧮' },
  chess: { label: 'Chess', emoji: '♟️' },
  dictionary: { label: 'Reading & Vocabulary', emoji: '📖' },
  weather: { label: 'Weather', emoji: '🌤️' },
  flashcards: { label: 'Flashcards', emoji: '🗂️' },
  'life-skills': { label: 'Level Up Life', emoji: '🎮' },
  'google-classroom': { label: 'Google Classroom', emoji: '🎓' },
}

const APP_BUTTONS_RE = /\[APP_BUTTONS\](.*?)\[\/APP_BUTTONS\]/g

interface ChatMessageProps {
  content: string
  role: 'user' | 'assistant' | 'tool' | 'system'
  onAppLaunch?: (appId: string) => void
  disabled?: boolean
}

export default function ChatMessage({ content, role, onAppLaunch, disabled }: ChatMessageProps) {
  if (!content) {
    return null
  }

  if (role === 'user') {
    return <p className="whitespace-pre-wrap">{content}</p>
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
      <div key={`apps-${match.index}`} className="my-2 flex flex-wrap gap-2">
        {appIds.map(appId => {
          const display = APP_DISPLAY[appId]
          if (!display) return null
          return (
            <button
              key={appId}
              onClick={() => onAppLaunch?.(appId)}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors disabled:opacity-50"
            >
              <span>{display.emoji}</span>
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
