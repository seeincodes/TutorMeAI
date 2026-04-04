const ABBREVIATION_WORDS = new Set([
  'mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr', 'st', 'ave', 'vs', 'etc',
  'approx', 'dept', 'est', 'vol',
])

/**
 * Extract complete sentences from streaming text.
 * Returns extracted sentences and any remaining incomplete text.
 */
export function extractSentences(text: string): { sentences: string[]; remainder: string } {
  if (!text) return { sentences: [], remainder: '' }

  const sentences: string[] = []
  let remaining = text

  while (remaining.length > 0) {
    // Safety split at 200 chars if no sentence boundary found yet
    if (remaining.length > 200) {
      const boundaryMatch = remaining.match(/[.!?]+(?:\s|$)/)
      if (!boundaryMatch || boundaryMatch.index === undefined || boundaryMatch.index >= 200) {
        sentences.push(remaining.slice(0, 200))
        remaining = remaining.slice(200)
        continue
      }
    }

    // Find the next sentence-ending punctuation followed by space or end of string
    const match = remaining.match(/[.!?]+(?:\s|$)/)
    if (!match || match.index === undefined) {
      break
    }

    const endPos = match.index + match[0].length

    // Check if this boundary is a single period (potential abbreviation)
    if (match[0] === '. ' || match[0] === '.') {
      // Get the word immediately before the period
      const beforePeriod = remaining.slice(0, match.index)
      const wordMatch = beforePeriod.match(/(\w+)$/)
      if (wordMatch && ABBREVIATION_WORDS.has(wordMatch[1].toLowerCase())) {
        // This is an abbreviation — skip past it and keep looking
        // Find the next boundary after this one
        const after = remaining.slice(endPos)
        const nextMatch = after.match(/[.!?]+(?:\s|$)/)
        if (!nextMatch || nextMatch.index === undefined) {
          break
        }
        const nextEnd = endPos + nextMatch.index + nextMatch[0].length
        sentences.push(remaining.slice(0, nextEnd).trim())
        remaining = remaining.slice(nextEnd)
        continue
      }
    }

    sentences.push(remaining.slice(0, endPos).trim())
    remaining = remaining.slice(endPos)
  }

  return { sentences, remainder: remaining.trim() }
}

/**
 * Strip markdown, code, LaTeX, and app tags from text for speech synthesis.
 */
export function stripForSpeech(text: string): string {
  if (!text) return ''

  let result = text

  // Strip fenced code blocks
  result = result.replace(/```[\s\S]*?```/g, '')

  // Strip display LaTeX ($$...$$)
  result = result.replace(/\$\$[\s\S]*?\$\$/g, '')

  // Strip APP_BUTTONS tags
  result = result.replace(/\[APP_BUTTONS\][\s\S]*?\[\/APP_BUTTONS\]/g, '')

  // Strip horizontal rules
  result = result.replace(/^-{3,}$/gm, '')

  // Strip inline code
  result = result.replace(/`([^`]*)`/g, '$1')

  // Strip inline LaTeX ($...$)
  result = result.replace(/\$[^$]+\$/g, '')

  // Strip markdown links, keep text
  result = result.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')

  // Strip markdown headings
  result = result.replace(/^#{1,6}\s+/gm, '')

  // Strip bold/italic
  result = result.replace(/\*\*([^*]*)\*\*/g, '$1')
  result = result.replace(/__([^_]*)__/g, '$1')
  result = result.replace(/\*([^*]*)\*/g, '$1')
  result = result.replace(/_([^_]*)_/g, '$1')

  // Clean up extra whitespace/newlines
  result = result.replace(/\n{3,}/g, '\n\n')
  result = result.trim()

  return result
}
