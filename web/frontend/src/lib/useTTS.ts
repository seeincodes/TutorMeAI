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

export function useTTS(defaultOn = false) {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

  const [autoRead, setAutoReadState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_AUTOREAD)
    if (stored !== null) return supported && stored === 'true'
    return supported && defaultOn
  })
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
    const utterance = new window.SpeechSynthesisUtterance(text)
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
