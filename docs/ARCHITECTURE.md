# Architecture

## System Diagram

```
Browser (port 3000)
    │
    ▼
frontend (Next.js)
    │  REST + SSE
    ▼
api-gateway (port 8000) ←── Single public entry point
    │
    ├─── kitchen-service (port 8001) ──┐
    │         DB: schema=kitchen       │ axios
    │                                  ▼
    ├─── warehouse-service (port 8002) ──┐
    │         DB: schema=warehouse       │ axios
    │                                    ▼
    ├─── market-service (port 8003)
    │         DB: schema=market
    │         External: recruitment.alegra.com
    │
    └─── ai-service (port 8004 local / AWS Lambda prod)
              External: OpenAI API
```

## Hexagonal Architecture (per service)

Every service follows the same layered structure:

```
src/
├── domain/           # Pure business logic — no I/O
│   ├── entities/     # Data objects with business rules
│   ├── repositories/ # Output port interfaces
│   └── services/     # Domain services (pure functions)
├── application/
│   ├── ports/        # Additional output port interfaces
│   └── usecases/     # One use case per file
├── infrastructure/
│   ├── database/     # Prisma implementations
│   └── adapters/     # Axios implementations
└── interfaces/
    └── http/
        ├── Router.ts      # Pure Node.js routing
        └── *Controller.ts # Parse req → usecase → JSON
```

## Database Strategy

Single PostgreSQL instance with schema-level isolation:

```
postgresql://user:pass@postgres:5432/restaurant
  ├── schema: kitchen   (Order, Plate)
  ├── schema: warehouse (Inventory, PurchaseLog)
  └── schema: market    (Purchase)
```

Each service has its own Prisma schema with `?schema=<name>` in the URL. No cross-schema foreign keys.

## Order Flow

```
1. POST /api/orders { quantity: 3 }
2. kitchen: creates Order (PENDING)
3. kitchen: creates 3 Plates (PENDING), selects random recipe per plate
4. kitchen: sets Order → IN_PROGRESS, broadcasts SSE
5. kitchen: Promise.allSettled([processPlate×3])
   Per plate:
   a. plate → IN_PROGRESS
   b. POST warehouse:/internal/reserve { ingredients }
      i. FOR UPDATE lock on each ingredient
      ii. If qty < needed → call market-service /buy
          market-service → GET farmers-market-api?ingredient=X
          logs result in Purchase table
          adds to inventory
      iii. deduct from inventory
   c. plate → COMPLETED | FAILED
   d. SSE broadcast
6. kitchen: Order → COMPLETED | FAILED
7. SSE broadcast to frontend
```

## Race Condition Prevention

```sql
-- PrismaInventoryRepository.ts
SELECT * FROM "warehouse"."Inventory"
WHERE ingredient = $1
FOR UPDATE          -- blocks concurrent transactions on same row
```

Combined with a Prisma `$transaction`, this ensures two simultaneous plate requests for the same ingredient cannot oversell inventory.

## SSE Architecture

```
kitchen-service SseManager (in-memory Set<ServerResponse>)
    ↑ addClient()    broadcast()
    │                     │
api-gateway (proxySse)    kitchen usecases (plate/order updates)
    ↑
frontend EventSource
```
