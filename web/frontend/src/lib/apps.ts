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
  'counting-game',
  'abc-letters',
  'shapes',
  'animals',
  'chess',
  'calculator',
  'dictionary',
  'flashcards',
  'weather',
  'life-skills',
  'nasa',
  'books',
  'spotify',
  'omma-3d-studio',
] as const

export const APP_DISPLAY: Record<string, AppDisplay> = {
  'counting-game':    { label: 'Counting Game',          shortLabel: 'Counting',    emoji: '🔢', prompt: "Let's play the counting game" },
  'abc-letters':      { label: 'ABC Letters',            shortLabel: 'ABC',         emoji: '🔤', prompt: "Let's learn letters" },
  shapes:             { label: 'Shapes & Colors',        shortLabel: 'Shapes',      emoji: '🔷', prompt: "Let's learn shapes" },
  animals:            { label: 'Animal Friends',          shortLabel: 'Animals',     emoji: '🐾', prompt: "Let's learn about animals" },
  chess:              { label: 'Chess',                  shortLabel: 'Chess',       emoji: '♟️', prompt: "Let's play chess" },
  calculator:         { label: 'Math Helper',            shortLabel: 'Math',        emoji: '🧮', prompt: 'I want to use the calculator' },
  dictionary:         { label: 'Reading & Vocabulary',   shortLabel: 'Vocab',       emoji: '📖', prompt: 'I want to look up a word' },
  flashcards:         { label: 'Flashcards',             shortLabel: 'Flashcards',  emoji: '🗂️', prompt: 'I want to study with flashcards' },
  weather:            { label: 'Weather',                shortLabel: 'Weather',     emoji: '🌤️', prompt: 'Open the weather app' },
  'life-skills':      { label: 'Level Up Life',          shortLabel: 'Life Skills', emoji: '🎮', prompt: 'I want to play Level Up Life' },
  nasa:               { label: 'NASA Space Explorer',    shortLabel: 'NASA',        emoji: '🚀', prompt: 'Show me something from space' },
  books:              { label: 'Book Explorer',          shortLabel: 'Books',       emoji: '📚', prompt: 'I want to find a book to read' },
  spotify:            { label: 'Study Music',            shortLabel: 'Music',       emoji: '🎵', prompt: 'I want to listen to study music' },
  'omma-3d-studio':   { label: '3D Creative Studio',     shortLabel: '3D Studio',   emoji: '🎨', prompt: 'I want to build something in 3D' },
}

/** Sort apps by the canonical order. Unknown apps go to the end. */
export function sortApps<T extends { app_id: string }>(apps: T[]): T[] {
  return [...apps].sort((a, b) => {
    const ai = APP_ORDER.indexOf(a.app_id as typeof APP_ORDER[number])
    const bi = APP_ORDER.indexOf(b.app_id as typeof APP_ORDER[number])
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
  })
}
