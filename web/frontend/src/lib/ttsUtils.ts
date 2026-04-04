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
