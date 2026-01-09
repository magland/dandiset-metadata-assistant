# Dandiset Metadata Proxy

A Cloudflare Worker proxy server that validates and forwards metadata commits to the DANDI Archive API. This proxy solves CORS issues and provides server-side validation before committing metadata changes.

## Features

- **CORS Handling**: Allows requests from authorized origins (localhost and production app)
- **Basic Validation**: Validates essential metadata requirements before forwarding
- **Security**: Origin allowlist prevents unauthorized access
- **Error Handling**: Clear error messages for validation failures and API errors
- **Lightweight**: No dependencies, optimized for Cloudflare Workers

## Setup

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Cloudflare account (for deployment)

### Installation

```bash
cd proxy
npm install
```

### Development

Run the worker locally:

```bash
npm run dev
```

The worker will be available at `http://localhost:8787`.

## Testing Locally

You can test the proxy with curl:

```bash
# Health check
curl http://localhost:8787/health

# Test commit (requires valid API key and metadata)
curl -X POST http://localhost:8787/commit \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5173" \
  -d '{
    "dandisetId": "000003",
    "version": "draft",
    "metadata": {...},
    "apiKey": "your-api-key"
  }'
```

## Deployment

### 1. Configure Wrangler

Make sure you're logged in to Cloudflare:

```bash
npx wrangler login
```

### 2. Deploy to Cloudflare Workers

```bash
npm run deploy
```

This will deploy the worker to Cloudflare and provide you with a URL like:
`https://dandiset-metadata-proxy.your-subdomain.workers.dev`

### 3. Update Client Configuration

Update the `.env` file in the main project:

```env
VITE_PROXY_URL=https://dandiset-metadata-proxy.your-subdomain.workers.dev
```

## API Endpoints

### POST /commit

Validates and commits metadata changes to DANDI.

**Request Body:**
```json
{
  "dandisetId": "string",
  "version": "string",
  "metadata": {},
  "apiKey": "string"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Metadata committed successfully",
  "data": {...}
}
```

**Error Responses:**

- `400` - Validation failed or invalid request
- `403` - Origin not allowed
- `500` - Internal server error

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "dandiset-metadata-proxy",
  "version": "1.0.0"
}
```

## Security

### Allowed Origins

The proxy only accepts requests from:
- `http://localhost:5173` (development)
- `https://magland.github.io` (production)

To add additional origins, modify the `ALLOWED_ORIGINS` array in `src/index.ts`.

### API Key Handling

API keys are forwarded to the DANDI API but not stored or logged by the proxy. The proxy validates that an API key is present but does not verify it (DANDI handles authentication).

## Validation

The proxy performs basic validation of metadata to check:
- Required fields are present (id, name, description, contributor, license, etc.)
- Field types are correct (strings, arrays, etc.)
- Non-empty values where required

**Note**: Full JSON schema validation is performed client-side before sending to the proxy. The proxy's validation serves as a lightweight safety check, ensuring the most critical requirements are met before forwarding to DANDI.

## Troubleshooting

### CORS Errors

If you see CORS errors, ensure:
1. Your origin is in the `ALLOWED_ORIGINS` list
2. You're sending the `Origin` header with requests
3. The proxy is running and accessible

### Validation Errors

The proxy will return detailed validation errors if metadata doesn't match the schema. Check the `validationErrors` field in the error response for details.

### Deployment Issues

- Make sure you're logged in: `npx wrangler login`
- Check your Cloudflare account has Workers enabled
- Verify the worker name in `wrangler.toml` is unique

## Development

### Project Structure

```
proxy/
├── src/
│   ├── index.ts       # Main worker entry point and routing
│   └── validation.ts  # JSON schema validation logic
├── package.json       # Dependencies
├── tsconfig.json      # TypeScript configuration
└── wrangler.toml      # Cloudflare Worker configuration
```

### Adding Features

To add new endpoints or modify validation logic, edit the appropriate files in `src/`.

## License

Same as the parent project.
