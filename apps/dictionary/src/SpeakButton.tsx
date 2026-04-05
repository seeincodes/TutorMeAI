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

// Module-level unlock flag — set by clicks, keys, or parent message
let _ttsUnlocked = false
const _unlockListeners: Array<() => void> = []
function markUnlocked() {
  if (_ttsUnlocked) return
  _ttsUnlocked = true
  _unlockListeners.forEach(fn => fn())
}
if (typeof document !== 'undefined') {
  document.addEventListener('click', markUnlocked, { once: false })
  document.addEventListener('keydown', markUnlocked, { once: false })
}
if (typeof window !== 'undefined') {
  window.addEventListener('message', (e) => {
    if (e.data?.type === 'tts_unlock') markUnlocked()
  })
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

export default function SpeakButton({ text, label = 'Read aloud', autoSpeak = false }: { text: string; label?: string; autoSpeak?: boolean }) {
  const [unlocked, setUnlocked] = useState(_ttsUnlocked)
  const [speaking, setSpeaking] = useState(false)
  const [speed, setSpeed] = useState<Speed>(() =>
    (localStorage.getItem(STORAGE_KEY) as Speed) || 'slow'
  )
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null)

  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

  // Subscribe to unlock events so autoSpeak effect re-fires
  useEffect(() => {
    if (unlocked) return
    const handler = () => setUnlocked(true)
    _unlockListeners.push(handler)
    return () => { const idx = _unlockListeners.indexOf(handler); if (idx >= 0) _unlockListeners.splice(idx, 1) }
  }, [unlocked])

  useEffect(() => {
    if (!supported) return
    voiceRef.current = pickVoice()
    const handler = () => { voiceRef.current = pickVoice() }
    speechSynthesis.addEventListener('voiceschanged', handler)
    return () => speechSynthesis.removeEventListener('voiceschanged', handler)
  }, [supported])

  const speak = useCallback(() => {
    const clean = stripEmoji(text)
    if (!supported || !clean) return
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    const preset = PRESETS[speed]
    const utterance = new SpeechSynthesisUtterance(clean)
    utterance.rate = preset.rate
    utterance.pitch = preset.pitch
    if (voiceRef.current) utterance.voice = voiceRef.current
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    speechSynthesis.speak(utterance)
    setSpeaking(true)
  }, [supported, text, speed])

  // Auto-speak when text changes (for K-2 kids who can't read yet)
  useEffect(() => {
    const clean = stripEmoji(text)
    if (!autoSpeak || !supported || !clean || !unlocked) return
    // Small delay — lets browser associate speech with recent user gesture
    const timer = setTimeout(() => {
      const preset = PRESETS[speed]
      const utterance = new SpeechSynthesisUtterance(clean)
      utterance.rate = preset.rate
      utterance.pitch = preset.pitch
      if (voiceRef.current) utterance.voice = voiceRef.current
      utterance.onend = () => setSpeaking(false)
      utterance.onerror = () => setSpeaking(false)
      speechSynthesis.cancel()
      speechSynthesis.speak(utterance)
      setSpeaking(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [autoSpeak, supported, text, unlocked]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSpeed = useCallback(() => {
    const next = speed === 'slow' ? 'regular' : 'slow'
    setSpeed(next)
    localStorage.setItem(STORAGE_KEY, next)
  }, [speed])

  if (!supported) return null

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <button
        onClick={speak}
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
