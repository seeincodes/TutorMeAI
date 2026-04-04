# Stage 1: Build frontend and apps
FROM node:20-slim AS frontend-build

RUN npm install -g pnpm@10.33.0

WORKDIR /build

# Build frontend
COPY web/frontend/ web/frontend/
# Copy Chatbox source types into a location resolvable by the frontend's node_modules
COPY src/shared/ src/shared/
COPY src/renderer/packages/latex.ts src/renderer/packages/latex.ts
# Install zod and ai in src/shared so Vite can resolve imports from @chatbox/shared/*
RUN cd web/frontend && pnpm install --no-frozen-lockfile
RUN cd src/shared && ln -sf /build/web/frontend/node_modules/zod node_modules_zod 2>/dev/null; \
    mkdir -p /build/src/shared/node_modules && \
    ln -sf /build/web/frontend/node_modules/zod /build/src/shared/node_modules/zod && \
    ln -sf /build/web/frontend/node_modules/ai /build/src/shared/node_modules/ai && \
    ln -sf /build/web/frontend/node_modules/zod /build/src/renderer/node_modules/zod 2>/dev/null; \
    mkdir -p /build/src/renderer/node_modules && \
    ln -sf /build/web/frontend/node_modules/zod /build/src/renderer/node_modules/zod 2>/dev/null; true
RUN cd web/frontend && npx vite build

# Build each app (one layer per app for caching)
COPY apps/calculator/ apps/calculator/
RUN cd apps/calculator && pnpm install --no-frozen-lockfile && pnpm run build

COPY apps/chess/ apps/chess/
RUN cd apps/chess && pnpm install --no-frozen-lockfile && pnpm run build

COPY apps/dictionary/ apps/dictionary/
RUN cd apps/dictionary && pnpm install --no-frozen-lockfile && pnpm run build

COPY apps/flashcards/ apps/flashcards/
RUN cd apps/flashcards && pnpm install --no-frozen-lockfile && pnpm run build

COPY apps/life-skills/ apps/life-skills/
RUN cd apps/life-skills && pnpm install --no-frozen-lockfile && pnpm run build

COPY apps/weather/ apps/weather/
RUN cd apps/weather && pnpm install --no-frozen-lockfile && pnpm run build

COPY apps/counting-game/ apps/counting-game/
RUN cd apps/counting-game && pnpm install --no-frozen-lockfile && pnpm run build

COPY apps/abc-letters/ apps/abc-letters/
RUN cd apps/abc-letters && pnpm install --no-frozen-lockfile && pnpm run build

COPY apps/shapes/ apps/shapes/
RUN cd apps/shapes && pnpm install --no-frozen-lockfile && pnpm run build

COPY apps/animals/ apps/animals/
RUN cd apps/animals && pnpm install --no-frozen-lockfile && pnpm run build

COPY apps/nasa/ apps/nasa/
RUN cd apps/nasa && pnpm install --no-frozen-lockfile && pnpm run build

COPY apps/books/ apps/books/
RUN cd apps/books && pnpm install --no-frozen-lockfile && pnpm run build

COPY apps/spotify/ apps/spotify/
RUN cd apps/spotify && pnpm install --no-frozen-lockfile && pnpm run build

# Stage 2: Python backend + static files
FROM python:3.12-slim

WORKDIR /app

# Install Python dependencies
COPY web/backend/pyproject.toml web/backend/
RUN pip install --no-cache-dir -e web/backend/

# Copy backend source
COPY web/backend/ web/backend/

# Copy built static files from frontend stage
COPY --from=frontend-build /build/web/frontend/dist/ web/frontend/dist/
COPY --from=frontend-build /build/apps/calculator/dist/ apps/calculator/dist/
COPY --from=frontend-build /build/apps/chess/dist/ apps/chess/dist/
COPY --from=frontend-build /build/apps/dictionary/dist/ apps/dictionary/dist/
COPY --from=frontend-build /build/apps/flashcards/dist/ apps/flashcards/dist/
COPY --from=frontend-build /build/apps/life-skills/dist/ apps/life-skills/dist/
COPY --from=frontend-build /build/apps/weather/dist/ apps/weather/dist/
COPY --from=frontend-build /build/apps/counting-game/dist/ apps/counting-game/dist/
COPY --from=frontend-build /build/apps/abc-letters/dist/ apps/abc-letters/dist/
COPY --from=frontend-build /build/apps/shapes/dist/ apps/shapes/dist/
COPY --from=frontend-build /build/apps/animals/dist/ apps/animals/dist/
COPY --from=frontend-build /build/apps/nasa/dist/ apps/nasa/dist/
COPY --from=frontend-build /build/apps/books/dist/ apps/books/dist/
COPY --from=frontend-build /build/apps/spotify/dist/ apps/spotify/dist/

# Alembic needs to run from the backend directory
WORKDIR /app/web/backend

EXPOSE ${PORT:-8000}

# Run migrations then start the server
CMD alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
