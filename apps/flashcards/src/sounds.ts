/**
 * Sound effects for the flashcards app using Web Audio API.
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
  } catch {
    // AudioContext not available
  }
}

/** Happy ding for correct answer */
export function playCorrect() {
  playTone(523, 0.1, 0.3, 'sine')     // C5
  setTimeout(() => playTone(659, 0.12, 0.3, 'sine'), 80)  // E5
  setTimeout(() => playTone(784, 0.15, 0.25, 'sine'), 160) // G5
}

/** Soft buzz for wrong answer */
export function playWrong() {
  playTone(250, 0.12, 0.2, 'triangle')
  setTimeout(() => playTone(220, 0.15, 0.18, 'triangle'), 100)
}

/** Quick flip sound when revealing answer */
export function playFlip() {
  playTone(600, 0.04, 0.2, 'triangle')
  setTimeout(() => playTone(900, 0.04, 0.15, 'triangle'), 30)
}

/** Celebration for quiz complete with good score */
export function playCelebration() {
  playTone(523, 0.15, 0.3, 'sine')     // C5
  setTimeout(() => playTone(659, 0.15, 0.3, 'sine'), 120)  // E5
  setTimeout(() => playTone(784, 0.15, 0.3, 'sine'), 240)  // G5
  setTimeout(() => playTone(1047, 0.3, 0.25, 'sine'), 360) // C6
}

/** Neutral complete sound for lower scores */
export function playComplete() {
  playTone(440, 0.15, 0.25, 'sine')
  setTimeout(() => playTone(523, 0.2, 0.2, 'sine'), 120)
}

/** Click sound for selecting category/level */
export function playSelect() {
  playTone(700, 0.05, 0.2, 'triangle')
}
