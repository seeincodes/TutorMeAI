# Replace Custom Minimax with Stockfish WASM

**Date:** 2026-04-02
**Status:** Approved

## Summary

Replace the ~60-line custom minimax engine in the chess iframe app with Stockfish WASM running in a Web Worker. This gives the app a world-class chess engine with tunable difficulty while keeping everything client-side with zero API costs.

## Architecture

### Components

1. **`apps/chess/src/stockfishWorker.ts`** (new) — Thin wrapper that loads Stockfish WASM in a Web Worker and exposes a promise-based `getBestMove(fen, config)` API.
2. **`apps/chess/src/ChessApp.tsx`** (modified) — Remove `evaluateBoard()`, `minimax()`, and `pickAIMove()` functions. Update `playAI()` to call the Stockfish worker instead.

### Difficulty Mapping

Keep the existing 4-level UI. Map each to Stockfish parameters:

| Level        | Skill Level | Depth Limit | Move Time |
|-------------|-------------|-------------|-----------|
| Beginner     | 0           | 1           | 100ms     |
| Intermediate | 5           | 5           | 300ms     |
| Advanced     | 12          | 10          | 500ms     |
| Grandmaster  | 20          | 15          | 1000ms    |

### Data Flow

1. Player makes move → `makeMove()` updates board (unchanged)
2. `playAI()` calls `stockfishWorker.getBestMove(fen, { skillLevel, depth, moveTime })`
3. Worker sends UCI commands: `setoption name Skill Level value X`, `position fen ...`, `go depth Y movetime Z`
4. Worker parses `bestmove` from Stockfish output, resolves the promise
5. `playAI()` applies the move via chess.js (unchanged)

### Static Assets

The `stockfish.wasm` binary (~2MB) is served from `apps/chess/public/` by Vite as a static asset.

### Package

- **npm package:** `stockfish` (nmrugg/stockfish.js)
- **License:** GPL-3.0
- **Build:** Single-threaded WASM (no SharedArrayBuffer/COOP/COEP headers needed — works in sandboxed iframe)

## What Changes

- **New file:** `apps/chess/src/stockfishWorker.ts`
- **New dependency:** `stockfish` npm package
- **Modified:** `apps/chess/src/ChessApp.tsx` — remove minimax code, add worker integration
- **No backend changes**
- **No UI changes**

## What Stays the Same

- chess.js for move validation and game state
- react-chessboard for board UI
- All postMessage communication with parent platform
- Difficulty selection screen (4 buttons)
- Click/drag-to-move with square highlights
- Game state restore/new game tool invocations
- "AI is thinking..." status display

## Constraints

- Must work inside iframe with `sandbox="allow-scripts allow-same-origin"`
- Single-threaded WASM only (no SharedArrayBuffer)
- No external API calls — everything runs in-browser
