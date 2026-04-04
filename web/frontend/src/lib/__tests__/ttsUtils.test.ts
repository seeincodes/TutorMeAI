import { describe, it, expect } from 'vitest'
import { stripForSpeech, extractSentences } from '../ttsUtils'

describe('stripForSpeech', () => {
  it('returns plain text unchanged', () => {
    expect(stripForSpeech('Hello world.')).toBe('Hello world.')
  })

  it('strips bold and italic markdown', () => {
    expect(stripForSpeech('This is **bold** and _italic_ text.')).toBe('This is bold and italic text.')
  })

  it('strips fenced code blocks', () => {
    expect(stripForSpeech('Before.\n```js\nconsole.log("hi")\n```\nAfter.')).toBe('Before.\n\nAfter.')
  })

  it('strips inline code', () => {
    expect(stripForSpeech('Use `npm install` to install.')).toBe('Use npm install to install.')
  })

  it('strips LaTeX notation', () => {
    expect(stripForSpeech('The formula $E=mc^2$ is famous.')).toBe('The formula  is famous.')
  })

  it('strips display LaTeX', () => {
    expect(stripForSpeech('Result:\n$$x = 5$$\nDone.')).toBe('Result:\n\nDone.')
  })

  it('strips APP_BUTTONS tags', () => {
    expect(stripForSpeech('Try this!\n[APP_BUTTONS]chess,calculator[/APP_BUTTONS]')).toBe('Try this!')
  })

  it('strips markdown headings', () => {
    expect(stripForSpeech('## Title\nContent.')).toBe('Title\nContent.')
  })

  it('strips markdown links keeping text', () => {
    expect(stripForSpeech('Visit [Google](https://google.com) today.')).toBe('Visit Google today.')
  })

  it('strips horizontal rules', () => {
    expect(stripForSpeech('Above.\n---\nBelow.')).toBe('Above.\n\nBelow.')
  })

  it('returns empty string for empty input', () => {
    expect(stripForSpeech('')).toBe('')
  })
})

describe('extractSentences', () => {
  it('extracts complete sentences', () => {
    expect(extractSentences('Hello world. How are you? Fine!')).toEqual({
      sentences: ['Hello world.', 'How are you?', 'Fine!'],
      remainder: '',
    })
  })

  it('returns incomplete text as remainder', () => {
    expect(extractSentences('Hello world. Working on')).toEqual({
      sentences: ['Hello world.'],
      remainder: 'Working on',
    })
  })

  it('handles no complete sentences', () => {
    expect(extractSentences('Still typing')).toEqual({
      sentences: [],
      remainder: 'Still typing',
    })
  })

  it('handles empty string', () => {
    expect(extractSentences('')).toEqual({
      sentences: [],
      remainder: '',
    })
  })

  it('handles multiple punctuation marks', () => {
    expect(extractSentences('Wow!! Really?? Yes.')).toEqual({
      sentences: ['Wow!!', 'Really??', 'Yes.'],
      remainder: '',
    })
  })

  it('does not split on abbreviations like Mr. or Dr.', () => {
    expect(extractSentences('Mr. Smith is here. Hello.')).toEqual({
      sentences: ['Mr. Smith is here.', 'Hello.'],
      remainder: '',
    })
  })

  it('splits long text at 200 chars if no sentence boundary', () => {
    const longText = 'A'.repeat(210)
    const result = extractSentences(longText)
    expect(result.sentences.length).toBe(1)
    expect(result.sentences[0].length).toBe(200)
    expect(result.remainder.length).toBe(10)
  })
})
