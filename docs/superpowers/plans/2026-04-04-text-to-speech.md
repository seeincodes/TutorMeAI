# Text-to-Speech Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add browser-based text-to-speech so K-2 students hear assistant messages read aloud sentence-by-sentence during streaming.

**Architecture:** New `useTTS` hook wraps `window.speechSynthesis`. Utility module `ttsUtils.ts` handles content stripping and sentence detection. ChatPage integrates sentence buffering during streaming. ChatMessage gets per-message speaker button.

**Tech Stack:** Web Speech API (`speechSynthesis`), React hooks, vitest + Testing Library

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `web/frontend/src/lib/ttsUtils.ts` | Pure functions: strip markdown/code/LaTeX, detect sentence boundaries |
| Create | `web/frontend/src/lib/__tests__/ttsUtils.test.ts` | Tests for all stripping and sentence detection |
| Create | `web/frontend/src/lib/useTTS.ts` | React hook wrapping speechSynthesis with queue, speed presets, auto-read |
| Create | `web/frontend/src/lib/__tests__/useTTS.test.ts` | Tests for hook behavior with mocked speechSynthesis |
| Modify | `web/frontend/src/components/ChatMessage.tsx` | Add per-message speaker button for assistant messages |
| Create | `web/frontend/src/components/__tests__/ChatMessage.test.tsx` | Tests for speaker button rendering and click behavior |
| Modify | `web/frontend/src/pages/ChatPage.tsx:1-9,38,241,252,454-461,686-693` | Integrate useTTS, sentence buffering during streaming, global TTS controls |

---

### Task 1: Content Stripping Utilities

**Files:**
- Create: `web/frontend/src/lib/ttsUtils.ts`
- Test: `web/frontend/src/lib/__tests__/ttsUtils.test.ts`

- [ ] **Step 1: Write failing tests for `stripForSpeech`**

```typescript
// web/frontend/src/lib/__tests__/ttsUtils.test.ts
import { describe, it, expect } from 'vitest'
import { stripForSpeech } from '../ttsUtils'

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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd web/frontend && npx vitest run src/lib/__tests__/ttsUtils.test.ts`
Expected: FAIL — module `../ttsUtils` not found

- [ ] **Step 3: Implement `stripForSpeech`**

```typescript
// web/frontend/src/lib/ttsUtils.ts

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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd web/frontend && npx vitest run src/lib/__tests__/ttsUtils.test.ts`
Expected: All 11 tests PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/xian/Gauntlet/week7/TutorMeAI
git add web/frontend/src/lib/ttsUtils.ts web/frontend/src/lib/__tests__/ttsUtils.test.ts
git commit -m "feat(tts): add stripForSpeech utility with tests"
```

---

### Task 2: Sentence Detection Utility

**Files:**
- Modify: `web/frontend/src/lib/ttsUtils.ts`
- Modify: `web/frontend/src/lib/__tests__/ttsUtils.test.ts`

- [ ] **Step 1: Write failing tests for `extractSentences`**

Append to `web/frontend/src/lib/__tests__/ttsUtils.test.ts`:

```typescript
import { stripForSpeech, extractSentences } from '../ttsUtils'

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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd web/frontend && npx vitest run src/lib/__tests__/ttsUtils.test.ts`
Expected: FAIL — `extractSentences` is not exported

- [ ] **Step 3: Implement `extractSentences`**

Add to `web/frontend/src/lib/ttsUtils.ts`:

```typescript
const ABBREVIATIONS = /(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|Ave|vs|etc|approx|dept|est|vol)\.\s/gi

/**
 * Extract complete sentences from streaming text.
 * Returns extracted sentences and any remaining incomplete text.
 */
export function extractSentences(text: string): { sentences: string[]; remainder: string } {
  if (!text) return { sentences: [], remainder: '' }

  const sentences: string[] = []
  let remaining = text

  while (remaining.length > 0) {
    // Find sentence boundary: . ! ? followed by space or end of string
    const match = remaining.match(/[.!?]+(?:\s|$)/)

    if (!match || match.index === undefined) {
      // No sentence boundary found — check for safety split at 200 chars
      if (remaining.length > 200) {
        sentences.push(remaining.slice(0, 200))
        remaining = remaining.slice(200)
        continue
      }
      break
    }

    const endPos = match.index + match[0].length
    const candidate = remaining.slice(0, endPos).trim()

    // Check if this is an abbreviation (not a real sentence end)
    if (ABBREVIATIONS.test(candidate) && candidate.length < 15) {
      // This looks like an abbreviation at the start — skip past it
      const afterAbbr = remaining.indexOf(' ', match.index + 1)
      if (afterAbbr !== -1) {
        remaining = remaining // keep looking — don't extract yet
        // Find next boundary instead
        const next = remaining.slice(endPos).match(/[.!?]+(?:\s|$)/)
        if (!next || next.index === undefined) break
        const nextEnd = endPos + next.index + next[0].length
        sentences.push(remaining.slice(0, nextEnd).trim())
        remaining = remaining.slice(nextEnd)
        continue
      }
    }

    sentences.push(candidate)
    remaining = remaining.slice(endPos)
  }

  return { sentences, remainder: remaining.trim() }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd web/frontend && npx vitest run src/lib/__tests__/ttsUtils.test.ts`
Expected: All 18 tests PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/xian/Gauntlet/week7/TutorMeAI
git add web/frontend/src/lib/ttsUtils.ts web/frontend/src/lib/__tests__/ttsUtils.test.ts
git commit -m "feat(tts): add sentence extraction for streaming TTS"
```

---

### Task 3: useTTS Hook

**Files:**
- Create: `web/frontend/src/lib/useTTS.ts`
- Create: `web/frontend/src/lib/__tests__/useTTS.test.ts`

- [ ] **Step 1: Write failing tests for `useTTS`**

```typescript
// web/frontend/src/lib/__tests__/useTTS.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTTS } from '../useTTS'

// Mock speechSynthesis
const mockCancel = vi.fn()
const mockSpeak = vi.fn()
const mockUtterance = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()

  Object.defineProperty(window, 'speechSynthesis', {
    value: {
      speak: mockSpeak,
      cancel: mockCancel,
      speaking: false,
      getVoices: () => [],
      onvoiceschanged: null,
    },
    writable: true,
    configurable: true,
  })

  // @ts-expect-error — mock constructor
  window.SpeechSynthesisUtterance = mockUtterance.mockImplementation(() => ({
    text: '',
    rate: 1,
    pitch: 1,
    voice: null,
    onend: null,
  }))
})

describe('useTTS', () => {
  it('initializes with autoRead off by default', () => {
    const { result } = renderHook(() => useTTS())
    expect(result.current.autoRead).toBe(false)
  })

  it('persists autoRead to localStorage', () => {
    const { result } = renderHook(() => useTTS())
    act(() => result.current.setAutoRead(true))
    expect(result.current.autoRead).toBe(true)
    expect(localStorage.getItem('chatbridge-tts-autoread')).toBe('true')
  })

  it('reads autoRead from localStorage on init', () => {
    localStorage.setItem('chatbridge-tts-autoread', 'true')
    const { result } = renderHook(() => useTTS())
    expect(result.current.autoRead).toBe(true)
  })

  it('initializes with slow speed by default', () => {
    const { result } = renderHook(() => useTTS())
    expect(result.current.speed).toBe('slow')
  })

  it('persists speed to localStorage', () => {
    const { result } = renderHook(() => useTTS())
    act(() => result.current.setSpeed('regular'))
    expect(result.current.speed).toBe('regular')
    expect(localStorage.getItem('chatbridge-tts-speed')).toBe('regular')
  })

  it('speakText calls speechSynthesis.speak', () => {
    const { result } = renderHook(() => useTTS())
    act(() => result.current.speakText('Hello world'))
    expect(mockCancel).toHaveBeenCalled()
    expect(mockSpeak).toHaveBeenCalled()
  })

  it('stop cancels speechSynthesis', () => {
    const { result } = renderHook(() => useTTS())
    act(() => result.current.stop())
    expect(mockCancel).toHaveBeenCalled()
  })

  it('speakSentence queues utterance', () => {
    const { result } = renderHook(() => useTTS())
    act(() => result.current.speakSentence('First sentence.'))
    expect(mockSpeak).toHaveBeenCalled()
  })

  it('uses slow speed preset values', () => {
    const { result } = renderHook(() => useTTS())
    act(() => result.current.speakText('Hello'))
    const utterance = mockUtterance.mock.results[0].value
    expect(utterance.rate).toBe(0.85)
    expect(utterance.pitch).toBe(1.05)
  })

  it('uses regular speed preset values', () => {
    const { result } = renderHook(() => useTTS())
    act(() => result.current.setSpeed('regular'))
    act(() => result.current.speakText('Hello'))
    const utterance = mockUtterance.mock.results[0].value
    expect(utterance.rate).toBe(1.0)
    expect(utterance.pitch).toBe(1.0)
  })

  it('returns supported false when speechSynthesis unavailable', () => {
    // @ts-expect-error — remove mock
    delete window.speechSynthesis
    const { result } = renderHook(() => useTTS())
    expect(result.current.supported).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd web/frontend && npx vitest run src/lib/__tests__/useTTS.test.ts`
Expected: FAIL — module `../useTTS` not found

- [ ] **Step 3: Implement `useTTS`**

```typescript
// web/frontend/src/lib/useTTS.ts
import { useState, useCallback, useRef, useEffect } from 'react'
import { stripForSpeech } from './ttsUtils'

type Speed = 'slow' | 'regular'

const STORAGE_AUTOREAD = 'chatbridge-tts-autoread'
const STORAGE_SPEED = 'chatbridge-tts-speed'

const SPEED_PRESETS = {
  slow: { rate: 0.85, pitch: 1.05, gap: 300 },
  regular: { rate: 1.0, pitch: 1.0, gap: 150 },
} as const

const PREFERRED_VOICES = ['Google US English', 'Samantha']

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = speechSynthesis.getVoices()
  for (const name of PREFERRED_VOICES) {
    const found = voices.find(v => v.name.includes(name))
    if (found) return found
  }
  const english = voices.find(v => v.lang.startsWith('en'))
  return english || null
}

export function useTTS() {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

  const [autoRead, setAutoReadState] = useState(() =>
    supported && localStorage.getItem(STORAGE_AUTOREAD) === 'true'
  )
  const [speed, setSpeedState] = useState<Speed>(() =>
    (localStorage.getItem(STORAGE_SPEED) as Speed) || 'slow'
  )
  const [isSpeaking, setIsSpeaking] = useState(false)

  const speedRef = useRef(speed)
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null)

  // Load voices (they may arrive async)
  useEffect(() => {
    if (!supported) return
    voiceRef.current = pickVoice()
    const handler = () => { voiceRef.current = pickVoice() }
    speechSynthesis.addEventListener('voiceschanged', handler)
    return () => speechSynthesis.removeEventListener('voiceschanged', handler)
  }, [supported])

  const setAutoRead = useCallback((on: boolean) => {
    setAutoReadState(on)
    localStorage.setItem(STORAGE_AUTOREAD, String(on))
    if (!on && supported) speechSynthesis.cancel()
  }, [supported])

  const setSpeed = useCallback((s: Speed) => {
    setSpeedState(s)
    speedRef.current = s
    localStorage.setItem(STORAGE_SPEED, s)
  }, [])

  useEffect(() => { speedRef.current = speed }, [speed])

  const stop = useCallback(() => {
    if (!supported) return
    speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [supported])

  const speakUtterance = useCallback((text: string, onEnd?: () => void) => {
    if (!supported || !text.trim()) return
    const preset = SPEED_PRESETS[speedRef.current]
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = preset.rate
    utterance.pitch = preset.pitch
    if (voiceRef.current) utterance.voice = voiceRef.current
    utterance.onend = () => {
      setIsSpeaking(speechSynthesis.speaking)
      onEnd?.()
    }
    speechSynthesis.speak(utterance)
    setIsSpeaking(true)
  }, [supported])

  const speakText = useCallback((text: string) => {
    if (!supported) return
    speechSynthesis.cancel()
    const clean = stripForSpeech(text)
    if (!clean) return
    speakUtterance(clean)
  }, [supported, speakUtterance])

  const speakSentence = useCallback((sentence: string) => {
    if (!supported) return
    const clean = stripForSpeech(sentence)
    if (!clean) return
    const preset = SPEED_PRESETS[speedRef.current]
    // Delay for inter-sentence gap
    setTimeout(() => speakUtterance(clean), preset.gap)
  }, [supported, speakUtterance])

  return {
    supported,
    autoRead,
    setAutoRead,
    speed,
    setSpeed,
    isSpeaking,
    speakText,
    speakSentence,
    stop,
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd web/frontend && npx vitest run src/lib/__tests__/useTTS.test.ts`
Expected: All 11 tests PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/xian/Gauntlet/week7/TutorMeAI
git add web/frontend/src/lib/useTTS.ts web/frontend/src/lib/__tests__/useTTS.test.ts
git commit -m "feat(tts): add useTTS hook with speed presets and voice selection"
```

---

### Task 4: Per-Message Speaker Button on ChatMessage

**Files:**
- Modify: `web/frontend/src/components/ChatMessage.tsx`
- Create: `web/frontend/src/components/__tests__/ChatMessage.test.tsx`

- [ ] **Step 1: Write failing tests for speaker button**

```typescript
// web/frontend/src/components/__tests__/ChatMessage.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatMessage from '../ChatMessage'

describe('ChatMessage speaker button', () => {
  it('renders speaker button for assistant messages when onSpeak is provided', () => {
    render(
      <ChatMessage content="Hello there!" role="assistant" onSpeak={vi.fn()} />
    )
    expect(screen.getByRole('button', { name: /read aloud/i })).toBeInTheDocument()
  })

  it('does not render speaker button for user messages', () => {
    render(
      <ChatMessage content="Hello there!" role="user" onSpeak={vi.fn()} />
    )
    expect(screen.queryByRole('button', { name: /read aloud/i })).not.toBeInTheDocument()
  })

  it('does not render speaker button when onSpeak is not provided', () => {
    render(
      <ChatMessage content="Hello there!" role="assistant" />
    )
    expect(screen.queryByRole('button', { name: /read aloud/i })).not.toBeInTheDocument()
  })

  it('calls onSpeak with content when speaker button clicked', async () => {
    const onSpeak = vi.fn()
    render(
      <ChatMessage content="Hello there!" role="assistant" onSpeak={onSpeak} />
    )
    await userEvent.click(screen.getByRole('button', { name: /read aloud/i }))
    expect(onSpeak).toHaveBeenCalledWith('Hello there!')
  })

  it('shows stop icon when isSpeakingThis is true', () => {
    render(
      <ChatMessage content="Hello" role="assistant" onSpeak={vi.fn()} isSpeakingThis={true} />
    )
    expect(screen.getByRole('button', { name: /stop reading/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd web/frontend && npx vitest run src/components/__tests__/ChatMessage.test.tsx`
Expected: FAIL — `onSpeak` not a valid prop

- [ ] **Step 3: Add speaker button to ChatMessage**

Modify `web/frontend/src/components/ChatMessage.tsx`:

Add `onSpeak` and `isSpeakingThis` to the props interface:

```typescript
interface ChatMessageProps {
  content: string
  role: 'user' | 'assistant' | 'tool' | 'system'
  onAppLaunch?: (appId: string) => void
  disabled?: boolean
  showWordCount?: boolean
  onSpeak?: (text: string) => void
  isSpeakingThis?: boolean
}
```

Update the function signature to destructure the new props:

```typescript
export default function ChatMessage({ content, role, onAppLaunch, disabled, showWordCount, onSpeak, isSpeakingThis }: ChatMessageProps) {
```

Add the speaker button at the end of the component, before the final `return <div>{parts}</div>` and the `return <Markdown>{content}</Markdown>` — wrap the assistant return in a fragment with the button:

Replace the final section (lines 85-91) with:

```typescript
  const speakerButton = role === 'assistant' && onSpeak ? (
    <button
      onClick={() => onSpeak(content)}
      className="mt-1 inline-flex items-center gap-1 rounded p-1 text-xs text-chatbox-tint-tertiary hover:text-chatbox-tint-secondary transition-colors"
      aria-label={isSpeakingThis ? 'Stop reading' : 'Read aloud'}
      title={isSpeakingThis ? 'Stop reading' : 'Read aloud'}
    >
      {isSpeakingThis ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
      )}
    </button>
  ) : null

  // No buttons found — render full content as Markdown
  if (parts.length === 0) {
    return (
      <div>
        <Markdown>{content}</Markdown>
        {speakerButton}
      </div>
    )
  }

  return (
    <div>
      {parts}
      {speakerButton}
    </div>
  )
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd web/frontend && npx vitest run src/components/__tests__/ChatMessage.test.tsx`
Expected: All 5 tests PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/xian/Gauntlet/week7/TutorMeAI
git add web/frontend/src/components/ChatMessage.tsx web/frontend/src/components/__tests__/ChatMessage.test.tsx
git commit -m "feat(tts): add per-message speaker button to ChatMessage"
```

---

### Task 5: Integrate useTTS into ChatPage — Global Controls

**Files:**
- Modify: `web/frontend/src/pages/ChatPage.tsx`

- [ ] **Step 1: Add useTTS import and hook call**

At line 9 of `ChatPage.tsx`, add import:

```typescript
import { useTTS } from '@/lib/useTTS'
```

After line 38 (where `useSounds` is called), add:

```typescript
const { supported: ttsSupported, autoRead, setAutoRead, speed, setSpeed, isSpeaking, speakText, speakSentence, stop: stopTTS } = useTTS()
```

- [ ] **Step 2: Add TTS controls next to mute button in Layout 1 (no-app mode)**

In the input bar area (lines 454-461), after the existing mute button and before the `<label>`, add the TTS controls:

```typescript
{ttsSupported && (
  <>
    <button type="button" onClick={() => setAutoRead(!autoRead)}
      title={autoRead ? 'Turn off read aloud' : 'Turn on read aloud'}
      className={`rounded-lg p-2.5 transition-colors ${autoRead ? 'text-chatbox-tint-brand bg-chatbox-background-brand-secondary' : 'text-chatbox-tint-tertiary hover:bg-chatbox-background-secondary'}`}
      aria-label={autoRead ? 'Turn off read aloud' : 'Turn on read aloud'}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 5L6 9H2v6h4l5 4V5z"/>
        {autoRead && <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>}
        {!autoRead && <><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></>}
      </svg>
    </button>
    <button type="button" onClick={() => setSpeed(speed === 'slow' ? 'regular' : 'slow')}
      title={speed === 'slow' ? 'Switch to regular speed' : 'Switch to slow speed'}
      className="rounded-lg px-2 py-1.5 text-xs font-medium text-chatbox-tint-tertiary hover:bg-chatbox-background-secondary transition-colors"
      aria-label={speed === 'slow' ? 'Switch to regular speed' : 'Switch to slow speed'}>
      {speed === 'slow' ? 'Slow' : 'Fast'}
    </button>
  </>
)}
```

- [ ] **Step 3: Add TTS controls in Layout 2 (app mode) header**

In the app mode header (lines 686-693), after the existing mute button, add the same TTS controls:

```typescript
{ttsSupported && (
  <>
    <button onClick={() => setAutoRead(!autoRead)}
      title={autoRead ? 'Turn off read aloud' : 'Turn on read aloud'}
      className={`rounded p-1.5 transition-colors ${autoRead ? 'text-chatbox-tint-brand bg-chatbox-background-brand-secondary' : 'text-chatbox-tint-tertiary hover:bg-chatbox-background-secondary'}`}
      aria-label={autoRead ? 'Turn off read aloud' : 'Turn on read aloud'}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 5L6 9H2v6h4l5 4V5z"/>
        {autoRead && <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>}
        {!autoRead && <><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></>}
      </svg>
    </button>
    <button onClick={() => setSpeed(speed === 'slow' ? 'regular' : 'slow')}
      title={speed === 'slow' ? 'Switch to regular speed' : 'Switch to slow speed'}
      className="rounded px-2 py-1 text-xs font-medium text-chatbox-tint-tertiary hover:bg-chatbox-background-secondary transition-colors"
      aria-label={speed === 'slow' ? 'Switch to regular speed' : 'Switch to slow speed'}>
      {speed === 'slow' ? 'Slow' : 'Fast'}
    </button>
  </>
)}
```

- [ ] **Step 4: Verify build compiles**

Run: `cd web/frontend && npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 5: Commit**

```bash
cd /Users/xian/Gauntlet/week7/TutorMeAI
git add web/frontend/src/pages/ChatPage.tsx
git commit -m "feat(tts): add global TTS controls to ChatPage header"
```

---

### Task 6: Sentence-by-Sentence Streaming Integration

**Files:**
- Modify: `web/frontend/src/pages/ChatPage.tsx`

- [ ] **Step 1: Add sentence buffer ref and import**

At the top of `ChatPage.tsx`, add import:

```typescript
import { extractSentences } from '@/lib/ttsUtils'
```

Inside the `ChatPage` component, after the `useTTS` hook call, add:

```typescript
const sentenceBufferRef = useRef('')
```

- [ ] **Step 2: Add sentence detection to token callback**

Replace the token callback at line 241:

```typescript
(token) => setStreamingContent(prev => prev + token),
```

With:

```typescript
(token) => {
  setStreamingContent(prev => prev + token)
  if (autoRead) {
    sentenceBufferRef.current += token
    const { sentences, remainder } = extractSentences(sentenceBufferRef.current)
    sentenceBufferRef.current = remainder
    sentences.forEach(s => speakSentence(s))
  }
},
```

- [ ] **Step 3: Flush buffer on stream completion**

In the completion callback (around line 242-253), add buffer flush before the existing code:

```typescript
(messageId) => {
  // Flush remaining TTS buffer
  if (autoRead && sentenceBufferRef.current.trim()) {
    speakSentence(sentenceBufferRef.current.trim())
    sentenceBufferRef.current = ''
  }
  setStreamingContent(prev => {
    // ... existing code unchanged
  })
},
```

- [ ] **Step 4: Stop TTS on navigation and new message**

Add to the `handleSend` function, right before `setStreaming(true)` (line 231):

```typescript
stopTTS()
sentenceBufferRef.current = ''
```

Add a cleanup effect after the existing `useEffect` hooks:

```typescript
// Stop TTS when switching conversations
useEffect(() => {
  stopTTS()
  sentenceBufferRef.current = ''
}, [activeConversation, stopTTS])
```

- [ ] **Step 5: Pass onSpeak to ChatMessage components**

In Layout 1 message rendering (line 401), update the `ChatMessage`:

```typescript
<ChatMessage content={msg.content || ''} role={msg.role} onAppLaunch={handleAppLaunch} disabled={streaming}
  onSpeak={ttsSupported ? speakText : undefined} />
```

In Layout 2 (app mode) message rendering (line 603), same update:

```typescript
<ChatMessage content={msg.content || ''} role={msg.role} onAppLaunch={handleAppLaunch} disabled={streaming}
  onSpeak={ttsSupported ? speakText : undefined} />
```

- [ ] **Step 6: Verify build compiles**

Run: `cd web/frontend && npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 7: Commit**

```bash
cd /Users/xian/Gauntlet/week7/TutorMeAI
git add web/frontend/src/pages/ChatPage.tsx
git commit -m "feat(tts): integrate sentence-by-sentence streaming and per-message read"
```

---

### Task 7: Run All Tests and Final Verification

**Files:**
- All test files created/modified above

- [ ] **Step 1: Run full test suite**

Run: `cd web/frontend && npx vitest run`
Expected: All tests PASS (ttsUtils, useTTS, ChatMessage, plus existing tests)

- [ ] **Step 2: Run type check**

Run: `cd web/frontend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Run build**

Run: `cd web/frontend && npm run build`
Expected: Build succeeds

- [ ] **Step 4: Commit any fixes if needed, then final commit**

```bash
cd /Users/xian/Gauntlet/week7/TutorMeAI
git add -A
git commit -m "feat(tts): text-to-speech for K-12 accessibility — complete"
```
