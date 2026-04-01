# Stage 1: Build frontend and apps
FROM node:20-slim AS frontend-build

RUN npm install -g pnpm@10.33.0

WORKDIR /build

# Build frontend
COPY web/frontend/ web/frontend/
RUN cd web/frontend && pnpm install && pnpm run build

# Build each app
COPY apps/calculator/ apps/calculator/
RUN cd apps/calculator && pnpm install && pnpm run build

COPY apps/chess/ apps/chess/
RUN cd apps/chess && pnpm install && pnpm run build

COPY apps/dictionary/ apps/dictionary/
RUN cd apps/dictionary && pnpm install && pnpm run build

COPY apps/flashcards/ apps/flashcards/
RUN cd apps/flashcards && pnpm install && pnpm run build

COPY apps/life-skills/ apps/life-skills/
RUN cd apps/life-skills && pnpm install && pnpm run build

COPY apps/spotify/ apps/spotify/
RUN cd apps/spotify && pnpm install && pnpm run build

COPY apps/weather/ apps/weather/
RUN cd apps/weather && pnpm install && pnpm run build

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
COPY --from=frontend-build /build/apps/spotify/dist/ apps/spotify/dist/
COPY --from=frontend-build /build/apps/weather/dist/ apps/weather/dist/

# Alembic needs to run from the backend directory
WORKDIR /app/web/backend

EXPOSE ${PORT:-8000}

# Run migrations then start the server
CMD alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
