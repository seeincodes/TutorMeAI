/**
 * Sound effects for the Reading & Vocabulary app using Web Audio API.
 */

let audioCtx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  return audioCtx
}

function playTone(freq: number, duration: number, volume: number, type: OscillatorType = 'sine') {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    gain.gain.value = volume
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + duration)
  } catch {}
}

/** Correct answer ding */
export function playCorrect() {
  playTone(523, 0.1, 0.3, 'sine')
  setTimeout(() => playTone(659, 0.12, 0.3, 'sine'), 80)
  setTimeout(() => playTone(784, 0.15, 0.25, 'sine'), 160)
}

/** Wrong answer buzz */
export function playWrong() {
  playTone(250, 0.12, 0.2, 'triangle')
  setTimeout(() => playTone(220, 0.15, 0.18, 'triangle'), 100)
}

/** Word saved to vocabulary list */
export function playWordSaved() {
  playTone(880, 0.08, 0.2, 'sine')
  setTimeout(() => playTone(1047, 0.1, 0.15, 'sine'), 60)
}

/** Selection click */
export function playClick() {
  playTone(700, 0.05, 0.2, 'triangle')
}

/** Passage/quiz complete */
export function playCelebration() {
  playTone(523, 0.15, 0.3, 'sine')
  setTimeout(() => playTone(659, 0.15, 0.3, 'sine'), 120)
  setTimeout(() => playTone(784, 0.15, 0.3, 'sine'), 240)
  setTimeout(() => playTone(1047, 0.3, 0.25, 'sine'), 360)
}
