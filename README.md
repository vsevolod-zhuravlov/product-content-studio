# Product Content Studio

Admin and public catalog for product content: Next.js App Router, Prisma,
PostgreSQL, Zod, JWT cookie auth.

## Prerequisites

- Node.js **24** (see `.nvmrc` and `package.json` `engines.node`; this repo was
  run on v24.14.0)
- npm
- Docker (for the Compose PostgreSQL service)

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
npm run format:check
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

`npm run typecheck` runs `next typegen` first, so it succeeds on a clean
clone before `npm run build`.

## Login

The seeded admin is created from `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`.
Placeholder values in `.env.example` are `admin@example.com` and `change-me`
(the password must be at least 8 characters; set a real local password in
`.env`). Do not commit `.env`.

## Seed data

The seed writes **15 products** (10 published, 5 drafts) and **1 admin**. The
brief asks for at least three products including a draft and a published one;
more rows make the catalog and admin list realistic to click through.

## Technical decisions

- **Next.js App Router** with REST route handlers under `src/app/api`.
- **Prisma + PostgreSQL.** Product text columns are unbounded `TEXT`; length
  limits are enforced in Zod, not in the column type.
- **One Zod schema** (`productEditSchema`) is shared by the editor and the
  admin PUT handler.
- **Stateless JWT** (HS256) in an `HttpOnly`, `SameSite=Lax` cookie with an
  8-hour lifetime.
- **Origin-based CSRF check** on non-GET admin writes (`isSameOrigin`).
- **DTO whitelisting** for public responses (`toPublicProduct` omits id,
  status, timestamps).
- Public catalog/product pages are `force-dynamic`. After a content or status
  change, `revalidatePath` runs for `/` and `/products/[slug]`.
- A **draft slug and an unknown slug** take the same not-found path (identical
  404).
- Product description is rendered as text. There is no
  `dangerouslySetInnerHTML`; ESLint enforces `react/no-danger`.

## Testing strategy

Vitest is split into **unit** tests (no database) and **integration** tests
against a real PostgreSQL database whose name must end in `_test`. There are
no external APIs or API keys.

Integration tests call route handlers and the product service in-process so
auth, validation, persistence, and public DTO shape are checked without a
browser. The failed-save requirement for the editor is covered by a hook-level
jsdom test (`useProductForm`); the rest of the UI is checked with Playwright
and by hand.

Tests isolate data by truncating the `_test` database in `beforeEach`. `npm
test` does not run Playwright.

Coverage: `npm run test:coverage`.

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

The suite builds a production-like app (`next build` then `next start` on port 3100) against a dedicated database. Locally it reuses that server if it is
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

## Check results

Measured on 2026-09-20, Node v24.14.0, in this repository:

| Check                   | Result                                                           |
| ----------------------- | ---------------------------------------------------------------- |
| `npm test`              | 21 files, 277 tests passed (19.31s, then 19.37s on a second run) |
| `npm run lint`          | 0 errors, 0 warnings (`--max-warnings 0`)                        |
| `npm run format:check`  | exit 0                                                           |
| `npm run typecheck`     | exit 0 (`next typegen` then `tsc`)                               |
| `npm run build`         | succeeded                                                        |
| `npm run test:coverage` | statements 50%, branches 42.15%, functions 35.63%, lines 50.12%  |

Overall coverage is low because UI components under `src/components/**` are
mostly untested. Logic files are high. Per-file **statements** (same run):

| File                                      | Stmts  | Branch | Funcs  | Lines  |
| ----------------------------------------- | ------ | ------ | ------ | ------ |
| `src/lib/validation/product.ts`           | 100%   | 100%   | 100%   | 100%   |
| `src/lib/auth/session.ts`                 | 100%   | 100%   | 100%   | 100%   |
| `src/lib/auth/guard.ts`                   | 100%   | 100%   | 100%   | 100%   |
| `src/lib/auth/password.ts`                | 100%   | 100%   | 100%   | 100%   |
| `src/lib/auth/cookie.ts`                  | 100%   | 100%   | 100%   | 100%   |
| `src/lib/product-editor.ts`               | 100%   | 100%   | 100%   | 100%   |
| `src/server/products/products.service.ts` | 96.42% | 94.44% | 100%   | 96.42% |
| `src/lib/api/client.ts`                   | 94.73% | 88.88% | 100%   | 94.73% |
| `src/lib/auth/jwt.ts`                     | 87.5%  | 83.33% | 100%   | 87.5%  |
| `src/hooks/useProductForm.ts`             | 82.66% | 76.66% | 81.81% | 83.33% |

## Known limitations

- Sessions are stateless. Logout clears the browser cookie but does not revoke a
  copied token before its expiry.
- Login rate limiting is not implemented yet.
- Registration, password reset, and roles are outside the current scope.
- Concurrent edits are last-write-wins; there is no optimistic-lock version.
- Character limits count Unicode code points (`Array.from(value).length`), not
  grapheme clusters. A combining sequence such as `e` + combining acute counts
  as two characters.
- `npm audit` reports high-severity advisories in the Prisma CLI dependency
  tree (`mysql2`; `npm audit fix --force` would install Prisma 6, a major
  downgrade). Left as is. `geopattern` also depends on a moderate `extend`
  advisory with no compatible fix.
- A local `next build` cache may contain env values on disk. It is git-ignored
  and is not shipped in the client bundle.

## Time spent and unfinished parts

<!-- TODO(owner): actual time spent and unfinished parts -->
