# Alegra — Restaurant Automation System

A full microservices backend + Next.js frontend that automates a restaurant's free-food donation event.

## Architecture

```
POST /api/orders → api-gateway → kitchen-service
                                    ↓ (random recipe selection)
                              warehouse-service (FOR UPDATE lock)
                                    ↓ (if out of stock)
                              market-service → farmers-market API
                                    ↓ (restock + reserve)
                              kitchen-service (plate marked COMPLETED)
                                    ↓ (SSE broadcast)
                              frontend (real-time update)
```

## Tech Stack

| Layer | Choice |
|---|---|
| Backend | Pure Node.js `http` module + TypeScript |
| Architecture | Hexagonal (Ports & Adapters) |
| ORM | Prisma + PostgreSQL |
| Frontend | Next.js 14 + Tailwind CSS |
| AI | OpenAI GPT-4o via axios |
| AI Deploy | Serverless Framework → AWS Lambda |
| HTTP Client | Axios |
| Monorepo | npm workspaces |
| Commit hooks | Husky + Commitlint + lint-staged |

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url>
cd reto-alegra-restaurant
cp .env.example .env
# Edit .env — add your OPENAI_API_KEY

# 2. Start everything
docker-compose up --build

# 3. Open browser
open http://localhost:3000
```

The API is available at `http://localhost:8000`.

## Services

| Service | Port | Purpose |
|---|---|---|
| api-gateway | 8000 | Single public entry point |
| kitchen-service | 8001 | Order management + recipe selection |
| warehouse-service | 8002 | Inventory + purchasing trigger |
| market-service | 8003 | Farmers market proxy |
| ai-service | 8004 (local) / AWS Lambda (prod) | AI recipe recommendations |
| frontend | 3000 | Next.js dashboard |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | /api/orders | Create order `{ quantity: number }` |
| GET | /api/orders | List all orders |
| GET | /api/orders/:id | Single order |
| GET | /api/orders/stream | SSE real-time updates |
| GET | /api/recipes | All 6 recipes |
| GET | /api/inventory | Current stock levels |
| GET | /api/purchases | Purchase history |
| POST | /api/ai/recommend | AI recipe recommendations |

## Recipes

1. **Tomato Rice** — tomato×2, rice×1, onion×1
2. **Chicken Salad** — chicken×1, lettuce×2, lemon×1, cheese×1
3. **Meat & Potatoes** — meat×1, potato×2, ketchup×1
4. **Cheesy Lemon Rice** — rice×2, cheese×2, lemon×1
5. **Classic Burger** — meat×1, lettuce×1, tomato×1, onion×1, ketchup×1
6. **Chicken Stew** — chicken×2, potato×1, tomato×1, onion×1

## Running Tests

```bash
# All services
npm test --workspaces --if-present

# Single service
cd services/kitchen-service && npm test
```

## Deploy AI Service to AWS Lambda

```bash
cd services/ai-service
npm run build
npx serverless deploy
# Copy the output URL and set it as AI_SERVICE_URL for warehouse-service
```

## Deployment (single VM + Vercel)

See `docs/DEPLOYMENT.md`: docker compose + Caddy on an Oracle ARM64 VM, frontend on Vercel.

## Commit Convention

Scopes: `gateway | kitchen | warehouse | market | ai | frontend | shared | docker | docs | deps`

```
feat(kitchen): add recipe random selection
fix(warehouse): resolve race condition via FOR UPDATE lock
docs(api): document all endpoints
```
