# Mock API Server Setup

This guide explains how to run a mock API server for parallel frontend development without needing the full backend running.

## Overview

The mock server uses [Prism](https://stoplight.io/open-source/prism), which reads the OpenAPI specification and automatically generates mock responses that conform to your API schema.

**Benefits:**

- Zero code required - mocks are generated from the OpenAPI spec
- Always in sync with API contract (when spec is updated)
- Validates requests against the schema
- Supports all HTTP methods and response codes defined in the spec

## Quick Start

### Prerequisites

- Node.js 16+ (for `npx`)
- OpenAPI spec at `docs/api/openapi.json` (auto-generated)

### Step 1: Generate OpenAPI Spec

First, ensure you have the latest OpenAPI specification:

```bash
python scripts/export_openapi.py
```

### Step 2: Start the Mock Server

Run Prism mock server:

```bash
npx prism mock docs/api/openapi.json
```

By default, Prism starts on `http://localhost:4010`.

### Step 3: Configure Your Frontend

Update your frontend API client to use the mock server URL:

```javascript
// Development config
const API_BASE_URL = 'http://localhost:4010/api/v1';

// Production config
// const API_BASE_URL = 'https://your-api.com/api/v1';
```

## Usage Examples

### Get List of Colonies

```bash
curl http://localhost:4010/api/v1/colonies
```

Example response:

```json
[
  {
    "id": 1,
    "name": "string",
    "owner": "string",
    "colony_type": "hive_city",
    "age_days": 0,
    ...
  }
]
```

### Create a Colony

```bash
curl -X POST http://localhost:4010/api/v1/colonies \
  -H "Content-Type: application/json" \
  -d '{"name": "Hive Primus", "owner": "Rogue Trader", "colony_type": "hive_city"}'
```

### Authentication Endpoints

Mock server supports all auth endpoints:

```bash
curl -X POST http://localhost:4010/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "test_user", "email": "test@example.com", "password": "password123"}'
```

## Advanced Usage

### Dynamic Mock Responses

Prism can return different responses based on request content. Add a `Prefer` header:

```bash
# Request a specific response status
curl -H "Prefer: status=404" http://localhost:4010/api/v1/colonies/999

# Request example response from spec
curl -H "Prefer: code=201" http://localhost:4010/api/v1/colonies
```

### Proxy Mode (Passthrough)

You can configure Prism to proxy unknown requests to the real API:

```bash
npx prism mock docs/api/openapi.json --proxy http://localhost:8000
```

This is useful for hybrid development where some endpoints are implemented and others are still mocked.

### Custom Mock Data

Prism generates generic placeholder data. For more realistic Warhammer 40k-themed mock data, you can:

1. Add `example` fields to your Pydantic models in the API schemas
2. Re-export the OpenAPI spec
3. Prism will use these examples in mock responses

Example:

```python
class ColonyCreate(BaseModel):
    name: str = Field(..., example="Hive City Primus")
    owner: str = Field(..., example="Rogue Trader Von Draken")
    colony_type: ColonyType = Field(..., example="hive_city")
```

## Troubleshooting

### Port Already in Use

If port 4010 is busy, specify a different port:

```bash
npx prism mock docs/api/openapi.json -p 4011
```

### CORS Issues

Prism includes CORS headers by default. If you need custom CORS configuration, create a `prism-config.json`:

```json
{
  "cors": true,
  "errors": false
}
```

Then run:

```bash
npx prism mock docs/api/openapi.json --config prism-config.json
```

### Schema Validation Errors

If Prism reports validation errors, regenerate the OpenAPI spec:

```bash
python scripts/export_openapi.py
```

## Integration with Frontend Tools

### Postman

1. Import `docs/api/openapi.json` into Postman
2. Use the mock server URL as your environment base URL
3. All requests will return mock responses

### Insomnia

1. Import `docs/api/openapi.json` via "Import/Export"
2. Create a new environment with base URL `http://localhost:4010`
3. Test endpoints with auto-generated mock data

### OpenAPI Generators

Use the spec with OpenAPI Generator to create API clients:

```bash
openapi-generator generate -i docs/api/openapi.json -g typescript-axios -o ./src/api-client
```

## Stopping the Mock Server

Press `Ctrl+C` in the terminal where Prism is running.

## Additional Resources

- [Prism Documentation](https://stoplight.io/open-source/prism)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Frontend Developer Guide](FRONTEND_GUIDE.md)
