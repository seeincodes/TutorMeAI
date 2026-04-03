# Stockfish WASM Chess Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the custom minimax chess engine with Stockfish WASM running in a Web Worker for dramatically stronger, tunable AI play.

**Architecture:** Stockfish WASM (single-threaded) runs inside a Web Worker in the chess iframe app. A thin wrapper module manages UCI communication. The existing 4-difficulty UI maps to Stockfish Skill Level + depth/time limits.

**Tech Stack:** stockfish npm package (nmrugg/stockfish.js), Web Workers, UCI protocol, chess.js, react-chessboard, Vite

---

### Task 1: Install stockfish package and copy WASM assets to public/

**Files:**
- Modify: `apps/chess/package.json`
- Create: `apps/chess/public/stockfish/` (directory for static WASM assets)
- Create: `apps/chess/copy-stockfish.sh` (postinstall script)

- [ ] **Step 1: Install the stockfish npm package**

```bash
cd apps/chess && pnpm add stockfish
```

- [ ] **Step 2: Create a postinstall script to copy WASM files to public/**

Create `apps/chess/copy-stockfish.sh`:

```bash
#!/bin/bash
mkdir -p public/stockfish
cp node_modules/stockfish/src/stockfish-nnue-16-single.js public/stockfish/
cp node_modules/stockfish/src/stockfish-nnue-16.wasm public/stockfish/ 2>/dev/null || true
echo "Stockfish WASM files copied to public/stockfish/"
```

- [ ] **Step 3: Add postinstall script to package.json**

In `apps/chess/package.json`, add to the `"scripts"` section:

```json
"postinstall": "bash copy-stockfish.sh"
```

- [ ] **Step 4: Run postinstall to copy files**

```bash
cd apps/chess && bash copy-stockfish.sh
```

Verify the files exist:

```bash
ls -la apps/chess/public/stockfish/
```

Expected: `stockfish-nnue-16-single.js` and optionally `stockfish-nnue-16.wasm` present.

- [ ] **Step 5: Add public/stockfish/ to .gitignore**

These are derived from node_modules, so they should not be committed. Add to `apps/chess/.gitignore` (create if needed):

```
public/stockfish/
```

- [ ] **Step 6: Commit**

```bash
git add apps/chess/package.json apps/chess/pnpm-lock.yaml apps/chess/copy-stockfish.sh apps/chess/.gitignore
git commit -m "feat(chess): add stockfish npm package and WASM copy script"
```

---

### Task 2: Create the Stockfish Web Worker wrapper

**Files:**
- Create: `apps/chess/src/useStockfish.ts`

This module manages the Stockfish Web Worker lifecycle and provides a promise-based API for getting best moves.

- [ ] **Step 1: Create `apps/chess/src/useStockfish.ts`**

```typescript
import { useRef, useCallback, useEffect, useState } from 'react'

interface StockfishConfig {
  skillLevel: number
  depth: number
  moveTime: number
}

const STOCKFISH_PATH = import.meta.env.BASE_URL + 'stockfish/stockfish-nnue-16-single.js'

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
```

- [ ] **Step 2: Verify the file compiles**

```bash
cd apps/chess && npx tsc --noEmit src/useStockfish.ts
```

Expected: No errors (or only errors from missing React types which are present in the full build).

- [ ] **Step 3: Commit**

```bash
git add apps/chess/src/useStockfish.ts
git commit -m "feat(chess): add Stockfish Web Worker wrapper hook"
```

---

### Task 3: Update ChessApp.tsx — remove minimax, integrate Stockfish

**Files:**
- Modify: `apps/chess/src/ChessApp.tsx`

- [ ] **Step 1: Remove the old engine code**

Remove these functions and constants from `apps/chess/src/ChessApp.tsx` (lines 18-96):
- `PIECE_VALUES` constant (line 19)
- `evaluateBoard()` function (lines 21-36)
- `minimax()` function (lines 38-64)
- `pickAIMove()` function (lines 66-96)

- [ ] **Step 2: Update DIFFICULTY_CONFIG to use Stockfish parameters**

Replace the existing `DIFFICULTY_CONFIG` (lines 11-16) with:

```typescript
const DIFFICULTY_CONFIG: Record<Difficulty, {
  label: string; emoji: string; desc: string;
  skillLevel: number; depth: number; moveTime: number
}> = {
  beginner:     { label: 'Beginner',     emoji: '🌱', desc: 'Makes mistakes on purpose',  skillLevel: 0,  depth: 1,  moveTime: 100 },
  intermediate: { label: 'Intermediate', emoji: '⭐', desc: 'Plays decent moves',        skillLevel: 5,  depth: 5,  moveTime: 300 },
  advanced:     { label: 'Advanced',     emoji: '🔥', desc: 'Strong positional play',    skillLevel: 12, depth: 10, moveTime: 500 },
  grandmaster:  { label: 'Grandmaster',  emoji: '👑', desc: 'Best move every time',      skillLevel: 20, depth: 15, moveTime: 1000 },
}
```

- [ ] **Step 3: Add the useStockfish hook to ChessApp**

At the top of the `ChessApp` component function, add:

```typescript
import { useStockfish } from './useStockfish'

// Inside ChessApp():
const { ready: stockfishReady, getBestMove, newGame: stockfishNewGame } = useStockfish()
```

- [ ] **Step 4: Update `startGame()` to reset Stockfish state**

After `setHighlightSquares({})` in `startGame()`, add:

```typescript
stockfishNewGame()
```

- [ ] **Step 5: Rewrite `playAI()` to use Stockfish**

Replace the entire `playAI` callback with:

```typescript
const playAI = useCallback(async (currentGame: Chess, diff: Difficulty) => {
  if (currentGame.isGameOver()) return

  setThinking(true)
  setStatus('AI is thinking...')

  try {
    const config = DIFFICULTY_CONFIG[diff]
    const bestMoveUci = await getBestMove(currentGame.fen(), {
      skillLevel: config.skillLevel,
      depth: config.depth,
      moveTime: config.moveTime,
    })

    // bestMoveUci is in long algebraic notation e.g. "e2e4" or "e7e8q"
    const from = bestMoveUci.slice(0, 2)
    const to = bestMoveUci.slice(2, 4)
    const promotion = bestMoveUci.length > 4 ? bestMoveUci[4] : undefined

    const gameCopy = new Chess(currentGame.fen())
    const aiMove = gameCopy.move({ from, to, promotion } as { from: Square; to: Square; promotion?: string })

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
```

- [ ] **Step 6: Add a loading state while Stockfish initializes**

In the difficulty selection screen (the `if (!gameStarted)` block), wrap the buttons to disable them if Stockfish isn't ready. Replace the difficulty selection return block with:

```typescript
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
```

- [ ] **Step 7: Verify the full app builds**

```bash
cd apps/chess && pnpm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 8: Commit**

```bash
git add apps/chess/src/ChessApp.tsx
git commit -m "feat(chess): replace custom minimax with Stockfish WASM engine"
```

---

### Task 4: Update Dockerfile for Stockfish WASM assets

**Files:**
- Modify: `Dockerfile`

The Dockerfile copies `apps/chess/` and runs `pnpm install && pnpm run build`. The postinstall script will copy the WASM files to `public/` before Vite builds, so they'll be included in the `dist/` output automatically. However, we need to make sure the postinstall script has execute permission and bash is available.

- [ ] **Step 1: Verify the existing Dockerfile chess build step works**

The existing Dockerfile has:

```dockerfile
COPY apps/chess/ apps/chess/
RUN cd apps/chess && pnpm install && pnpm run build
```

`pnpm install` triggers the postinstall script which runs `bash copy-stockfish.sh`. The Node Docker image includes bash, so this should work. No Dockerfile changes needed unless the build fails.

Run the build to verify:

```bash
cd /Users/xian/Gauntlet/week7/TutorMeAI && docker build --target frontend-build -t chess-test . 2>&1 | tail -20
```

If it succeeds, no changes needed. If it fails due to bash not being available, add `RUN apt-get update && apt-get install -y bash` before the chess build step, or convert `copy-stockfish.sh` to use `/bin/sh` instead.

- [ ] **Step 2: Commit if changes were needed**

```bash
git add Dockerfile
git commit -m "fix(docker): ensure Stockfish WASM assets are included in chess build"
```

---

### Task 5: Manual smoke test

No automated tests exist for the chess app currently, and testing a Web Worker + WASM engine in a unit test environment is complex. Perform a manual smoke test.

- [ ] **Step 1: Run the chess app in dev mode**

```bash
cd apps/chess && pnpm run dev
```

Open the URL shown (likely `http://localhost:5173/apps/chess/`).

- [ ] **Step 2: Verify engine loading**

- Page loads and shows "Choose Difficulty" screen
- Subtitle should briefly show "Loading chess engine..." then switch to "Pick one that matches your skill level"
- All 4 difficulty buttons become clickable

- [ ] **Step 3: Test each difficulty level**

For each difficulty (Beginner, Intermediate, Advanced, Grandmaster):
1. Click the difficulty button
2. Make a move (e.g., e2-e4)
3. Verify "AI is thinking..." appears
4. Verify the AI makes a legal move within a reasonable time:
   - Beginner: < 1 second
   - Intermediate: < 2 seconds
   - Advanced: < 3 seconds
   - Grandmaster: < 5 seconds
5. Click "New Game" and try next difficulty

- [ ] **Step 4: Test edge cases**

- Play until checkmate — verify game-over message appears
- Verify drag-and-drop still works
- Verify click-to-move with highlights still works
- Open browser DevTools console — verify no errors

- [ ] **Step 5: Commit any fixes**

If any issues were found and fixed during smoke testing, commit them:

```bash
git add -A
git commit -m "fix(chess): address issues found during Stockfish smoke test"
```
