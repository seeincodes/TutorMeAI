/**
 * Utility functions imported from the forked Chatbox codebase (src/shared/).
 *
 * These battle-tested utilities handle edge cases (CJK word counting,
 * message role sequencing, safe JSON parsing) that would otherwise need
 * to be reimplemented. By importing directly from src/shared/utils/ we
 * keep behavior consistent across the Electron and web builds.
 *
 * @see src/shared/utils/word_count.ts — CJK-aware word counting
 * @see src/shared/utils/json_utils.ts — Safe JSON parsing
 * @see src/shared/utils/message.ts    — Message text extraction & sequencing
 * @see src/renderer/packages/latex.ts — LaTeX preprocessing for Markdown
 */

// ─── Word counting (CJK-aware) ──────────────────────────────────────────────
export { countWord } from '@chatbox/shared/utils/word_count'

// ─── Safe JSON parsing ──────────────────────────────────────────────────────
export { parseJsonOrEmpty } from '@chatbox/shared/utils/json_utils'

// ─── LaTeX preprocessing for Markdown rendering ─────────────────────────────
export { processLaTeX, escapeBrackets, escapeMhchem } from '@chatbox/renderer/packages/latex'
