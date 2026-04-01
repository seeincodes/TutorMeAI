# ChatBridge — Cost Analysis Report

## LLM Costs (GPT-4.1-mini)

| Metric | Value |
|--------|-------|
| Input token price | $0.40 / 1M tokens |
| Output token price | $1.60 / 1M tokens |
| Average session (10 messages, 5 tool calls) | ~$0.012 |

### Projected Monthly Costs

| Users | Sessions/Month | LLM Cost | Infra (Railway) | Total |
|-------|---------------|----------|-----------------|-------|
| 100 | 300 | ~$3.60 | ~$5 | ~$9 |
| 1,000 | 3,000 | ~$36 | ~$10 | ~$46 |
| 10,000 | 30,000 | ~$360 | ~$25 | ~$385 |
| 100,000 | 300,000 | ~$3,600 | ~$100 | ~$3,700 |

### Token Optimization

- **Two-phase routing** saves ~40% input tokens by injecting only the target app's tool schemas instead of all 20+ schemas per turn
- **Dynamic schema injection** reduces average input tokens from ~2,000 to ~1,200 per tool-calling turn
- **Estimated savings at 10K users**: ~$144/month

## Infrastructure Costs (Railway)

| Service | Tier | Estimated Cost |
|---------|------|---------------|
| FastAPI backend | Starter | $5-25/month (usage-based) |
| PostgreSQL | Starter | $5-10/month |
| **Total infra** | | **$10-35/month** |

## Development Costs (Sprint)

| Category | Amount |
|----------|--------|
| OpenAI API (dev/testing) | ~$10-20 |
| Railway (dev environment) | ~$5-10 |
| LangSmith (free tier) | $0 |
| **Total dev spend** | **$15-30** |

## Cost Per Student

At TutorMeAI's scale (200K daily users):

| Metric | Value |
|--------|-------|
| Estimated monthly active users | 100,000 |
| Sessions per user per month | 3 |
| Monthly LLM cost | ~$3,600 |
| Monthly infra cost | ~$100 |
| **Cost per student per month** | **~$0.037** |

## Key Cost Drivers

1. **LLM output tokens** (4x more expensive than input) — keeping responses concise saves money
2. **Tool call overhead** — each tool call adds ~200-400 tokens of schema context
3. **Intent classification** — lightweight first pass (~100 tokens) avoids loading all schemas (~800 tokens saved)
4. **Streaming** — SSE doesn't add token cost, only network overhead
