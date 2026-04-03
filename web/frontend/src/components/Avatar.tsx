/**
 * Avatar components adapted from the forked chatbox codebase
 * (src/renderer/components/common/Avatar.tsx).
 *
 * Simplified: removed Mantine, size variants, custom image support.
 * Uses Tailwind + design tokens.
 */
import { cn } from '@/lib/utils'

interface AvatarProps {
  className?: string
}

export function UserAvatar({ className }: AvatarProps) {
  return (
    <div className={cn(
      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-chatbox-background-brand-primary',
      className
    )}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </div>
  )
}

export function AssistantAvatar({ className }: AvatarProps) {
  return (
    <div className={cn(
      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-chatbox-background-success-primary',
      className
    )}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
        <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
        <path d="M6 10v1a6 6 0 0 0 12 0v-1" />
        <path d="M12 18v4" />
        <path d="M8 22h8" />
      </svg>
    </div>
  )
}
