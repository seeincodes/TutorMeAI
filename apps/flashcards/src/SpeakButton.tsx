/**
 * SpeakButton — Text-to-speech button for iframe apps.
 * Kids press to hear content read aloud. Includes speed toggle (Slow/Fast).
 * Uses browser speechSynthesis API — no external dependencies.
 */
import { useState, useCallback, useRef, useEffect } from 'react'

const STORAGE_KEY = 'chatbridge-tts-speed'
type Speed = 'slow' | 'regular'

const PRESETS = {
  slow: { rate: 0.85, pitch: 1.05 },
  regular: { rate: 1.0, pitch: 1.0 },
} as const

// Strip emoji so speechSynthesis doesn't choke
function stripEmoji(str: string): string {
  return str.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').replace(/\s{2,}/g, ' ').trim()
}

const PREFERRED_VOICES = ['Google US English', 'Samantha']

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = speechSynthesis.getVoices()
  for (const name of PREFERRED_VOICES) {
    const found = voices.find(v => v.name.includes(name))
    if (found) return found
  }
  return voices.find(v => v.lang.startsWith('en')) || null
}

// Shared speak function — cancels everything first, speaks one thing
// Module-level lock: tracks which text is currently being auto-spoken
let _autoSpeakingText: string | null = null

function speakText(text: string, speed: Speed, voiceRef: React.RefObject<SpeechSynthesisVoice | null>, isAuto = false) {
  const clean = stripEmoji(text)
  if (!clean) return
  if (isAuto && _autoSpeakingText === clean) return  // already speaking this
  speechSynthesis.cancel()
  window.parent.postMessage({ type: 'tts_stop' }, '*')
  if (isAuto) _autoSpeakingText = clean
  const preset = PRESETS[speed]
  const utterance = new SpeechSynthesisUtterance(clean)
  utterance.rate = preset.rate
  utterance.pitch = preset.pitch
  if (voiceRef.current) utterance.voice = voiceRef.current
  utterance.onend = () => { if (isAuto) _autoSpeakingText = null }
  utterance.onerror = () => { if (isAuto) _autoSpeakingText = null }
  speechSynthesis.speak(utterance)
  return utterance
}

export default function SpeakButton({ text, label = 'Read aloud', autoSpeak = false }: { text: string; label?: string; autoSpeak?: boolean }) {
  const [speaking, setSpeaking] = useState(false)
  const [speed, setSpeed] = useState<Speed>(() =>
    (localStorage.getItem(STORAGE_KEY) as Speed) || 'slow'
  )
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null)
  const lastAutoSpoke = useRef<string>('')

  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

  useEffect(() => {
    if (!supported) return
    voiceRef.current = pickVoice()
    const handler = () => { voiceRef.current = pickVoice() }
    speechSynthesis.addEventListener('voiceschanged', handler)
    return () => speechSynthesis.removeEventListener('voiceschanged', handler)
  }, [supported])

  const handleSpeak = useCallback(() => {
    if (!supported) return
    if (speaking) {
      speechSynthesis.cancel()
      window.parent.postMessage({ type: 'tts_stop' }, '*')
      setSpeaking(false)
      return
    }
    const utterance = speakText(text, speed, voiceRef)
    if (utterance) {
      setSpeaking(true)
      utterance.onend = () => setSpeaking(false)
      utterance.onerror = () => setSpeaking(false)
    }
  }, [supported, text, speed, speaking])

  // Auto-speak: only when text changes to something NEW
  useEffect(() => {
    if (!autoSpeak || !supported) return
    const clean = stripEmoji(text)
    if (!clean || clean === lastAutoSpoke.current) return

    // Listen for tts_unlock OR check if already unlocked via prior click
    const doSpeak = () => {
      if (clean !== stripEmoji(text)) return // text changed while waiting
      lastAutoSpoke.current = clean
      const utterance = speakText(text, speed, voiceRef, true)
      if (utterance) {
        setSpeaking(true)
        utterance.onend = () => { setSpeaking(false); _autoSpeakingText = null }
        utterance.onerror = () => { setSpeaking(false); _autoSpeakingText = null }
      }
    }

    // Try speaking after short delay
    const timer = setTimeout(doSpeak, 200)
    return () => {
      clearTimeout(timer)
      // DON'T release _autoSpeakLock here — it protects against
      // effect re-runs speaking the same text. Only release on utterance end.
      speechSynthesis.cancel()
      setSpeaking(false)
    }
  }, [autoSpeak, supported, text]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSpeed = useCallback(() => {
    const next = speed === 'slow' ? 'regular' : 'slow'
    setSpeed(next)
    localStorage.setItem(STORAGE_KEY, next)
  }, [speed])

  if (!supported) return null

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <button
        onClick={handleSpeak}
        aria-label={speaking ? 'Stop reading' : label}
        title={speaking ? 'Stop reading' : label}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '32px', height: '32px', borderRadius: '50%', border: 'none',
          cursor: 'pointer', fontSize: '16px',
          background: speaking ? '#ef4444' : '#3b82f6', color: '#fff',
          transition: 'background 0.2s',
        }}
      >
        {speaking ? '⏹' : '🔊'}
      </button>
      <button
        onClick={toggleSpeed}
        aria-label={speed === 'slow' ? 'Switch to regular speed' : 'Switch to slow speed'}
        title={speed === 'slow' ? 'Switch to regular speed' : 'Switch to slow speed'}
        style={{
          display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
          borderRadius: '12px', border: '1px solid #d1d5db', background: '#f3f4f6',
          cursor: 'pointer', fontSize: '11px', fontWeight: 600, color: '#6b7280',
          transition: 'background 0.2s',
        }}
      >
        {speed === 'slow' ? '🐢 Slow' : '🐇 Fast'}
      </button>
    </span>
  )
}
