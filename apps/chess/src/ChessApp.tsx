import { useState, useCallback, useEffect } from 'react'
import { Chess, type Square } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { useStockfish } from './useStockfish'

function sendToPlatform(type: string, correlationId: string, data: Record<string, unknown>) {
  window.parent.postMessage({ type, correlationId, data }, '*')
}

type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'grandmaster'

const DIFFICULTY_CONFIG: Record<Difficulty, {
  label: string; emoji: string; desc: string;
  skillLevel: number; depth: number; moveTime: number; randomChance: number
}> = {
  beginner:     { label: 'Beginner',     emoji: '🌱', desc: 'Makes mistakes on purpose',  skillLevel: 0,  depth: 1,  moveTime: 50,   randomChance: 0.6 },
  intermediate: { label: 'Intermediate', emoji: '⭐', desc: 'Plays decent moves',        skillLevel: 3,  depth: 3,  moveTime: 150,  randomChance: 0.15 },
  advanced:     { label: 'Advanced',     emoji: '🔥', desc: 'Strong positional play',    skillLevel: 10, depth: 10, moveTime: 500,  randomChance: 0 },
  grandmaster:  { label: 'Grandmaster',  emoji: '👑', desc: 'Best move every time',      skillLevel: 20, depth: 20, moveTime: 2000, randomChance: 0 },
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

  const updateStatus = useCallback((g: Chess) => {
    if (g.isCheckmate()) {
      const winner = g.turn() === 'w' ? 'Black' : 'White'
      setStatus(`Checkmate! ${winner} wins!`)
      return true
    }
    if (g.isDraw()) { setStatus('Draw!'); return true }
    if (g.isStalemate()) { setStatus('Stalemate!'); return true }
    if (g.isCheck()) {
      setStatus(`${g.turn() === 'w' ? 'White' : 'Black'} is in check!`)
      return false
    }
    setStatus(`${g.turn() === 'w' ? 'White' : 'Black'} to move`)
    return false
  }, [])

  function startGame(diff: Difficulty) {
    const newGame = new Chess()
    setGame(newGame)
    setDifficulty(diff)
    setGameStarted(true)
    setPlayerColor('white')
    setSelectedSquare(null)
    setHighlightSquares({})
    stockfishNewGame()
    setStatus('Your turn — click a piece, then click where to move')
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
    const minDelay = diff === 'beginner' ? 800 : diff === 'intermediate' ? 600 : 400
    const delayPromise = new Promise(r => setTimeout(r, minDelay))

    try {
      const config = DIFFICULTY_CONFIG[diff]
      const gameCopy = new Chess(currentGame.fen())
      let aiMove

      // At lower difficulties, sometimes pick a random legal move instead of using Stockfish
      if (config.randomChance > 0 && Math.random() < config.randomChance) {
        const legalMoves = gameCopy.moves({ verbose: true })
        aiMove = legalMoves[Math.floor(Math.random() * legalMoves.length)]
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
            setDifficulty((params?.difficulty as Difficulty) || 'intermediate')
            setPlayerColor((params?.playerColor as 'white' | 'black') || 'white')
            updateStatus(restored)
            setSelectedSquare(null)
            setHighlightSquares({})
            sendToPlatform('tool_result', correlationId, { tool: 'restore_state', fen: restored.fen() })
          } catch { sendToPlatform('error', correlationId, { message: 'Invalid FEN' }) }
          break
        }
        case 'new_game': {
          const diff = (params?.difficulty as Difficulty) || 'intermediate'
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', height: '20px', width: '100%', overflow: 'hidden' }}>
        <span style={{ background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '4px', fontWeight: 500 }}>
          {DIFFICULTY_CONFIG[difficulty!]?.emoji} {DIFFICULTY_CONFIG[difficulty!]?.label}
        </span>
        <span style={{ color: '#6b7280' }}>{status}</span>
      </div>
      <div style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic', height: '18px' }}>
        {thinking ? 'Thinking...' : '\u00A0'}
      </div>
      <Chessboard
        position={game.fen()}
        onPieceDrop={(s, t) => makeMove(s, t)}
        onSquareClick={onSquareClick}
        boardOrientation={playerColor}
        boardWidth={340}
        arePiecesDraggable={gameStarted && !thinking}
        customSquareStyles={highlightSquares}
        animationDuration={300}
      />
      <button
        onClick={() => { setGameStarted(false); setDifficulty(null) }}
        style={{ fontSize: '12px', color: '#6b7280', background: 'none', border: '1px solid #d1d5db', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer' }}
      >
        New Game
      </button>
    </div>
  )
}
