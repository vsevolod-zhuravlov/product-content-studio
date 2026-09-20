# Product Content Studio API

All responses are JSON and include `Cache-Control: no-store`. Product APIs do
not send CORS headers.

## Authentication

Admin endpoints require the `pcs_session` HTTP-only cookie returned by
`POST /api/auth/login`.

```http
POST /api/auth/login
Content-Type: application/json

{"email":"admin@example.com","password":"your-password"}
```

Use a cookie jar with curl:

```bash
curl -c cookies.txt \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"your-password"}' \
  http://localhost:3000/api/auth/login
```

Missing, expired, or invalid sessions receive:

```json
{ "error": "Unauthorized" }
```

## Endpoints

| Method | Path                         | Authentication | Success                         |
| ------ | ---------------------------- | -------------- | ------------------------------- |
| `GET`  | `/api/admin/products`        | Admin cookie   | `200` admin product summaries   |
| `GET`  | `/api/admin/products/:id`    | Admin cookie   | `200` complete editable product |
| `PUT`  | `/api/admin/products/:id`    | Admin cookie   | `200` saved product             |
| `GET`  | `/api/public/products`       | None           | `200` published products        |
| `GET`  | `/api/public/products/:slug` | None           | `200` published product         |

Only the methods shown above are implemented. Next.js returns `405 Method Not
Allowed` for unsupported methods.

## Admin products

### List products

```bash
curl -b cookies.txt http://localhost:3000/api/admin/products
```

```json
{
  "data": [
    {
      "id": "cm123",
      "name": "Aurora X2",
      "status": "PUBLISHED",
      "updatedAt": "2026-09-20T10:00:00.000Z"
    }
  ]
}
```

Products are ordered by name. Drafts and published products are included.

### Get a product

```bash
curl -b cookies.txt http://localhost:3000/api/admin/products/cm123
```

```json
{
  "data": {
    "id": "cm123",
    "slug": "aurora-x2",
    "name": "Aurora X2",
    "specs": [{ "label": "Колір", "value": "Чорний" }],
    "description": "Опис",
    "seoTitle": "SEO title",
    "seoDescription": "SEO description",
    "status": "PUBLISHED",
    "updatedAt": "2026-09-20T10:00:00.000Z"
  }
}
```

An unknown or malformed ID returns `404` with `{ "error": "Not found" }`.

### Update a product

The request must be JSON and contain exactly the four editable fields.

```bash
curl -b cookies.txt -X PUT \
  -H 'Content-Type: application/json' \
  -d '{
    "description":"Оновлений опис",
    "seoTitle":"Оновлений заголовок",
    "seoDescription":"Оновлений SEO опис",
    "status":"PUBLISHED"
  }' \
  http://localhost:3000/api/admin/products/cm123
```

A successful response has the same shape as the admin product detail response.
Text is trimmed before saving. `name`, `slug`, and `specs` cannot be updated by
this endpoint.

Validation failures return `400`:

```json
{
  "error": "Validation failed",
  "fieldErrors": {
    "seoTitle": ["Максимум 60 символів"]
  }
}
```

Request bodies over 16 KiB return `413`. Non-JSON content returns `415`.
Cross-origin writes return `403`. Unknown products return `404`.

## Public products

### List published products

```bash
curl http://localhost:3000/api/public/products
```

```json
{
  "data": [
    {
      "slug": "aurora-x2",
      "name": "Aurora X2",
      "specs": [{ "label": "Колір", "value": "Чорний" }],
      "description": "Опис",
      "seoTitle": "SEO title",
      "seoDescription": "SEO description"
    }
  ]
}
```

Only published products are returned, ordered by name.

### Get a published product

```bash
curl http://localhost:3000/api/public/products/aurora-x2
```

The success object has the same fields as a public list item. Draft, unknown,
and invalid slugs all return the identical response:

```json
{ "error": "Not found" }
```

## Error statuses

| Status | Meaning                                   |
| ------ | ----------------------------------------- |
| `400`  | Invalid update body or malformed JSON     |
| `401`  | Missing or invalid admin session          |
| `403`  | Cross-origin admin write                  |
| `404`  | Product unavailable or identifier invalid |
| `413`  | Update body exceeds 16 KiB                |
| `415`  | Update content type is not JSON           |
| `500`  | Unexpected server error                   |

Unexpected failures return only `{ "error": "Internal server error" }`.
