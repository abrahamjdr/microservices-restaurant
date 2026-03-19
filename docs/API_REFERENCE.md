# API Reference

All endpoints are accessed via the API Gateway at `http://localhost:8000` (local) or your Railway URL (prod).

## Orders

### POST /api/orders
Create a new order.

**Request:**
```json
{ "quantity": 3 }
```

**Response 201:**
```json
{
  "order": {
    "id": "uuid",
    "status": "IN_PROGRESS",
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
  "inventory": [
    { "ingredient": "chicken", "quantity": 5, "updatedAt": "2024-01-01T00:00:00.000Z" }
  ]
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

## AI Recommendations

### POST /api/ai/recommend
Get recipe recommendations based on inventory.

**Request:**
```json
{
  "availableIngredients": {
    "tomato": 4,
    "rice": 2,
    "onion": 1
  },
  "orderHistory": ["Tomato Rice", "Chicken Stew"]
}
```

**Response 200:**
```json
{
  "recommendations": [
    {
      "recipeId": 1,
      "recipeName": "Tomato Rice",
      "score": 95,
      "reasoning": "All ingredients available with good surplus"
    }
  ],
  "generatedAt": "2024-01-01T00:00:00.000Z"
}
```

## Health Check

### GET /health
Any service responds with `{ "status": "ok", "service": "<name>" }`.
