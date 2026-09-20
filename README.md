# Product Content Studio

## Run from a clean clone

Create `.env` **before** `npm ci`. Prisma runs `generate` in `postinstall` and
reads `DATABASE_URL` from the environment (a dummy URL is used only for
`prisma generate` when the variable is still unset).

```bash
cp .env.example .env
# Set JWT_SECRET (32+ characters), ADMIN_EMAIL, and ADMIN_PASSWORD in .env.
# If host port 5432 is occupied, set POSTGRES_PORT to a free port (e.g. 55432)
# and use that same host port in DATABASE_URL and TEST_DATABASE_URL.
npm ci
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

If port 3000 is already in use:

```bash
PORT=3001 npm run dev
# or: npx next dev -p 3001
# After build: PORT=3001 npm start   or   npx next start -p 3001
```

`docker compose` reads `POSTGRES_PORT` from `.env`. `DATABASE_URL` and
`TEST_DATABASE_URL` must use that same host port. Integration tests use
`TEST_DATABASE_URL`. Its database name must end in `_test`; the test setup
creates it and deploys migrations automatically.

## E2E tests

Playwright covers the gaps Vitest cannot: a real browser, HttpOnly cookies and
redirects, server-rendered HTML, public-page freshness after publish/unpublish,
stored XSS, the editor's failed-save UI, and 375px vs 1280px layout. Schema
matrices, bcrypt, and JWT internals stay in Vitest. `npm test` does not run
Playwright.

Chromium is the only browser. Cookie, redirect, cache, and layout checks here
do not need Firefox or WebKit.

Install the browser once (this step needs network). Later runs are local:

```bash
npm run e2e:install
npm run test:e2e
```

The suite builds a production-like app (`next build` then `next start` on port
3100) against a dedicated database. Locally it reuses that server if it is
already up. Admin login uses `ADMIN_EMAIL` and `ADMIN_PASSWORD` from the
environment (the same placeholders as `.env.example`).

The E2E database is not `TEST_DATABASE_URL`. From that URL the name
`…_test` is rewritten to `…_e2e_test` (or set `E2E_DATABASE_URL` yourself).
The name must still end in `_test`, or setup refuses to run. Mutating specs
truncate and re-seed that database in `beforeEach`.

`workers` is `1` and `fullyParallel` is `false` because every test shares that
one database. Parallel workers would race on truncates and product rows.

Intentionally not covered: Firefox/WebKit, visual regression screenshots (R5;
brittle across fonts and CI), restart persistence of the production server, and
anything Vitest already asserts in-process.

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
