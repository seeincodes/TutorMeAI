import { useState, useCallback, useEffect, useRef } from 'react'
import { Chess, type Square, type Move } from 'chess.js'
import { Chessboard } from 'react-chessboard'

function sendToPlatform(type: string, correlationId: string, data: Record<string, unknown>) {
  window.parent.postMessage({ type, correlationId, data }, '*')
}

type Difficulty = 'beginner' | 'intermediate' | 'advanced'

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; emoji: string; desc: string; depth: number; randomness: number }> = {
  beginner:     { label: 'Beginner',     emoji: '🌱', desc: 'Ages 5-8 · Makes mistakes on purpose', depth: 1, randomness: 0.7 },
  intermediate: { label: 'Intermediate', emoji: '⭐', desc: 'Ages 9-12 · Plays decent moves',       depth: 2, randomness: 0.3 },
  advanced:     { label: 'Advanced',     emoji: '🔥', desc: 'Ages 13+ · Strong positional play',    depth: 3, randomness: 0.05 },
}

// Piece values for evaluation
const PIECE_VALUES: Record<string, number> = { p: 1, n: 3, b: 3.2, r: 5, q: 9, k: 0 }

function evaluateBoard(chess: Chess): number {
  let score = 0
  const board = chess.board()
  for (const row of board) {
    for (const sq of row) {
      if (!sq) continue
      const val = PIECE_VALUES[sq.type] || 0
      // Center bonus
      const centerBonus = sq.square && ['d4','d5','e4','e5'].includes(sq.square) ? 0.3 : 0
      score += (sq.color === 'w' ? 1 : -1) * (val + centerBonus)
    }
  }
  if (chess.isCheckmate()) score += chess.turn() === 'w' ? -1000 : 1000
  if (chess.isCheck()) score += chess.turn() === 'w' ? -0.5 : 0.5
  return score
}

function minimax(chess: Chess, depth: number, alpha: number, beta: number, maximizing: boolean): number {
  if (depth === 0 || chess.isGameOver()) return evaluateBoard(chess)
  const moves = chess.moves()
  if (maximizing) {
    let maxEval = -Infinity
    for (const move of moves) {
      chess.move(move)
      const eval_ = minimax(chess, depth - 1, alpha, beta, false)
      chess.undo()
      maxEval = Math.max(maxEval, eval_)
      alpha = Math.max(alpha, eval_)
      if (beta <= alpha) break
    }
    return maxEval
  } else {
    let minEval = Infinity
    for (const move of moves) {
      chess.move(move)
      const eval_ = minimax(chess, depth - 1, alpha, beta, true)
      chess.undo()
      minEval = Math.min(minEval, eval_)
      beta = Math.min(beta, eval_)
      if (beta <= alpha) break
    }
    return minEval
  }
}

function pickAIMove(chess: Chess, difficulty: Difficulty): Move | null {
  const moves = chess.moves({ verbose: true })
  if (moves.length === 0) return null

  const config = DIFFICULTY_CONFIG[difficulty]

  // Score each move with minimax
  const scored = moves.map(m => {
    const copy = new Chess(chess.fen())
    copy.move(m.san)
    const score = minimax(copy, config.depth - 1, -Infinity, Infinity, copy.turn() === 'w')
    return { move: m, score }
  })

  // Sort: if AI is black, prefer lower scores; if white, prefer higher
  const isBlack = chess.turn() === 'b'
  scored.sort((a, b) => isBlack ? a.score - b.score : b.score - a.score)

  // Add randomness based on difficulty — sometimes pick a suboptimal move
  if (Math.random() < config.randomness && scored.length > 1) {
    // Pick a random move from the bottom half (beginner) or middle (intermediate)
    const pool = difficulty === 'beginner'
      ? scored.slice(Math.floor(scored.length / 2))
      : scored.slice(Math.floor(scored.length / 3), Math.floor(scored.length * 2 / 3))
    if (pool.length > 0) {
      return pool[Math.floor(Math.random() * pool.length)].move
    }
  }

  return scored[0].move
}

export default function ChessApp() {
  const [game, setGame] = useState<Chess>(new Chess())
  const [gameStarted, setGameStarted] = useState(false)
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null)
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white')
  const [status, setStatus] = useState('')
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null)
  const [highlightSquares, setHighlightSquares] = useState<Record<string, React.CSSProperties>>({})
  const [thinking, setThinking] = useState(false)
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
    setStatus('Your turn — click a piece, then click where to move')
    sendToPlatform('state_update', '', {
      type: 'game_start',
      difficulty: diff,
      fen: newGame.fen(),
      playerColor: 'white',
    })
  }

  // AI makes a move after the player
  const playAI = useCallback((currentGame: Chess, diff: Difficulty) => {
    if (currentGame.isGameOver()) return

    setThinking(true)
    setStatus('AI is thinking...')

    // Small delay so the player sees their move first
    const delay = diff === 'beginner' ? 800 : diff === 'intermediate' ? 600 : 400
    aiTimeoutRef.current = setTimeout(() => {
      const aiMove = pickAIMove(currentGame, diff)
      if (!aiMove) { setThinking(false); return }

      const gameCopy = new Chess(currentGame.fen())
      gameCopy.move(aiMove.san)
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
    }, delay)
  }, [updateStatus])

  // Cleanup AI timeout on unmount
  useEffect(() => {
    return () => { if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current) }
  }, [])

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
        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>Pick one that matches your skill level</div>
        {(Object.entries(DIFFICULTY_CONFIG) as [Difficulty, typeof DIFFICULTY_CONFIG[Difficulty]][]).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => startGame(key)}
            style={{
              width: '280px', padding: '16px', borderRadius: '12px', border: '2px solid #e5e7eb',
              background: 'white', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s',
            }}
            onMouseOver={e => (e.currentTarget.style.borderColor = '#3b82f6')}
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
        <span style={{ background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '4px', fontWeight: 500 }}>
          {DIFFICULTY_CONFIG[difficulty!]?.emoji} {DIFFICULTY_CONFIG[difficulty!]?.label}
        </span>
        <span style={{ color: '#6b7280' }}>{status}</span>
      </div>
      {thinking && (
        <div style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>
          Thinking...
        </div>
      )}
      <Chessboard
        position={game.fen()}
        onPieceDrop={(s, t) => makeMove(s, t)}
        onSquareClick={onSquareClick}
        boardOrientation={playerColor}
        boardWidth={340}
        arePiecesDraggable={gameStarted && !thinking}
        customSquareStyles={highlightSquares}
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
