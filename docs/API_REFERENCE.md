# API Reference

All endpoints are accessed via the API Gateway at `http://localhost:8000` (local) or your Railway URL (prod).

## Orders

### POST /api/orders

Create a new order. Returns immediately (**202 Accepted**) — the kitchen processes
plates asynchronously. Track progress via the SSE stream.

Returns **503** with `{ "error": "Kitchen at capacity, try again shortly" }` if the
reservation queue has more than 20 active/waiting jobs.

**Request:**

```json
{ "quantity": 3 }
```

**Response 202:**

```json
{
  "order": {
    "id": "uuid",
    "status": "PENDING",
    "totalPlates": 3,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "completedAt": null,
    "plates": [
      {
        "id": "uuid",
        "orderId": "uuid",
        "recipeId": 2,
        "recipeName": "Chicken Salad",
        "status": "PENDING",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "completedAt": null
      }
    ]
  }
}
```

The order transitions to `IN_PROGRESS` seconds later when background processing starts,
then to `COMPLETED` or `FAILED` once all plates are resolved. Subscribe to SSE to
receive these updates in real time.

### GET /api/orders

List all orders with plates.

**Response 200:**

```json
{ "orders": [ ...OrderDTO ] }
```

### GET /api/orders/:id

Single order by ID.

### GET /api/orders/stream

Server-Sent Events stream. Connect with `EventSource`.

**Events:**

- `order_updated` — full Order object
- `plate_updated` — single Plate object

```javascript
const es = new EventSource('http://localhost:8000/api/orders/stream');
es.addEventListener('order_updated', (e) => console.log(JSON.parse(e.data)));
```

## Recipes

### GET /api/recipes

All 6 static recipes.

**Response 200:**

```json
{
  "recipes": [
    {
      "id": 1,
      "name": "Tomato Rice",
      "ingredients": [
        { "ingredient": "tomato", "quantity": 2 },
        { "ingredient": "rice", "quantity": 1 },
        { "ingredient": "onion", "quantity": 1 }
      ]
    }
  ]
}
```

## Inventory

### GET /api/inventory

Current stock levels for all ingredients.

**Response 200:**

```json
{
  "inventory": [{ "ingredient": "chicken", "quantity": 5, "updatedAt": "2024-01-01T00:00:00.000Z" }]
}
```

## Purchases

### GET /api/purchases

Purchase history from the farmers market.

**Response 200:**

```json
{
  "purchases": [
    {
      "id": "uuid",
      "ingredient": "tomato",
      "quantityReceived": 3,
      "requestedAt": "2024-01-01T00:00:00.000Z",
      "success": true
    }
  ]
}
```

## AI Inventory Analysis

### GET /api/inventory/analysis

Returns the latest AI analysis of inventory state (cached in memory, updated after
each ingredient reservation attempt). No external call is made on each request.

**Response 200:**

```json
{
  "analysis": {
    "summary": "Several ingredients are critically low and require immediate attention.",
    "analyzedAt": "2024-01-01T00:00:00.000Z",
    "analysis": [
      {
        "ingredient": "chicken",
        "status": "critical",
        "currentStock": 0,
        "consumptionRatePerHour": 12.5,
        "estimatedMinutesRemaining": 0,
        "recommendedRefillQty": 5,
        "refillNow": true,
        "insight": "Stock depleted. Immediate purchase required."
      }
    ]
  }
}
```

`status` values: `critical` | `low` | `good` | `unknown`

### POST /api/inventory/reset

Resets all 10 ingredients to 5 units each and clears AI consumption tracking.

**Response 200:**

```json
{ "message": "Inventory reset to 5 units per ingredient" }
```

## Health Check

### GET /health

Any service responds with `{ "status": "ok", "service": "<name>" }`.
