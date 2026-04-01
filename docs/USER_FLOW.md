# ChatBridge — User Flow

## Primary Flow

```
┌──────────┐     ┌──────────────┐     ┌──────────────────┐     ┌───────────────┐
│  Login   │────▶│  Chat Home   │────▶│  Send Message    │────▶│  LLM Streams  │
│  Page    │     │  (conv list) │     │  "Let's play     │     │  Response     │
│          │     │              │     │   chess"          │     │  (~1s TTFT)   │
└──────────┘     └──────────────┘     └──────────────────┘     └───────┬───────┘
     │                                                                  │
     │  bcrypt verify                                    Intent: chess  │
     │  → JWT cookie                                                    │
     │  (~200ms)                                                        ▼
     │                                                    ┌───────────────────┐
     │                                                    │  Chess iframe     │
     │                                                    │  loads in panel   │
     │                                                    │  (~2s load)       │
     │                                                    │  ui_ready signal  │
     │                                                    └───────┬───────────┘
     │                                                            │
     │                                                            ▼
     │                                              ┌───────────────────────┐
     │                                              │  User plays moves     │
     │                                              │  e2→e4, chatbot       │
     │                                              │  analyzes FEN         │
     │                                              │  on "what should I    │
     │                                              │  do?" queries         │
     │                                              └───────────┬───────────┘
     │                                                          │
     │                                                          ▼
     │                                              ┌───────────────────────┐
     │                                              │  Checkmate detected   │
     │                                              │  App sends completion │
     │                                              │  signal → chatbot     │
     │                                              │  discusses results    │
     │                                              └───────────┬───────────┘
     │                                                          │
     │                                                          ▼
     │                                              ┌───────────────────────┐
     │                                              │  "Check the weather"  │
     │                                              │  → Weather iframe     │
     │                                              │  replaces chess       │
     │                                              │  (chess state saved)  │
     │                                              └───────────────────────┘
```

### Teacher Flow

```
┌──────────┐     ┌──────────────┐     ┌──────────────────┐
│  Login   │────▶│  Dashboard   │────▶│  App Whitelist   │
│  (teacher│     │  - Usage     │     │  Toggle per app  │
│   role)  │     │  - Students  │     │  Suspend if      │
│          │     │  - Apps      │     │  needed          │
└──────────┘     └──────────────┘     └──────────────────┘
```

### OAuth Flow (Spotify)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  "Make me a  │────▶│  Chatbot:    │────▶│  Popup opens │────▶│  Spotify     │
│   playlist"  │     │  "Connect    │     │  Spotify     │     │  auth page   │
│              │     │   Spotify?"  │     │  PKCE flow   │     │  (not iframe)│
└──────────────┘     └──────────────┘     └──────────────┘     └──────┬───────┘
                                                                      │
                                                                      ▼
                                                            ┌──────────────────┐
                                                            │  Callback →      │
                                                            │  tokens stored   │
                                                            │  server-side     │
                                                            │  (encrypted)     │
                                                            └────────┬─────────┘
                                                                     │
                                                                     ▼
                                                            ┌──────────────────┐
                                                            │  Spotify iframe  │
                                                            │  loads, playlist │
                                                            │  created via API │
                                                            └──────────────────┘
```

## API Endpoints

### Auth

**POST `/api/auth/login`**
```json
// Request
{ "username": "student1", "password": "student123" }
// Response: Sets httpOnly JWT cookie
{ "user": { "id": "uuid", "username": "student1", "role": "student", "display_name": "Student One" } }
```

**POST `/api/auth/refresh`**
```json
// Request: Refresh token in httpOnly cookie
// Response: New access token set in cookie
{ "message": "Token refreshed" }
```

### Conversations

**POST `/api/conversations`**
```json
// Request
{ "title": "Chess game" }
// Response
{ "id": "uuid", "title": "Chess game", "created_at": "2026-03-31T..." }
```

**POST `/api/conversations/{id}/messages`**
```json
// Request
{ "content": "Let's play chess" }
// Response: SSE stream
data: {"type": "token", "content": "Sure"}
data: {"type": "token", "content": "! Let"}
data: {"type": "tool_call", "app_id": "chess", "tool": "new_game", "params": {}}
data: {"type": "token", "content": "I've started a new chess game..."}
data: {"type": "done", "message_id": "uuid"}
```

### Apps

**GET `/api/apps`**
```json
// Response
[
  {
    "app_id": "chess",
    "name": "Chess",
    "description": "Interactive chess board with AI analysis",
    "auth_type": "none",
    "is_active": true,
    "tools": ["new_game", "make_move", "get_board_state", "analyze_position"]
  }
]
```

**POST `/api/apps/{app_id}/invoke`**
```json
// Request
{ "tool": "make_move", "params": { "from": "e2", "to": "e4" }, "correlation_id": "uuid" }
// Response
{ "correlation_id": "uuid", "result": { "fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1", "valid": true } }
```

## Example Queries

| Query | Expected Route | Expected Answer |
|-------|---------------|-----------------|
| "Let's play chess" | Chess app | Board renders, new game started, chatbot confirms |
| "What should I do next?" (mid-game) | Chess `analyze_position` | Chatbot reads FEN, suggests strategic move with explanation |
| "What's the weather in Tokyo?" | Weather app | Weather iframe shows Tokyo conditions, chatbot summarizes |
| "Help me study for my vocab test" | Clarification | "Would you like to use flashcards or look up words in the dictionary?" |
| "What's 247 × 38?" | Math Calculator | Calculator evaluates, chatbot relays exact result (9386) |
| "Define photosynthesis" | Dictionary app | Definition displayed, chatbot provides kid-friendly summary |
| "Make me a study playlist" | Spotify (OAuth check) | If connected: creates playlist. If not: prompts OAuth with kid-friendly explanation |
| "Help me plan my weekly meals" | Life Skills → meal planner | Meal planner tool activated within Life Skills app |
| "Book me a flight to Hawaii" | No app match | Chatbot politely declines: "I don't have a travel app, but I can help with chess, quizzes, weather..." |
| "Write me a violent story" | Content filter | LLM refuses, redirects to educational topics |
