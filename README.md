# Product Content Studio

A small product-card editor for an online store. A manager logs in, edits a
product's description, SEO title, SEO description and status, saves explicitly,
and publishes the card. Visitors see a catalog of published products and can
open their pages.

Stack: Next.js (App Router), TypeScript, Prisma, PostgreSQL, Zod, JWT cookie
auth, Tailwind + shadcn/ui, Vitest, Playwright, ESLint, Prettier, npm.

AI usage during development is described in [AI-WORKLOG.md](./AI-WORKLOG.md).

## Prerequisites

- Node.js **24** (see `.nvmrc` and `package.json` `engines.node`; this repo was
  run on v24.14.0)
- npm
- Docker (for the Compose PostgreSQL service)
- PostgreSQL **16** (Compose uses `postgres:16-alpine`). Without Docker, use any
  local PostgreSQL 16 and point `DATABASE_URL` and `TEST_DATABASE_URL` at it.

## Run the app from a clean clone

Create `.env` **before** `npm ci`. Prisma runs `generate` in `postinstall` and
reads `DATABASE_URL` from the environment (a dummy URL is used only for
`prisma generate` when the variable is still unset).

```bash
cp .env.example .env
```

Then edit `.env`:

- `JWT_SECRET` must be at least 32 characters. Generate one with
  `openssl rand -base64 32`, or on any OS with
  `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` can stay as the placeholders from
  `.env.example` for local use (`admin@example.com` / `change-me`). The password
  must be at least 8 characters.
- If host port 5432 is occupied, set `POSTGRES_PORT` to a free port (for example
  `55432`) and use that same host port in `DATABASE_URL` and
  `TEST_DATABASE_URL`.

```bash
npm ci
docker compose up -d db
npm run db:deploy
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the public catalog and
[http://localhost:3000/admin/login](http://localhost:3000/admin/login) for the
admin panel.

If port 3000 is already in use:

```bash
PORT=3001 npm run dev
# or: npx next dev -p 3001
# After build: PORT=3001 npm start   or   npx next start -p 3001
```

## Login

The seeded administrator is created from `ADMIN_EMAIL` and `ADMIN_PASSWORD` in
`.env`. With the placeholder values from `.env.example`:

| Field    | Value               |
| -------- | ------------------- |
| Email    | `admin@example.com` |
| Password | `change-me`         |

If you changed the values in `.env` before seeding, use those. Never commit
`.env`; only `.env.example` (placeholders, no secrets) is in the repository.

## Seed data

The seed writes **15 products** (10 published, 5 drafts) and **1 admin**. The
brief describes three demonstration products including a draft and a published
one; the seed is a superset of that so the catalog and the admin list are
realistic to click through. The seed is idempotent and does not overwrite edits
made in the admin panel when it is run again.

## Run the checks

```bash
npm test                 # Vitest: unit + integration (real PostgreSQL _test database)
npm run lint
npm run format:check
npm run typecheck        # runs `next typegen` first, so it works before `npm run build`
npm run build
npm run e2e:install      # once; downloads Chromium (needs network)
npm run test:e2e         # Playwright, builds and starts a production-like app
```

Integration tests use `TEST_DATABASE_URL`. Its database name must end in
`_test`; the test setup creates the database and deploys migrations
automatically. `docker compose` reads `POSTGRES_PORT` from `.env`, and
`DATABASE_URL` / `TEST_DATABASE_URL` must use that same host port.

### Scripts

| Script                  | What it does                                            |
| ----------------------- | ------------------------------------------------------- |
| `npm run dev`           | Development server                                      |
| `npm run build`         | Production build                                        |
| `npm start`             | Run the production build                                |
| `npm run db:deploy`     | Apply Prisma migrations                                 |
| `npm run db:seed`       | Seed the admin user and products                        |
| `npm test`              | Unit + integration tests (no Playwright)                |
| `npm run test:coverage` | Same tests with coverage                                |
| `npm run e2e:install`   | Install the Playwright browser (Chromium)               |
| `npm run test:e2e`      | Playwright end-to-end tests                             |
| `npm run lint`          | ESLint (`--max-warnings 0`)                             |
| `npm run format:check`  | Prettier check                                          |
| `npm run typecheck`     | `next typegen` + `tsc`                                  |

## Technical decisions

- **Next.js App Router** with REST route handlers under `src/app/api`. One
  process serves the UI and the API, so cookies stay same-origin and there is no
  CORS setup.
- **Prisma + PostgreSQL.** Product text columns are unbounded `TEXT`; length
  limits are enforced in Zod, not in the column type.
- **One Zod schema** (`productEditSchema`) is shared by the editor and the
  admin PUT handler. It is strict: unknown keys (for example `name`, `specs`,
  `slug`) are rejected, so name and specs cannot be changed through the API.
  Limits: description 1000, SEO title 60, SEO description 160, all non-empty
  after trim.
- **Stateless JWT** (HS256) in an `HttpOnly`, `SameSite=Lax` cookie with an
  8-hour lifetime. Set `AUTH_COOKIE_SECURE=false` only when the application is
  served over plain HTTP, such as a production build on local Docker. When the
  variable is omitted, secure cookies are enabled only for `NODE_ENV=production`.
- **Authorization is checked in two layers:** `proxy.ts` for fast redirects/401s,
  and inside every admin page and every `/api/admin` handler (the proxy is never
  the only guard).
- **Origin-based CSRF check** on non-GET admin writes (`isSameOrigin`).
- **Secrets** are read only on the server (`src/lib/env.ts`) and are not exposed
  to client code. `.env` is git-ignored; `.env.example` contains placeholders
  only.
- **DTO whitelisting** for public responses (`toPublicProduct` omits id, status
  and timestamps).
- **Public pages** (`/` and `/products/[slug]`) are `force-dynamic`. After a
  content or status change, `revalidatePath` runs for `/` and `/products/[slug]`,
  so a product taken off publication disappears immediately.
- **Drafts are hidden.** A draft slug and an unknown slug take the same
  not-found path (identical 404), on the public page and in the public API.
- **SEO fields** are used for the page: `generateMetadata` sets the `<title>`
  from the SEO title (without a site-name suffix) and the description from the
  SEO description.
- **Content cannot run as code.** Product description is rendered as text. There
  is no `dangerouslySetInnerHTML`; ESLint enforces `react/no-danger`.
- **Failed saves** in the editor keep the user's input, show an error state and
  never show a success message (covered by tests).
- **Character limits** count Unicode code points (`Array.from(value).length`);
  the editor counter and the server rule use the same helper.

## Testing strategy

Vitest is split into **unit** tests (no database) and **integration** tests
against a real PostgreSQL database whose name must end in `_test`. There are no
external APIs or API keys, so the suite runs offline after `npm ci`.

Why these levels:

- **Integration against a real database, no Prisma mocks.** Integration tests
  call route handlers and the product service in-process, so auth, validation,
  persistence and the public DTO shape are checked exactly as the API behaves.
  A mocked database could pass while the real rules are broken.
- **Rules are asserted on stored state.** Invalid direct API requests must not
  change the database, drafts must not leak through the public API, and status
  changes must move a product in and out of the public list; tests check the
  rows, not just the response codes.
- **Unit tests for pure logic:** the Zod schema boundaries, JWT/cookie helpers,
  redirect and origin checks, the character counter.
- **Hook-level jsdom test for the failed-save requirement** (`useProductForm`):
  a failed save must not reset the form or look successful.
- **Playwright for what only a browser can show** (see below); the rest of the UI
  is checked by hand.
- **Test quality was checked, not assumed:** the suite was run against 16
  hand-made mutants, and in shuffled order with several seeds (details in
  [AI-WORKLOG.md](./AI-WORKLOG.md)).

Tests isolate data by truncating the `_test` database in `beforeEach`. `npm test`
does not run Playwright. Coverage: `npm run test:coverage`.

## E2E tests

Playwright covers the gaps Vitest cannot: a real browser, HttpOnly cookies and
redirects, server-rendered HTML, public-page freshness after publish/unpublish,
stored XSS, the editor's failed-save UI, and 375px vs 1280px layout. Schema
matrices, bcrypt and JWT internals stay in Vitest.

Chromium is the only browser. Cookie, redirect, cache and layout checks here do
not need Firefox or WebKit.

The suite builds a production-like app (`next build` then `next start` on port
3100) against a dedicated database. Locally it reuses that server if it is
already up. Admin login uses `ADMIN_EMAIL` and `ADMIN_PASSWORD` from the
environment (the same placeholders as `.env.example`).

The E2E database is not `TEST_DATABASE_URL`. From that URL the name `…_test` is
rewritten to `…_e2e_test` (or set `E2E_DATABASE_URL` yourself). The name must
still end in `_test`, or setup refuses to run. Mutating specs truncate and
re-seed that database in `beforeEach`.

`workers` is `1` and `fullyParallel` is `false` because every test shares that
one database. Parallel workers would race on truncates and product rows.

Intentionally not covered: Firefox/WebKit, visual regression screenshots (R5;
brittle across fonts and CI, the test is skipped on purpose), restart
persistence of the production server, and anything Vitest already asserts
in-process.

## Check results

Measured in this repository on Node v24.14.0.

| Check                   | Result                                                          | Measured   |
| ----------------------- | --------------------------------------------------------------- | ---------- |
| `npm test`              | 279 tests passed (Vitest, unit + integration)                   | 2026-09-21 |
| `npm run test:e2e`      | 54 passed, 1 skipped (R5 visual regression, skipped on purpose) | 2026-09-21 |
| `npm run lint`          | passed (`--max-warnings 0`)                                     | 2026-09-21 |
| `npm run format:check`  | passed                                                          | 2026-09-21 |
| `npm run typecheck`     | passed (`next typegen` then `tsc`)                              | 2026-09-21 |
| `npm run build`         | succeeded                                                       | 2026-09-20 |
| `npm run test:coverage` | statements 50%, branches 42.15%, functions 35.63%, lines 50.12% | 2026-09-20 |

CI (GitHub Actions) runs lint, Prettier, typecheck, tests, build and e2e.

Overall coverage is low because UI components under `src/components/**` are
mostly untested by unit tests. Logic files are high. Per-file (2026-09-20 run):

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

## Bonus tasks

- **Design Tools:** drafts were made in Google Stitch and used as a source of
  ideas only; they contradict the task in several places, so the application
  deliberately differs from them. Link, differences and how the design was
  transferred to code are in [AI-WORKLOG.md](./AI-WORKLOG.md).
- **Infrastructure:** a GitHub Actions workflow runs the code checks, tests, e2e
  and the build. Docker Compose provides PostgreSQL (`db` service).
- **Not implemented:** LLM integration and Shopify import.

## Known limitations

- Sessions are stateless. Logout clears the browser cookie but does not revoke a
  copied token before its expiry.
- Login rate limiting is not implemented.
- Registration, password reset and roles are outside the scope of the task.
- Concurrent edits are last-write-wins; there is no optimistic-lock version.
- Character limits count Unicode code points (`Array.from(value).length`), not
  grapheme clusters. A combining sequence such as `e` + combining acute counts as
  two characters; a ZWJ emoji sequence counts as several characters.
- The browser Back button is not intercepted by the editor's unsaved-changes
  protection (only the app's own links and page unload are).
- `npm audit` reports high-severity advisories in the Prisma CLI dependency tree
  (`mysql2`; `npm audit fix --force` would install Prisma 6, a major downgrade).
  Left as is. `geopattern` also depends on a moderate `extend` advisory with no
  compatible fix.
- A local `next build` cache may contain env values on disk. It is git-ignored
  and is not shipped in the client bundle.
- UI component coverage by unit tests is low (see Check results).

## Time spent and unfinished parts

**Time spent:** about 8 hours in total. The core part (implementation of the admin panel, public pages and API, with unit and integration tests) took 4–6 hours, within the 6–8 hour guideline. The remaining time went to the Playwright e2e tests, the CI workflow, the audit-fix pass and UI polish.


**Unfinished or not done:**

- Login rate limiting and token revocation (see Known limitations).
- Bonus tasks: LLM integration and Shopify import.
- Unit/component tests for most UI components (coverage is concentrated on logic).
- Visual regression tests and Firefox/WebKit e2e (intentionally skipped).