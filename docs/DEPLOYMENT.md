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

## Deploy to Railway

### 1. Create Railway project

Go to railway.app → New Project → Empty Project

### 2. Add PostgreSQL

Add Plugin → PostgreSQL → copy the `DATABASE_URL`

### 3. Create services

Create one Railway service per Docker service:
- api-gateway
- kitchen-service
- warehouse-service
- market-service
- frontend

For each, connect your GitHub repo and set:
- **Root Directory:** `services/<name>` (or `frontend/web`)
- **Build Command:** `npm run build` (Railway auto-detects Dockerfile)

### 4. Environment variables

**api-gateway:**
```
PORT=8000
KITCHEN_SERVICE_URL=http://kitchen-service.railway.internal:8001
WAREHOUSE_SERVICE_URL=http://warehouse-service.railway.internal:8002
MARKET_SERVICE_URL=http://market-service.railway.internal:8003
AI_SERVICE_URL=https://<lambda-url>.execute-api.us-east-1.amazonaws.com/dev
```

**kitchen-service:**
```
PORT=8001
KITCHEN_DATABASE_URL=<postgresql-url>?schema=kitchen
WAREHOUSE_SERVICE_URL=http://warehouse-service.railway.internal:8002
```

**warehouse-service:**
```
PORT=8002
WAREHOUSE_DATABASE_URL=<postgresql-url>?schema=warehouse
MARKET_SERVICE_URL=http://market-service.railway.internal:8003
```

**market-service:**
```
PORT=8003
MARKET_DATABASE_URL=<postgresql-url>?schema=market
FARMERS_MARKET_API_URL=https://recruitment.alegra.com/api/farmers-market/buy
```

**frontend:**
```
NEXT_PUBLIC_API_URL=https://<api-gateway-railway-url>
```

### 5. Public URLs

Enable public networking on:
- api-gateway (exposes port 8000)
- frontend (exposes port 3000)

All other services use Railway's private network.

### 6. Trigger deployment

Push to `main` → Railway auto-redeploys all services.
