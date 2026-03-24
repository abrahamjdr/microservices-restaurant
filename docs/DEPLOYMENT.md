# Deployment Guide

## Local Development

```bash
cp .env.example .env
# Set OPENAI_API_KEY in .env
docker-compose up --build
```

Services start in order: postgres → kitchen/warehouse/market → api-gateway → frontend

## Deploy AI Service to AWS Lambda (Serverless Framework)

```bash
# Prerequisites: AWS credentials configured
cd services/ai-service
npm install

# Build and deploy
npm run build
npx serverless deploy

# Output will include a URL like:
# https://abc123.execute-api.us-east-1.amazonaws.com/dev
# Use this as AI_SERVICE_URL in Railway
```

## Deploy to Render

### Infrastructure

| Component                | Service                           |
| ------------------------ | --------------------------------- |
| PostgreSQL               | Supabase (one DB, three schemas)  |
| Redis                    | Upstash (BullMQ queues)           |
| Microservices + frontend | Render Web Services               |
| AI service               | AWS Lambda (Serverless Framework) |

### 1. Supabase — PostgreSQL

Create a project at supabase.com. Use the **connection pooler** URL (port 6543)
for each service, appending `?schema=<name>&pgbouncer=true`:

```
KITCHEN_DATABASE_URL=postgresql://...@pooler.supabase.com:6543/postgres?schema=kitchen&pgbouncer=true
WAREHOUSE_DATABASE_URL=postgresql://...@pooler.supabase.com:6543/postgres?schema=warehouse&pgbouncer=true
MARKET_DATABASE_URL=postgresql://...@pooler.supabase.com:6543/postgres?schema=market&pgbouncer=true
```

### 2. Upstash — Redis

Create a Redis database at upstash.com. Copy the `REDIS_URL` (starts with `rediss://`).
All services that use BullMQ share the same Upstash instance.

> **Note:** Upstash free tier uses `volatile-ttl` eviction policy. BullMQ
> recommends `noeviction` — you'll see a warning in logs but it functions correctly.

### 3. Deploy AI service to AWS Lambda

```bash
cd services/ai-service
npm install
npx serverless deploy
# Output: https://<id>.execute-api.<region>.amazonaws.com/dev
```

### 4. Create Render Web Services

Create one Web Service per microservice, all connected to the same GitHub repo:

| Service           | Root Directory               | Port |
| ----------------- | ---------------------------- | ---- |
| api-gateway       | `services/api-gateway`       | 8000 |
| kitchen-service   | `services/kitchen-service`   | 8001 |
| warehouse-service | `services/warehouse-service` | 8002 |
| market-service    | `services/market-service`    | 8003 |
| frontend          | `frontend/web`               | 3000 |

Each service auto-detects the Dockerfile. Set **Start Command** to `node dist/main.js`
(or leave blank if the Dockerfile handles it).

### 5. Environment variables

**api-gateway:**

```
PORT=8000
KITCHEN_SERVICE_URL=https://<kitchen-service>.onrender.com
WAREHOUSE_SERVICE_URL=https://<warehouse-service>.onrender.com
MARKET_SERVICE_URL=https://<market-service>.onrender.com
```

**kitchen-service:**

```
PORT=8001
KITCHEN_DATABASE_URL=<supabase-pooler-url>?schema=kitchen&pgbouncer=true
REDIS_URL=rediss://<upstash-url>
```

**warehouse-service:**

```
PORT=8002
WAREHOUSE_DATABASE_URL=<supabase-pooler-url>?schema=warehouse&pgbouncer=true
REDIS_URL=rediss://<upstash-url>
MARKET_SERVICE_URL=https://<market-service>.onrender.com
AI_SERVICE_URL=https://<id>.execute-api.<region>.amazonaws.com/dev
```

**market-service:**

```
PORT=8003
MARKET_DATABASE_URL=<supabase-pooler-url>?schema=market&pgbouncer=true
FARMERS_MARKET_API_URL=https://recruitment.alegra.com/api/farmers-market/buy
```

**frontend:**

```
NEXT_PUBLIC_API_URL=https://<api-gateway>.onrender.com
```

### 6. Public URLs

Enable **public** networking only on:

- `api-gateway` (consumed by the frontend)
- `frontend`

`kitchen-service`, `warehouse-service`, and `market-service` can remain public
or use Render's private network — they don't need to be reachable from the browser.

### 7. Trigger deployment

Push to `main` → Render auto-redeploys all connected services.
