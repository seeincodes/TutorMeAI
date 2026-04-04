/**
 * Shared app display configuration.
 *
 * Single source of truth for app labels, emoji, sort order, and prompts.
 * Order here determines display order in the sidebar and welcome screen.
 */

export interface AppDisplay {
  label: string
  shortLabel: string
  emoji: string
  prompt: string
}

/** Ordered list — this determines display order everywhere. */
export const APP_ORDER = [
  'chess',
  'calculator',
  'dictionary',
  'flashcards',
  'weather',
  'life-skills',
] as const

export const APP_DISPLAY: Record<string, AppDisplay> = {
  chess:              { label: 'Chess',                  shortLabel: 'Chess',       emoji: '♟️', prompt: "Let's play chess" },
  calculator:         { label: 'Math Helper',            shortLabel: 'Math',        emoji: '🧮', prompt: 'I want to use the calculator' },
  dictionary:         { label: 'Reading & Vocabulary',   shortLabel: 'Vocab',       emoji: '📖', prompt: 'I want to look up a word' },
  flashcards:         { label: 'Flashcards',             shortLabel: 'Flashcards',  emoji: '🗂️', prompt: 'I want to study with flashcards' },
  weather:            { label: 'Weather',                shortLabel: 'Weather',     emoji: '🌤️', prompt: 'Open the weather app' },
  'life-skills':      { label: 'Level Up Life',          shortLabel: 'Life Skills', emoji: '🎮', prompt: 'I want to play Level Up Life' },
}

/** Sort apps by the canonical order. Unknown apps go to the end. */
export function sortApps<T extends { app_id: string }>(apps: T[]): T[] {
  return [...apps].sort((a, b) => {
    const ai = APP_ORDER.indexOf(a.app_id as typeof APP_ORDER[number])
    const bi = APP_ORDER.indexOf(b.app_id as typeof APP_ORDER[number])
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
  })
}
