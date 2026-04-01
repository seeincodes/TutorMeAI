import { useState, useCallback, useEffect } from 'react'
import { Chess, type Square } from 'chess.js'
import { Chessboard } from 'react-chessboard'

// PostMessage helpers — communicate with ChatBridge platform
function sendToPlatform(type: string, correlationId: string, data: Record<string, unknown>) {
  window.parent.postMessage({ type, correlationId, data }, '*')
}

export default function ChessApp() {
  const [game, setGame] = useState<Chess>(new Chess())
  const [gameStarted, setGameStarted] = useState(true)
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white')
  const [status, setStatus] = useState('White to move — click a piece, then click where to move')
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null)
  const [highlightSquares, setHighlightSquares] = useState<Record<string, React.CSSProperties>>({})

  const updateStatus = useCallback((g: Chess) => {
    if (g.isCheckmate()) {
      const winner = g.turn() === 'w' ? 'Black' : 'White'
      setStatus(`Checkmate! ${winner} wins!`)
      return true // game over
    }
    if (g.isDraw()) {
      setStatus('Draw!')
      return true
    }
    if (g.isStalemate()) {
      setStatus('Stalemate!')
      return true
    }
    if (g.isCheck()) {
      setStatus(`${g.turn() === 'w' ? 'White' : 'Black'} is in check`)
      return false
    }
    setStatus(`${g.turn() === 'w' ? 'White' : 'Black'} to move`)
    return false
  }, [])

  // Handle tool invocations from the platform
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const msg = event.data
      if (!msg || msg.type !== 'tool_invoke') return

      const { correlationId, tool, params } = msg

      switch (tool) {
        case 'restore_state': {
          const fen = params?.fen as string
          if (!fen) {
            sendToPlatform('error', correlationId, { message: 'No FEN provided' })
            return
          }
          try {
            const restored = new Chess(fen)
            setGame(restored)
            setGameStarted(true)
            setPlayerColor((params?.playerColor as 'white' | 'black') || 'white')
            updateStatus(restored)
            setSelectedSquare(null)
            setHighlightSquares({})
            sendToPlatform('tool_result', correlationId, {
              tool: 'restore_state',
              fen: restored.fen(),
              message: 'Game restored.',
            })
          } catch {
            sendToPlatform('error', correlationId, { message: 'Invalid FEN string' })
          }
          break
        }

        case 'new_game': {
          const color = params?.color || 'white'
          const newGame = new Chess()
          setGame(newGame)
          setGameStarted(true)
          setPlayerColor(color)
          updateStatus(newGame)
          sendToPlatform('tool_result', correlationId, {
            tool: 'new_game',
            fen: newGame.fen(),
            color,
            message: `New game started. You are playing ${color}.`,
          })
          break
        }

        case 'make_move': {
          try {
            const from = params?.from as string
            const to = params?.to as string
            const gameCopy = new Chess(game.fen())
            const move = gameCopy.move({ from: from as Square, to: to as Square, promotion: 'q' })
            if (!move) {
              sendToPlatform('error', correlationId, {
                message: `Invalid move: ${from} to ${to}`,
              })
              return
            }
            setGame(gameCopy)
            const isOver = updateStatus(gameCopy)
            sendToPlatform('tool_result', correlationId, {
              tool: 'make_move',
              fen: gameCopy.fen(),
              move: move.san,
              valid: true,
              isGameOver: isOver,
              turn: gameCopy.turn() === 'w' ? 'white' : 'black',
            })
            if (isOver) {
              sendToPlatform('completion', correlationId, {
                summary: status,
                fen: gameCopy.fen(),
              })
            }
          } catch {
            sendToPlatform('error', correlationId, {
              message: 'Failed to make move',
            })
          }
          break
        }

        case 'get_board_state': {
          const isOver = game.isGameOver()
          sendToPlatform('tool_result', correlationId, {
            tool: 'get_board_state',
            fen: game.fen(),
            turn: game.turn() === 'w' ? 'white' : 'black',
            isCheck: game.isCheck(),
            isCheckmate: game.isCheckmate(),
            isDraw: game.isDraw(),
            isGameOver: isOver,
            moveHistory: game.history(),
          })
          break
        }

        case 'analyze_position': {
          const fen = (params?.fen as string) || game.fen()
          try {
            const analysisGame = new Chess(fen)
            const moves = analysisGame.moves({ verbose: true })
            // Simple analysis: prioritize captures, checks, center control
            const scored = moves.map(m => {
              let score = 0
              if (m.captured) score += 10
              if (m.san.includes('+')) score += 5
              if (['d4', 'd5', 'e4', 'e5'].includes(m.to)) score += 3
              if (['c3', 'c6', 'f3', 'f6', 'c4', 'c5', 'f4', 'f5'].includes(m.to)) score += 1
              return { ...m, score }
            })
            scored.sort((a, b) => b.score - a.score)
            const best = scored[0]
            sendToPlatform('tool_result', correlationId, {
              tool: 'analyze_position',
              fen,
              suggestedMove: best ? { from: best.from, to: best.to, san: best.san } : null,
              totalLegalMoves: moves.length,
              isCheck: analysisGame.isCheck(),
              isCheckmate: analysisGame.isCheckmate(),
            })
          } catch {
            sendToPlatform('error', correlationId, {
              message: 'Invalid FEN string',
            })
          }
          break
        }

        default:
          sendToPlatform('error', correlationId, {
            message: `Unknown tool: ${tool}`,
          })
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [game, status, updateStatus])

  // Signal ui_ready to platform
  useEffect(() => {
    sendToPlatform('ui_ready', '', {})
  }, [])

  function makeMove(from: string, to: string) {
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
        move: move.san,
        from, to,
        fen: gameCopy.fen(),
        turn: gameCopy.turn() === 'w' ? 'white' : 'black',
        isGameOver: isOver,
      })

      if (isOver) {
        sendToPlatform('completion', '', {
          summary: `Game over: ${gameCopy.isCheckmate() ? 'Checkmate' : gameCopy.isDraw() ? 'Draw' : 'Stalemate'}`,
          fen: gameCopy.fen(),
        })
      }
      return true
    } catch {
      return false
    }
  }

  function onDrop(sourceSquare: string, targetSquare: string): boolean {
    if (!gameStarted) return false
    return makeMove(sourceSquare, targetSquare)
  }

  function onSquareClick(square: string) {
    if (!gameStarted) return

    // If a piece is already selected, try to move there
    if (selectedSquare) {
      const moved = makeMove(selectedSquare, square)
      if (moved) return
      // If move failed, check if clicking own piece to reselect
    }

    // Select the clicked square if it has a piece of the current player's color
    const piece = game.get(square as Square)
    if (piece && ((piece.color === 'w' && playerColor === 'white') || (piece.color === 'b' && playerColor === 'black'))) {
      setSelectedSquare(square)
      // Highlight legal moves
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '16px' }}>
      <div style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>
        {status}
      </div>
      <Chessboard
        position={game.fen()}
        onPieceDrop={onDrop}
        onSquareClick={onSquareClick}
        boardOrientation={playerColor}
        boardWidth={360}
        arePiecesDraggable={gameStarted}
        customSquareStyles={highlightSquares}
      />
    </div>
  )
}
