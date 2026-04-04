/**
 * Lightweight sound effects for chat interactions.
 * Uses the Web Audio API to generate simple tones — no audio files needed.
 * Mute state persisted in localStorage.
 */
import { useState, useCallback, useRef, useEffect } from 'react'

const STORAGE_KEY = 'chatbridge-sound-muted'

function playTone(frequency: number, duration: number, volume: number, type: OscillatorType = 'sine') {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.value = frequency
    gain.gain.value = volume
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + duration)
    // Clean up after playback
    setTimeout(() => ctx.close(), (duration + 0.1) * 1000)
  } catch {
    // AudioContext not available (e.g., autoplay policy)
  }
}

export function useSounds() {
  const [muted, setMuted] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true')
  const mutedRef = useRef(muted)

  useEffect(() => {
    mutedRef.current = muted
    localStorage.setItem(STORAGE_KEY, String(muted))
  }, [muted])

  const toggleMute = useCallback(() => setMuted(m => !m), [])

  const playMessageSent = useCallback(() => {
    if (mutedRef.current) return
    // Quick ascending "whoosh" — two short tones
    playTone(440, 0.12, 0.35, 'sine')
    setTimeout(() => playTone(587, 0.12, 0.3, 'sine'), 60)
  }, [])

  const playMessageReceived = useCallback(() => {
    if (mutedRef.current) return
    // Soft descending "pop" — friendly notification
    playTone(587, 0.15, 0.3, 'sine')
    setTimeout(() => playTone(440, 0.15, 0.25, 'sine'), 80)
  }, [])

  const playAppLaunch = useCallback(() => {
    if (mutedRef.current) return
    // Three-note ascending chime
    playTone(523, 0.15, 0.3, 'sine')     // C5
    setTimeout(() => playTone(659, 0.15, 0.3, 'sine'), 100)  // E5
    setTimeout(() => playTone(784, 0.2, 0.25, 'sine'), 200)  // G5
  }, [])

  return { muted, toggleMute, playMessageSent, playMessageReceived, playAppLaunch }
}
