# AI work log

## 1. Tools and models

| Tool                                                    | Models                        | What I used it for                                                                                                                                                                                                            |
| ------------------------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cursor IDE (Agent mode, chat, Tab)                      | GPT-5.6 Sol                   | Writing the automated tests and running audits of the repository                                                                                                                                                              |
| Cursor IDE                                              | Composer 2.5, Cursor Grok 4.6 | Lighter tasks and quick edits (scaffolding, small fixes, styling, documentation tweaks)                                                                                                                                       |
| Claude (chat, and inside Cursor for the audit-fix pass) | Claude Sonnet 5               | Planning and architecture discussion, writing the step-by-step prompts for the Cursor agents, reviewing agent output and design screenshots against the task requirements, applying the audit fixes together with Cursor Grok |
| Google Stitch                                           | Gemini Flash (used by Stitch) | Source of design ideas only (see section 5)                                                                                                                                                                                   |

## 2. How I worked

1. In the Claude chat I turned the task brief into an 8-step plan (setup → database → validation/service → auth → REST API → admin UI → public UI → tests and docs) and made the architecture decisions: Next.js with Route Handlers instead of React + Nest, JWT in an httpOnly cookie, Zod on the client and the server, Prisma + PostgreSQL, Vitest + Playwright.
2. For every step I wrote a detailed prompt for a Cursor agent: exact scope and non-goals, security constraints, tests written first with a failing run before the implementation, a mutation check, and manual verification commands.
3. I reviewed each diff and re-ran the checks myself (lint, typecheck, build, tests, curl and browser checks) before committing. The git history has one commit per step, for example [`9664a8d`](https://github.com/vsevolod-zhuravlov/product-content-studio/commit/9664a8d) database layer, [`c2c6383`](https://github.com/vsevolod-zhuravlov/product-content-studio/commit/c2c6383) validation and service, [`f1bee4e`](https://github.com/vsevolod-zhuravlov/product-content-studio/commit/f1bee4e) auth, [`959995f`](https://github.com/vsevolod-zhuravlov/product-content-studio/commit/959995f) REST API, [`f7737b2`](https://github.com/vsevolod-zhuravlov/product-content-studio/commit/f7737b2) admin UI, [`b029157`](https://github.com/vsevolod-zhuravlov/product-content-studio/commit/b029157) public UI.
4. For the look of the UI I used Google Stitch only as a source of ideas. I described the ideas I liked in my own words in the prompts, and the agent implemented the UI from those prompts.
5. After the features were done, an audit of the repository (runtime behavior, tests, documentation) produced findings F1–F13. Claude Sonnet 5 and Cursor Grok applied the fixes on the branch `chore/audit-fixes`; I reviewed the audit and every fix afterwards.

## 3. AI contribution vs. my contribution

| Area                                                               | AI                                                                 | Me                                                                                                                                                                |
| ------------------------------------------------------------------ | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stack and architecture                                             | Options and trade-offs in chat                                     | Chose and justified them (Next.js Route Handlers, JWT cookie, Zod, Prisma/PostgreSQL, npm, Vitest + Playwright)                                                   |
| Code                                                               | Wrote most of the implementation and the first drafts of the tests | Defined scope, security rules and acceptance checks per step; reviewed and corrected the output                                                                   |
| Security-sensitive parts (auth, validation, draft visibility, XSS) | Implemented to my written rules                                    | Specified the rules (server-side validation, guards inside every admin handler, drafts return 404, plain-text rendering) and verified them by hand and with tests |
| Design                                                             | Stitch produced draft screens                                      | Judged them against the brief, kept the useful ideas and rewrote the rest in my prompts (section 5)                                                               |
| Tests                                                              | Drafted unit, integration and e2e tests                            | Required tests first and mutation checks, judged the quality of the tests, ran the mutations myself (Examples 1–3)                                                |
| Documentation                                                      | Drafts                                                             | README results and this log are based on commands I actually ran                                                                                                  |

## 4. Decisions about AI-generated code

### Example 1. Character limits: the plan I gave the AI was wrong, and a "characterization" test went stale

**What happened.** The plan I gave the agent for the validation step counted the limits (description 1000, SEO title 60, SEO description 160) with `String.length`. An emoji is two UTF-16 units, so the editor counter and the server rule could disagree at the boundary: 59 letters + 😀 is 60 Unicode code points (the server accepts it) but 61 UTF-16 units (the counter showed `61 / 60`). An e2e "characterization" test (E11) documented that mismatch.

**What I decided.** Count Unicode code points everywhere. The counter and the Zod schema now share one `countCharacters` helper (`Array.from(value).length`), commit [`e937966`](https://github.com/vsevolod-zhuravlov/product-content-studio/commit/e937966). I deliberately did not count grapheme clusters; the README lists this as a known limitation (a ZWJ emoji sequence counts as several characters).

**How I verified it.**

- CI caught the consequence: E11 still expected the old behavior (`60 / 60` and `61 / 60`) while the fixed counter showed `59 / 60` and `60 / 60`. The app was right and the test was stale, so I rewrote E11 as a regression test with the boundary at 60 / 61 code points (59 letters + 😀 is saved, 60 letters + 😀 is blocked, and no PUT request is sent).
- The same boundary is tested against the API (`tests/integration/api/admin-products.test.ts`: 200 for 60 code points, 400 for 61, database unchanged; each test asserts its own premise, e.g. `expect(seoTitle.length).toBe(61)`) and in a unit test that compares the counter and the schema on ASCII, Cyrillic, emoji and combining sequences at every field limit (`tests/unit/characters.test.ts`).
- Mutations, both reverted afterwards: the counter switched back to UTF-16 makes E11 fail (`61 / 60` instead of `60 / 60`); the schema switched back to `value.length` makes the API accept test fail (400 instead of 200).

**What I learned.** A plan written with AI can be wrong too, and a test that documents a bug must be updated or deleted when the bug is fixed. `npm test` does not run Playwright, so only CI noticed.

### Example 2. Mutation testing found a gap in AI-written tests

**What happened.** Together with the agent I made 16 mutants and ran them against the suite myself. Mutant 14 (in `src/hooks/useProductForm.ts`, a failed `saveProduct` result reset the form and showed a success toast) survived because `useProductForm` had no tests. That is exactly the behavior the task forbids: a failed save must not clear the user's edits or look successful.

**What I did.** I added `tests/unit/useProductForm.failed-save.test.tsx` (commit [`9ada893`](https://github.com/vsevolod-zhuravlov/product-content-studio/commit/9ada893)). Re-applying the mutant now makes 4 of the 5 new tests fail; after reverting it, they pass.

**What I learned.** The AI-written suite was strong on validation, auth and the service, but it skipped the hook where the most important UI requirement lives. Passing tests told me nothing until I broke the code on purpose.

### Example 3. A flaky AI-written test exposed by shuffled test order

**What happened.** The test `PUT rejects tampered token` failed under shuffle seed 4242. The helper tampered with the token by flipping the last base64url character of the HS256 signature, and those trailing characters only carry padding bits, so the decoded signature sometimes did not change and the token stayed valid.

**What I did.** `tamperJwt` now corrupts a character in the middle of the signature and asserts that the decoded bytes really changed (commit [`ee06627`](https://github.com/vsevolod-zhuravlov/product-content-studio/commit/ee06627)). Verification: 500 freshly signed tokens in `tests/unit/auth/auth.test.ts`; the integration tamper test repeated 50 times with zero failures; the full suite passes with shuffle seeds 4242, 7, 99 and 2026.

**What I learned.** The test looked right and passed for a long time. A security test that can pass for the wrong reason is worse than no test, so I run the suite in shuffled order and check that a tamper helper really changes the data.

### Smaller corrections of AI output

| AI output                                                               | What was wrong                                                                   | Fix                                                                                                                                                |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `import { cn } from "cn"` in `button.tsx` plus a stray `cn` npm package | Wrong import (the shadcn helper lives in `@/lib/utils`) and a useless dependency | Unified the imports and moved shadcn to devDependencies ([`667086f`](https://github.com/vsevolod-zhuravlov/product-content-studio/commit/667086f)) |
| Screenshot artifacts (`.tmp-screens`) committed by an agent             | Build artifacts in git                                                           | Stopped tracking them ([`183af7a`](https://github.com/vsevolod-zhuravlov/product-content-studio/commit/183af7a))                                   |
| `tsc` ran before Next.js generated its route types                      | Typecheck failed on a clean clone                                                | Generate route types before `tsc` ([`d9aeed7`](https://github.com/vsevolod-zhuravlov/product-content-studio/commit/d9aeed7))                       |
| README setup steps in the wrong order                                   | A clean clone did not start                                                      | Fixed the order and the ports ([`5017e97`](https://github.com/vsevolod-zhuravlov/product-content-studio/commit/5017e97))                           |

## 5. Design tools (bonus)

- **Design:** https://stitch.withgoogle.com/projects/17448751170643293039
- **Screens drafted in Stitch:** products list (desktop and mobile), product editor, public catalog and product page (desktop and mobile).
- **How the design was transferred to code:** I gave the screenshots and a written description of the ideas I wanted to the Cursor agent, which implemented the screens with shadcn/ui and Tailwind (commits [`f7737b2`](https://github.com/vsevolod-zhuravlov/product-content-studio/commit/f7737b2), [`b029157`](https://github.com/vsevolod-zhuravlov/product-content-studio/commit/b029157), [`589f12a`](https://github.com/vsevolod-zhuravlov/product-content-studio/commit/589f12a)). It was not a direct export of Stitch output.
- **The Stitch drafts contradict the technical task, so the app deliberately does not copy them.** Stitch (a lightweight Gemini Flash model) invented a lot. The editor draft had an editable product name, a rich-text description editor, a demo description of 1,680 characters when the limit is 1,000 and no counter for it, extra fields (short description, media gallery, categories, brand, tags, sales channels, indexing toggles), two save buttons ("save draft" and "publish") on top of a status select, and an indicator that looked like autosave. The list and public screens contained invented data (SKU codes, warranty lines, a fake user name, extra navigation), and only the happy path was shown, with no validation, saving or failure states.
- **What I kept and what I changed:** I kept only the structure and visual ideas (sticky header, cards, counters with progress bars, SERP preview, mobile cards). In the app the product name and specs are read-only, the description is a plain textarea (which also removes an XSS surface), there is one save button plus a status select, and public pages show only what exists in the data model (name, description, specs). Product images are generated placeholder covers because the data model has no photos. The editor behavior (counters, validation, a failed save that keeps the user's input and does not look successful) is covered by the Playwright tests in [`57f7dcb`](https://github.com/vsevolod-zhuravlov/product-content-studio/commit/57f7dcb).

## 6. Role of automated tests in checking AI-generated code

My workflow was never to trust agent output until something independent had checked it:

- **Tests first.** In every step prompt I required the agent to write the tests first, show them failing for the right reason, then implement, and to finish with a mutation check.
- **Real database, no mocks for business rules.** Integration tests call route handlers and the product service in-process against a real PostgreSQL `_test` database, because mock-only tests written by an AI can pass while the real behavior is broken. Unit tests need no database. `npm test` does not run Playwright.
- **Playwright e2e** covers what unit tests cannot: cookies, redirects, XSS in rendered HTML, the failed-save UI in the editor, responsive layout. `npm test` does not run it, so a stale e2e test (Example 1) failed only in GitHub Actions; that is what the CI e2e job is for.
- **Mutation checks by hand.** I judged the quality of the AI-written tests by breaking the code: 16 mutants; before the audit fixes 1–13 and 15–16 were killed and 14 survived (Example 2). After the fix all 16 are killed. Each of the F13 tests was killed by a targeted temporary mutation and then reverted.
- **Shuffled order.** Seeds 4242, 7, 99 and 2026 all pass after the tamper-helper fix (Example 3).
- **Coverage** (`npm run test:coverage`, 2026-09-20, Node v24.14.0): statements 50%, branches 42.15%, functions 35.63%, lines 50.12%. I prioritized the rules the task cares about (validation, auth, service, draft visibility). UI components are largely uncovered by unit tests; this is a known gap.
- **Manual checks I ran myself:** a draft URL returns a real HTTP 404; an unauthenticated PUT changes nothing; an invalid request sent directly to the API does not change the database; publishing and unpublishing a product is visible on the public pages immediately in production mode.

## 7. Limitations and reflections

- Agents produced plausible code and tests that were wrong in ways only a deliberate break or a different test order revealed (Examples 2 and 3), and a plan written with AI can be wrong as well (Example 1).
- A design produced by AI has to be judged against the requirements, not against how good it looks (section 5).
- Coverage of UI components is low; with more time I would add more component tests for the UI.
- I would run the Playwright suite before every merge, not only in CI, so that a stale e2e test is found before it fails the pipeline.
