# Product Content Studio

## Run from a clean clone

```bash
npm ci
cp .env.example .env
# Set JWT_SECRET (32+ characters), ADMIN_EMAIL, and ADMIN_PASSWORD in .env.
docker compose up -d db
npm run db:deploy
npm run db:seed
npm test
npm run lint
npm run typecheck
npm run build
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The admin login is at
`/admin/login`.

Integration tests use `TEST_DATABASE_URL`. Its database name must end in
`_test`; the test setup creates it and deploys migrations automatically.

## Authentication configuration

Sessions are HS256 JWTs in an `HttpOnly`, `SameSite=Lax` cookie and expire after
eight hours. Set `AUTH_COOKIE_SECURE=false` only when the application is served
over plain HTTP, such as a production build on local Docker Compose. When the
variable is omitted, secure cookies default to enabled only for
`NODE_ENV=production`.

## Known limitations

- Sessions are stateless. Logout clears the browser cookie but does not revoke a
  copied token before its expiry.
- Login rate limiting is not implemented yet.
- Registration, password reset, and roles are outside the current scope.
