<!-- Draft: sections marked TODO(owner) must be completed by the author before submission. -->

# AI work log

## Tools and models used

<!-- TODO(owner): list the AI tools and models you used during development, what each contributed, and what you did yourself -->

This audit-fix pass on branch `chore/audit-fixes` was applied by an AI coding
agent in the repository (no model name recorded in the environment).

## Decisions about AI-generated code

Draft entries below are evidence from this repository and the audit-fix
session. Rewrite them in your own words before submission.

### 1. Mutation testing exposed a test gap (draft)

Mutation 14 (in `src/hooks/useProductForm.ts`, a failed `saveProduct` result
reset the form and called `toast.success`) survived the suite because
`useProductForm` had no tests. The fix was F5: add
`tests/unit/useProductForm.failed-save.test.tsx`. Verification: re-applying
the mutant made 4 of 5 new tests fail; after revert they passed. Commit:
`9ada893`.

### 2. Shuffled test order exposed a flaky test (draft)

`PUT rejects tampered token` failed under shuffle seed 4242 because the helper
flipped the last base64url character of an HS256 signature (padding bits). The
fix was F4: `tamperJwt` corrupts a middle signature character and asserts that
decoded bytes change. Verification: 500 freshly signed tokens in
`tests/unit/auth/auth.test.ts`; the integration tamper test repeated 50 times
with zero failures; full suite shuffle seeds 4242, 7, 99, and 2026 all passed.
Commit: `ee06627`.

### 3.

<!-- TODO(owner): one more concrete example of accepting/rejecting/changing AI-generated code, with your reasoning and how you verified it -->

## Role of automated tests

<!-- TODO(owner): describe your own workflow for using tests to check AI-generated code -->

What exists in the repository today:

- Vitest **unit** tests (no database) and **integration** tests against a real
  PostgreSQL `_test` database. Route handlers and the product service are
  called in-process. `npm test` does not run Playwright.
- Playwright **e2e** covers browser-only gaps (cookies, redirects, XSS in
  HTML, editor failed-save UI, layout).
- **Mutation check** of 16 mutants from the prior runtime audit: before this
  branch, mutants 1–13 and 15–16 were killed and **mutant 14 survived**. After
  F5, mutant 14 is killed (4 new tests fail when the success-on-failure branch
  is re-applied). F13 tests were each killed by a targeted temporary mutation
  and then reverted.
- **Shuffled-order** runs (seeds 4242, 7, 99, 2026) after F4: all green.
- **Coverage** (`npm run test:coverage`, 2026-09-20, Node v24.14.0):
  statements 50%, branches 42.15%, functions 35.63%, lines 50.12%. UI
  components are largely uncovered; validation/auth/service files are high
  (see README).
