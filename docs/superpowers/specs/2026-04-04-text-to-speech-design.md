# Text-to-Speech for K-12 Accessibility

**Date:** 2026-04-04
**Status:** Draft
**Scope:** Frontend-only (no backend changes)

## Purpose

Add text-to-speech to ChatBridge so K-2 students and kids with accessibility needs can hear assistant responses read aloud. Sentence-by-sentence reading during streaming for responsive feel.

## Architecture

### New Hook: `useTTS` (`web/frontend/src/lib/useTTS.ts`)

Single hook owns all `window.speechSynthesis` logic.

**Exports:**
- `speakText(text: string)` — read full text (for per-message replay)
- `speakSentence(sentence: string)` — queue one sentence (for streaming)
- `stop()` — cancel all queued speech
- `isSpeaking: boolean` — currently reading
- `autoRead: boolean` — auto-read toggle state
- `setAutoRead(on: boolean)` — toggle auto-read
- `speed: 'slow' | 'regular'` — current speed preset
- `setSpeed(speed: 'slow' | 'regular')` — switch speed

**Persistence (localStorage):**
- `chatbridge-tts-autoread` — auto-read on/off
- `chatbridge-tts-speed` — speed preset

### Speed Presets

| Preset | Rate | Pitch | Sentence Gap |
|--------|------|-------|-------------|
| K-2 (slow) | 0.85 | 1.05 | 300ms |
| Regular | 1.0 | 1.0 | 150ms |

### Voice Selection

Prefer voices in this order:
1. "Google US English" (Chrome)
2. "Samantha" (macOS/iOS)
3. Any English voice
4. System default

## Sentence-by-Sentence Streaming

In `ChatPage.tsx`, as SSE tokens arrive:

1. Buffer tokens into accumulator string
2. Detect sentence boundaries: `.` `!` `?` followed by space or end of stream
3. When sentence complete and `autoRead` is on, call `speakSentence(sentence)`
4. `speechSynthesis` queues utterances — plays in order without overlap
5. On stream done, flush remaining partial sentence
6. Between sentences, 300ms (slow) or 150ms (regular) gap via `onend` delay

Safety valve: split sentences longer than 200 characters.

## Content Stripping

Before speaking, strip:
- Markdown formatting (`**bold**`, `_italic_`, `#` headers, `---`, etc.)
- Code blocks (``` fenced blocks and inline `code`)
- LaTeX notation (`$...$`, `$$...$$`)
- `[APP_BUTTONS]...[/APP_BUTTONS]` tags
- HTML tags if any

Read only plain text content.

## UI Controls

### 1. Global Auto-Read Toggle

**Location:** Chat header, next to existing mute/unmute sound button.

- Speaker icon with sound waves (on) / slashed speaker (off)
- Tooltip: "Read aloud"
- Clicking toggles `autoRead` state

### 2. Speed Toggle

**Location:** Next to auto-read toggle.

- Button showing "Slow" or "Fast" label
- Toggles between K-2 and Regular presets
- Always visible (speed preference useful even when triggering per-message reads)

### 3. Per-Message Speaker Icon

**Location:** Bottom-right corner of each assistant message in `ChatMessage.tsx`.

- Small speaker button — tap to read that specific message
- Shows stop icon if that message is currently being read
- Only on assistant messages, not user messages

## Edge Cases

- **Navigation away:** `stop()` on conversation switch or page navigation
- **New message while reading:** stop current, start new response
- **Code blocks:** stripped, not read aloud
- **LaTeX/math:** stripped, read surrounding plain text
- **App buttons:** skip entirely
- **Empty after stripping:** skip silently
- **Browser no support:** hide all TTS controls if `window.speechSynthesis` is undefined
- **Long messages:** sentence splitting + 200 char safety split prevents utterance issues

## Files to Create/Modify

### New Files
- `web/frontend/src/lib/useTTS.ts` — TTS hook
- `web/frontend/src/lib/ttsUtils.ts` — content stripping, sentence detection utilities

### Modified Files
- `web/frontend/src/components/ChatMessage.tsx` — add per-message speaker icon
- `web/frontend/src/pages/ChatPage.tsx` — integrate `useTTS`, sentence buffering during streaming, global controls in header

## Future Upgrade Path

Browser `speechSynthesis` is phase 1. If voice quality insufficient:
- Add `/api/tts` backend endpoint calling OpenAI TTS or ElevenLabs
- Frontend swaps `speechSynthesis.speak()` for audio fetch + playback
- Browser TTS becomes fallback for API failure or offline use
- No UI changes needed — same controls, different voice source

## Testing

- Verify auto-read reads streaming messages sentence by sentence
- Verify per-message button reads completed messages
- Verify speed toggle changes pacing
- Verify code blocks, LaTeX, app buttons stripped from speech
- Verify stop on navigation and new message
- Verify controls hidden when speechSynthesis unavailable
- Verify localStorage persistence across page reloads
