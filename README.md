# TutorMeAI

AI-powered K-12 tutoring platform with interactive learning apps.

**Live:** https://tutormeai-web-production.up.railway.app

## Tech Stack

- **Frontend:** React (Vite) + TypeScript + Tailwind CSS
- **Backend:** Python FastAPI
- **AI Agent:** LangGraph + OpenAI GPT-4.1-mini
- **Database:** PostgreSQL (Railway)
- **Real-time:** SSE via sse-starlette

## Project Structure

- `web/frontend/` — React chat UI and iframe container
- `web/backend/` — FastAPI backend (auth, agent, app registry, OAuth)
- `apps/` — Interactive iframe apps (chess, weather, flashcards, dictionary, calculator, life-skills)
- `docs/` — Project documentation

## Getting Started

```bash
# Frontend
cd web/frontend && pnpm install && pnpm run dev

# Backend
cd web/backend && pip install -r requirements.txt && uvicorn app.main:app --reload

# Individual apps (e.g., chess)
cd apps/chess && pnpm install && pnpm run dev
```
