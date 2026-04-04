let audioCtx: AudioContext | null = null
function getCtx(): AudioContext { if (!audioCtx) audioCtx = new AudioContext(); return audioCtx }
function playTone(freq: number, dur: number, vol: number, type: OscillatorType = 'sine') {
  try { const ctx = getCtx(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.type = type; o.frequency.value = freq; g.gain.value = vol; g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur); o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + dur) } catch {}
}
export function playCorrect() { playTone(523, 0.1, 0.3); setTimeout(() => playTone(659, 0.12, 0.3), 80); setTimeout(() => playTone(784, 0.15, 0.25), 160) }
export function playWrong() { playTone(250, 0.12, 0.2, 'triangle'); setTimeout(() => playTone(220, 0.15, 0.18, 'triangle'), 100) }
export function playCelebration() { playTone(523, 0.15, 0.3); setTimeout(() => playTone(659, 0.15, 0.3), 120); setTimeout(() => playTone(784, 0.15, 0.3), 240); setTimeout(() => playTone(1047, 0.3, 0.25), 360) }
export function playPop() { playTone(800, 0.06, 0.25, 'triangle') }
