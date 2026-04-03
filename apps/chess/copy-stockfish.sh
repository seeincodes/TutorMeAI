#!/bin/bash
mkdir -p public/stockfish

# pnpm may hoist the package to the workspace root, so check both locations
STOCKFISH_DIR=""
if [ -d "node_modules/stockfish/bin" ]; then
  STOCKFISH_DIR="node_modules/stockfish/bin"
elif [ -d "../../node_modules/stockfish/bin" ]; then
  STOCKFISH_DIR="../../node_modules/stockfish/bin"
fi

if [ -z "$STOCKFISH_DIR" ]; then
  echo "Warning: stockfish package not found, skipping WASM copy"
  exit 0
fi

cp "$STOCKFISH_DIR"/stockfish-18-single.js public/stockfish/ 2>/dev/null || true
cp "$STOCKFISH_DIR"/stockfish-18-single.wasm public/stockfish/ 2>/dev/null || true
cp "$STOCKFISH_DIR"/stockfish-18.js public/stockfish/ 2>/dev/null || true
cp "$STOCKFISH_DIR"/stockfish-18.wasm public/stockfish/ 2>/dev/null || true
echo "Stockfish WASM files copied to public/stockfish/"
