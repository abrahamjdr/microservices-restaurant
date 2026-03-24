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
  ├── schema: warehouse (Inventory)
  └── schema: market    (Purchase)
```

Each service has its own Prisma schema pointed via `?schema=<name>` in the
connection URL. No cross-schema foreign keys — services are fully independent
at the data layer.

## Order Flow

The system uses an **async queue architecture** — kitchen and warehouse never
call each other via HTTP. All coordination goes through two BullMQ queues.

```
1. POST /api/orders { quantity: 3 }
   → 202 Accepted immediately (order = PENDING)

2. kitchen background (processOrderAsync):
   a. Order → IN_PROGRESS, SSE broadcast
   b. For each plate (sequential):
      - plate → IN_PROGRESS, SSE broadcast
      - Publish PlateReservationJob to [plate-reserve queue]
        { plateId, orderId, recipeId, recipeName, ingredients }

3. warehouse worker consumes [plate-reserve queue]:
   a. ReserveIngredientsUseCase:
      - FOR UPDATE lock on each ingredient row
      - Deduct stock (fail → BullMQ retries up to 5×, exponential backoff 2s)
   b. On success: record consumption in ConsumptionTracker
   c. Throttled AI analysis (max once/20s):
      - GET current inventory + consumption rates
      - POST to AI service (Lambda) — fallback to FallbackAnalyzer if unavailable
      - If refillNow=true for ingredient:
           → RefillIngredientUseCase(ingredient, qty)
           → market-service POST /buy → Alegra farmers-market API
           → log Purchase, add to inventory
   d. Publish PlateResultJob to [plate-result queue]
      { plateId, orderId, success, message }

4. kitchen worker consumes [plate-result queue]:
   a. plate → COMPLETED | FAILED, SSE broadcast
   b. If all plates terminal:
      - Order → COMPLETED (any succeeded) | FAILED (all failed)
      - SSE broadcast

5. Frontend EventSource receives order_updated / plate_updated events
```

**Timeout safety:** if a plate stays `IN_PROGRESS` for more than 2 minutes
(warehouse down or silent failure), the kitchen's `PlateResultWorker` watcher
marks it `FAILED` automatically every 30 seconds.

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
