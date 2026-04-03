import { useRef, useCallback, useEffect, useState } from 'react'

interface StockfishConfig {
  skillLevel: number
  depth: number
  moveTime: number
}

const STOCKFISH_PATH = import.meta.env.BASE_URL + 'stockfish/stockfish-18-single.js'

export function useStockfish() {
  const workerRef = useRef<Worker | null>(null)
  const resolveRef = useRef<((move: string) => void) | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const worker = new Worker(STOCKFISH_PATH)
    workerRef.current = worker

    worker.onmessage = (e: MessageEvent) => {
      const line = typeof e.data === 'string' ? e.data : ''
      if (line === 'uciok') {
        setReady(true)
      }
      if (line.startsWith('bestmove')) {
        const move = line.split(' ')[1]
        if (resolveRef.current) {
          resolveRef.current(move)
          resolveRef.current = null
        }
      }
    }

    worker.postMessage('uci')

    return () => {
      worker.terminate()
      workerRef.current = null
    }
  }, [])

  const sendCommand = useCallback((cmd: string) => {
    workerRef.current?.postMessage(cmd)
  }, [])

  const getBestMove = useCallback((fen: string, config: StockfishConfig): Promise<string> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve
      sendCommand(`setoption name Skill Level value ${config.skillLevel}`)
      sendCommand('isready')
      sendCommand(`position fen ${fen}`)
      sendCommand(`go depth ${config.depth} movetime ${config.moveTime}`)
    })
  }, [sendCommand])

  const newGame = useCallback(() => {
    sendCommand('ucinewgame')
    sendCommand('isready')
  }, [sendCommand])

  return { ready, getBestMove, newGame }
}
