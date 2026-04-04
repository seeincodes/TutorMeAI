import { useState, useCallback, useEffect } from 'react'
import { Chess, type Square } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { useStockfish } from './useStockfish'

function sendToPlatform(type: string, correlationId: string, data: Record<string, unknown>) {
  window.parent.postMessage({ type, correlationId, data }, '*')
}

type Difficulty = 'explorer' | 'apprentice' | 'challenger' | 'expert'

const DIFFICULTY_CONFIG: Record<Difficulty, {
  label: string; emoji: string; desc: string;
  skillLevel: number; depth: number; moveTime: number; randomChance: number
}> = {
  explorer:   { label: 'Explorer',   emoji: '🌱', desc: 'Learn the pieces — plays silly moves!', skillLevel: 0,  depth: 1,  moveTime: 50,   randomChance: 0.85 },
  apprentice: { label: 'Apprentice', emoji: '⭐', desc: 'Building strategy — makes some mistakes', skillLevel: 2,  depth: 2,  moveTime: 150,  randomChance: 0.40 },
  challenger: { label: 'Challenger', emoji: '🔥', desc: 'Real competition — mostly strong moves',  skillLevel: 10, depth: 10, moveTime: 500,  randomChance: 0.15 },
  expert:     { label: 'Expert',     emoji: '👑', desc: 'Tournament-level play',                   skillLevel: 20, depth: 15, moveTime: 2000, randomChance: 0 },
}

export default function ChessApp() {
  const { ready: stockfishReady, getBestMove, newGame: stockfishNewGame } = useStockfish()
  const [game, setGame] = useState<Chess>(new Chess())
  const [gameStarted, setGameStarted] = useState(false)
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null)
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white')
  const [status, setStatus] = useState('')
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null)
  const [highlightSquares, setHighlightSquares] = useState<Record<string, React.CSSProperties>>({})
  const [thinking, setThinking] = useState(false)
  const [moveHistory, setMoveHistory] = useState<string[]>([])
  const [gameOver, setGameOver] = useState<{ result: 'win' | 'loss' | 'draw'; message: string } | null>(null)

  const updateStatus = useCallback((g: Chess, pColor: string = playerColor) => {
    if (g.isCheckmate()) {
      const loserIsWhite = g.turn() === 'w'
      const playerWon = (pColor === 'white' && !loserIsWhite) || (pColor === 'black' && loserIsWhite)
      if (playerWon) {
        setGameOver({ result: 'win', message: 'Checkmate — You win!' })
      } else {
        setGameOver({ result: 'loss', message: 'Checkmate — You lose!' })
      }
      setStatus('Game over')
      return true
    }
    if (g.isDraw() || g.isStalemate()) {
      setGameOver({ result: 'draw', message: g.isStalemate() ? 'Stalemate — Draw!' : 'Draw!' })
      setStatus('Game over')
      return true
    }
    if (g.isCheck()) {
      setStatus(`${g.turn() === 'w' ? 'White' : 'Black'} is in check!`)
      return false
    }
    setStatus(`${g.turn() === 'w' ? 'White' : 'Black'} to move`)
    return false
  }, [playerColor])

  function startGame(diff: Difficulty) {
    const newGame = new Chess()
    setGame(newGame)
    setDifficulty(diff)
    setGameStarted(true)
    setPlayerColor('white')
    setSelectedSquare(null)
    setHighlightSquares({})
    setMoveHistory([])
    setGameOver(null)
    stockfishNewGame()
    setStatus('Your turn')
    sendToPlatform('state_update', '', {
      type: 'game_start',
      difficulty: diff,
      fen: newGame.fen(),
      playerColor: 'white',
    })
  }

  // AI makes a move after the player
  const playAI = useCallback(async (currentGame: Chess, diff: Difficulty) => {
    if (currentGame.isGameOver()) return

    setThinking(true)
    setStatus('AI is thinking...')

    // Minimum delay so AI moves feel deliberate, not instant
    const minDelay = diff === 'explorer' ? 800 : diff === 'apprentice' ? 600 : 400
    const delayPromise = new Promise(r => setTimeout(r, minDelay))

    try {
      const config = DIFFICULTY_CONFIG[diff]
      const gameCopy = new Chess(currentGame.fen())
      let aiMove

      // At lower difficulties, sometimes pick a random legal move instead of using Stockfish.
      // For explorer mode, actively prefer weak moves: avoid captures, checks, and
      // center control so the player has a real chance to win and learn.
      if (config.randomChance > 0 && Math.random() < config.randomChance) {
        const legalMoves = gameCopy.moves({ verbose: true })
        let candidates = legalMoves

        if (diff === 'explorer') {
          // Prefer non-capturing, non-checking, edge moves (weaker play)
          const quietMoves = legalMoves.filter(m => !m.captured && !m.san.includes('+') && !m.san.includes('#'))
          const edgeMoves = quietMoves.filter(m => {
            const col = m.to[0]
            const row = m.to[1]
            return col === 'a' || col === 'h' || row === '1' || row === '8'
          })
          // Prefer edge moves > quiet moves > any legal move
          candidates = edgeMoves.length > 0 ? edgeMoves : quietMoves.length > 0 ? quietMoves : legalMoves
        }

        aiMove = candidates[Math.floor(Math.random() * candidates.length)]
        await delayPromise
        gameCopy.move(aiMove.san)
      } else {
        const [bestMoveUci] = await Promise.all([
          getBestMove(currentGame.fen(), {
            skillLevel: config.skillLevel,
            depth: config.depth,
            moveTime: config.moveTime,
          }),
          delayPromise,
        ])

        // bestMoveUci is in long algebraic notation e.g. "e2e4" or "e7e8q"
        const from = bestMoveUci.slice(0, 2)
        const to = bestMoveUci.slice(2, 4)
        const promotion = bestMoveUci.length > 4 ? bestMoveUci[4] : undefined
        aiMove = gameCopy.move({ from, to, promotion } as { from: Square; to: Square; promotion?: string })
      }

      if (!aiMove) {
        setThinking(false)
        setStatus('AI error — your turn')
        return
      }

      setMoveHistory(prev => [...prev, currentGame.fen()])
      setGame(gameCopy)
      setThinking(false)

      const isOver = updateStatus(gameCopy)

      sendToPlatform('state_update', '', {
        type: 'ai_move',
        move: aiMove.san,
        from: aiMove.from,
        to: aiMove.to,
        fen: gameCopy.fen(),
        difficulty: diff,
        turn: gameCopy.turn() === 'w' ? 'white' : 'black',
        isGameOver: isOver,
      })

      if (isOver) {
        sendToPlatform('completion', '', {
          summary: `Game over: ${gameCopy.isCheckmate() ? 'Checkmate' : 'Draw'}`,
          fen: gameCopy.fen(),
          difficulty: diff,
        })
      }
    } catch {
      setThinking(false)
      setStatus('AI error — your turn')
    }
  }, [updateStatus, getBestMove])


  function makeMove(from: string, to: string) {
    if (thinking) return false
    try {
      const gameCopy = new Chess(game.fen())
      const move = gameCopy.move({ from: from as Square, to: to as Square, promotion: 'q' })
      if (!move) return false

      setMoveHistory(prev => [...prev, game.fen()])
      setGame(gameCopy)
      setSelectedSquare(null)
      setHighlightSquares({})
      const isOver = updateStatus(gameCopy)

      sendToPlatform('state_update', '', {
        type: 'player_move',
        move: move.san, from, to,
        fen: gameCopy.fen(),
        difficulty,
        playerColor,
        turn: gameCopy.turn() === 'w' ? 'white' : 'black',
        isGameOver: isOver,
      })

      if (isOver) {
        sendToPlatform('completion', '', {
          summary: `Game over: ${gameCopy.isCheckmate() ? 'Checkmate' : gameCopy.isDraw() ? 'Draw' : 'Stalemate'}`,
          fen: gameCopy.fen(),
        })
      } else if (difficulty) {
        // AI's turn
        playAI(gameCopy, difficulty)
      }
      return true
    } catch {
      return false
    }
  }

  // Handle tool invocations from the platform
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const msg = event.data
      if (!msg || msg.type !== 'tool_invoke') return
      const { correlationId, tool, params } = msg

      switch (tool) {
        case 'restore_state': {
          const fen = params?.fen as string
          if (!fen) { sendToPlatform('error', correlationId, { message: 'No FEN' }); return }
          try {
            const restored = new Chess(fen)
            setGame(restored)
            setGameStarted(true)
            setDifficulty((params?.difficulty as Difficulty) || 'apprentice')
            setPlayerColor((params?.playerColor as 'white' | 'black') || 'white')
            updateStatus(restored)
            setSelectedSquare(null)
            setHighlightSquares({})
            sendToPlatform('tool_result', correlationId, { tool: 'restore_state', fen: restored.fen() })
          } catch { sendToPlatform('error', correlationId, { message: 'Invalid FEN' }) }
          break
        }
        case 'new_game': {
          const diff = (params?.difficulty as Difficulty) || 'apprentice'
          startGame(diff)
          sendToPlatform('tool_result', correlationId, {
            tool: 'new_game', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            difficulty: diff, message: `New ${diff} game started.`,
          })
          break
        }
        case 'get_board_state': {
          sendToPlatform('tool_result', correlationId, {
            tool: 'get_board_state', fen: game.fen(),
            turn: game.turn() === 'w' ? 'white' : 'black',
            isGameOver: game.isGameOver(), difficulty, moveHistory: game.history(),
          })
          break
        }
        case 'analyze_position': {
          const fen = (params?.fen as string) || game.fen()
          try {
            const g = new Chess(fen)
            const moves = g.moves({ verbose: true })
            const best = moves[0]
            sendToPlatform('tool_result', correlationId, {
              tool: 'analyze_position', fen, suggestedMove: best ? { from: best.from, to: best.to, san: best.san } : null,
              totalLegalMoves: moves.length,
            })
          } catch { sendToPlatform('error', correlationId, { message: 'Invalid FEN' }) }
          break
        }
        default:
          sendToPlatform('error', correlationId, { message: `Unknown tool: ${tool}` })
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [game, difficulty, playerColor, updateStatus])

  useEffect(() => { sendToPlatform('ui_ready', '', {}) }, [])

  function onSquareClick(square: string) {
    if (!gameStarted || thinking) return
    // Check it's the player's turn
    const isPlayerTurn = (playerColor === 'white' && game.turn() === 'w') || (playerColor === 'black' && game.turn() === 'b')
    if (!isPlayerTurn) return

    if (selectedSquare) {
      const moved = makeMove(selectedSquare, square)
      if (moved) return
    }

    const piece = game.get(square as Square)
    if (piece && ((piece.color === 'w' && playerColor === 'white') || (piece.color === 'b' && playerColor === 'black'))) {
      setSelectedSquare(square)
      const moves = game.moves({ square: square as Square, verbose: true })
      const highlights: Record<string, React.CSSProperties> = {
        [square]: { background: 'rgba(255, 255, 0, 0.4)' },
      }
      moves.forEach(m => {
        highlights[m.to] = {
          background: m.captured
            ? 'radial-gradient(circle, rgba(255,0,0,0.3) 60%, transparent 60%)'
            : 'radial-gradient(circle, rgba(0,0,0,0.15) 25%, transparent 25%)',
        }
      })
      setHighlightSquares(highlights)
    } else {
      setSelectedSquare(null)
      setHighlightSquares({})
    }
  }

  // Difficulty selection screen
  if (!gameStarted) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '24px' }}>
        <div style={{ fontSize: '20px', fontWeight: 600, color: '#374151' }}>Choose Difficulty</div>
        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
          {stockfishReady ? 'Pick one that matches your skill level' : 'Loading chess engine...'}
        </div>
        {(Object.entries(DIFFICULTY_CONFIG) as [Difficulty, typeof DIFFICULTY_CONFIG[Difficulty]][]).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => startGame(key)}
            disabled={!stockfishReady}
            style={{
              width: '280px', padding: '16px', borderRadius: '12px', border: '2px solid #e5e7eb',
              background: 'white', cursor: stockfishReady ? 'pointer' : 'not-allowed',
              textAlign: 'left', transition: 'border-color 0.15s',
              opacity: stockfishReady ? 1 : 0.5,
            }}
            onMouseOver={e => stockfishReady && (e.currentTarget.style.borderColor = '#3b82f6')}
            onMouseOut={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
          >
            <div style={{ fontSize: '18px', marginBottom: '4px' }}>
              {cfg.emoji} {cfg.label}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>{cfg.desc}</div>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '12px', width: '364px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px' }}>
        <span style={{ background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '4px', fontWeight: 500, whiteSpace: 'nowrap' }}>
          {DIFFICULTY_CONFIG[difficulty!]?.emoji} {DIFFICULTY_CONFIG[difficulty!]?.label}
        </span>
        <span style={{ color: '#6b7280' }}>{thinking ? 'Thinking...' : status}</span>
      </div>
      <div style={{ position: 'relative', width: '340px', height: '340px' }}>
        <Chessboard
          position={game.fen()}
          onPieceDrop={(s, t) => makeMove(s, t)}
          onSquareClick={onSquareClick}
          boardOrientation={playerColor}
          boardWidth={340}
          arePiecesDraggable={gameStarted && !thinking && !gameOver}
          customSquareStyles={highlightSquares}
          animationDuration={300}
        />
        {gameOver && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.7)', borderRadius: '4px', zIndex: 10,
          }}>
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>
              {gameOver.result === 'win' ? '🎉' : gameOver.result === 'loss' ? '😔' : '🤝'}
            </div>
            <div style={{
              fontSize: '22px', fontWeight: 700, color: 'white', marginBottom: '4px', textAlign: 'center',
            }}>
              {gameOver.result === 'win' ? 'You Win!' : gameOver.result === 'loss' ? 'You Lose' : 'Draw'}
            </div>
            <div style={{ fontSize: '13px', color: '#d1d5db', marginBottom: '16px' }}>
              {gameOver.message}
            </div>
            <button
              onClick={() => { setGameStarted(false); setDifficulty(null); setGameOver(null) }}
              style={{
                fontSize: '15px', fontWeight: 600, color: 'white', background: '#3b82f6',
                border: 'none', borderRadius: '8px', padding: '10px 28px', cursor: 'pointer',
              }}
            >
              Play Again
            </button>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => {
            if (moveHistory.length === 0 || thinking) return
            const prevFen = moveHistory[moveHistory.length - 1]
            setGame(new Chess(prevFen))
            setMoveHistory(prev => prev.slice(0, -1))
            setSelectedSquare(null)
            setHighlightSquares({})
            setGameOver(null)
            const g = new Chess(prevFen)
            updateStatus(g)
          }}
          disabled={moveHistory.length === 0 || thinking}
          style={{
            fontSize: '14px', fontWeight: 500, color: moveHistory.length === 0 || thinking ? '#9ca3af' : '#374151',
            background: 'none', border: '2px solid #d1d5db', borderRadius: '8px',
            padding: '8px 20px', cursor: moveHistory.length === 0 || thinking ? 'not-allowed' : 'pointer',
          }}
        >
          Undo
        </button>
        <button
          onClick={() => { setGameStarted(false); setDifficulty(null); setGameOver(null) }}
          style={{
            fontSize: '14px', fontWeight: 500, color: '#374151',
            background: 'none', border: '2px solid #d1d5db', borderRadius: '8px',
            padding: '8px 20px', cursor: 'pointer',
          }}
        >
          New Game
        </button>
      </div>
    </div>
  )
}
