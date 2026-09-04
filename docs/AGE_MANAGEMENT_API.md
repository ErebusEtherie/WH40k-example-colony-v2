# Colony Age Management API

## Endpoint

```
POST /api/v1/colonies/{colony_id}/age
```

## Request Body

Accepts a JSON object with **one** of the following operations:

### 1. Add Days (Increase or Decrease)

```json
{
  "add": 90
}
```

Adds days to the current age. Use negative values to decrease:

```json
{
  "add": -30
}
```

### 2. Set Age (Absolute Value)

```json
{
  "set": 365
}
```

Sets the colony age to a specific value (must be ≥ 0).

### 3. Subtract Days

```json
{
  "subtract": 45
}
```

Subtracts days from the current age (result must be ≥ 0).

## Examples

### Advance by 1 Quarter (90 days)

```bash
curl -X POST http://localhost:8001/api/v1/colonies/1/age \
  -H "Content-Type: application/json" \
  -d '{"add": 90}'
```

### Decrease Age by 10 Days

```bash
curl -X POST http://localhost:8001/api/v1/colonies/1/age \
  -H "Content-Type: application/json" \
  -d '{"add": -10}'
```

### Set Age to Specific Value

```bash
curl -X POST http://localhost:8001/api/v1/colonies/1/age \
  -H "Content-Type: application/json" \
  -d '{"set": 500}'
```

### Using Subtract Operation

```bash
curl -X POST http://localhost:8001/api/v1/colonies/1/age \
  -H "Content-Type: application/json" \
  -d '{"subtract": 30}'
```

## Response

Returns the updated colony with full state:

```json
{
  "id": 1,
  "name": "Example Colony",
  "age_days": 455,
  "age_last_updated": "2026-09-04",
  "state": {
    "size": { "base": 10, "current": 10, "lore_state": "Steady" },
    "complacency": { "base": 5, "current": 5, "lore_state": "Normal" },
    ...
  },
  ...
}
```

## Error Responses

### 400 Bad Request

```json
{
  "detail": "One of 'add', 'set', or 'subtract' must be provided"
}
```

```json
{
  "detail": "Age cannot be negative. Result would be -10 days."
}
```

### 404 Not Found

```json
{
  "detail": "Colony not found"
}
```

## Frontend Usage

```typescript
// Advance age by 90 days (1 quarter)
await apiFetch(`/api/v1/colonies/${colonyId}/age`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ add: 90 }),
});

// Decrease age by 30 days
await apiFetch(`/api/v1/colonies/${colonyId}/age`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ add: -30 }),
});

// Set age to specific value
await apiFetch(`/api/v1/colonies/${colonyId}/age`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ set: 1000 }),
});

// Subtract days
await apiFetch(`/api/v1/colonies/${colonyId}/age`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ subtract: 50 }),
});
```

## Notes

- Only users with "edit" permission can modify colony age
- Age cannot be negative - attempts will return 400 error
- The `add` field is the most flexible - use positive or negative values
- The `set` field is useful for correcting age to a specific value
- The `subtract` field is explicit for subtraction operations
- All operations validate that the result is ≥ 0
