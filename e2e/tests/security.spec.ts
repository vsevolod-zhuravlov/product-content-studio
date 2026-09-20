import { AUTH_COOKIE_NAME, FIELD_LIMITS, ui, urls } from "../support/ui";
import { tamperJwt } from "../../tests/helpers/tamper-jwt";
import { adminGet, adminPut, objectKeys, readJson } from "../support/api";
import { findPublishedProduct, getProductById } from "../support/db";
import {
  clickSave,
  expectSavedToast,
  field,
  fillEditor,
  openEditor,
} from "../support/editor";
import { expect, mutatingTest as test } from "../support/fixtures";

const XSS_PAYLOADS = [
  "<script>window.__xss=1</script>",
  '<img src=x onerror="window.__xss=1">',
  '"><svg onload="window.__xss=1">',
  "</title><script>window.__xss=1</script>",
];

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

function leakPatterns(): RegExp {
  return /at\s+\S+\.(ts|js|tsx):\d+|node_modules|\/home\/|SELECT\s+|prisma\.product|passwordHash/i;
}

test.describe("Security", () => {
  for (const payload of XSS_PAYLOADS) {
    test(`S1: stored XSS is escaped (${payload})`, async ({ page }) => {
      const product = await findPublishedProduct();
      let dialogFired = false;
      page.on("dialog", () => {
        dialogFired = true;
      });

      await openEditor(page, product);
      await fillEditor(page, {
        description: payload,
        seoTitle: payload,
        seoDescription: payload,
      });
      await clickSave(page);
      await expectSavedToast(page);

      await page.goto(urls.publicProduct(product.slug));
      const publicHtml = await page.content();
      const publicRaw = await page.request.get(
        urls.publicProduct(product.slug),
      );
      expect(publicRaw.status()).toBe(200);
      await expectXssSafe(page, payload, publicHtml, "public");
      await expectXssSafe(page, payload, await publicRaw.text(), "public");
      expect(dialogFired).toBe(false);

      await openEditor(page, product);
      const adminHtml = await page.content();
      await expectXssSafe(page, payload, adminHtml, "admin");
      expect(dialogFired).toBe(false);
    });
  }

  test("S2: admin API without a cookie never returns 2xx or leaked rows", async ({
    browser,
    baseURL,
  }) => {
    const product = await findPublishedProduct();
    const context = await browser.newContext({
      baseURL,
      storageState: { cookies: [], origins: [] },
    });
    const paths = [urls.adminProductsApi, urls.adminProductApi(product.id)];

    for (const path of paths) {
      for (const method of METHODS) {
        const response = await context.request.fetch(path, { method });
        expect(response.status(), `${method} ${path}`).toBeGreaterThanOrEqual(
          400,
        );
        expect(response.status(), `${method} ${path}`).toBeLessThan(500);
        expect([401, 403, 405]).toContain(response.status());
        const text = await response.text();
        expect(text).not.toContain(product.name);
        expect(text).not.toContain(product.description);
        expect(text).not.toContain(product.seoTitle);
      }
    }

    await context.close();
  });

  test("S3: authenticated invalid payloads are 4xx and leave the row unchanged", async ({
    request,
  }) => {
    const product = await findPublishedProduct();
    const valid = {
      description: product.description,
      seoTitle: product.seoTitle,
      seoDescription: product.seoDescription,
      status: product.status,
    };

    const cases: Array<{ name: string; body: unknown }> = [
      {
        name: "over description limit",
        body: {
          ...valid,
          description: "а".repeat(FIELD_LIMITS.description + 1),
        },
      },
      {
        name: "over seoTitle limit",
        body: { ...valid, seoTitle: "а".repeat(FIELD_LIMITS.seoTitle + 1) },
      },
      {
        name: "over seoDescription limit",
        body: {
          ...valid,
          seoDescription: "а".repeat(FIELD_LIMITS.seoDescription + 1),
        },
      },
      { name: "empty description", body: { ...valid, description: "" } },
      { name: "empty seoTitle", body: { ...valid, seoTitle: "" } },
      { name: "empty seoDescription", body: { ...valid, seoDescription: "" } },
      {
        name: "missing seoTitle",
        body: {
          description: valid.description,
          seoDescription: valid.seoDescription,
          status: valid.status,
        },
      },
      { name: "wrong type", body: { ...valid, description: 123 } },
      { name: "invalid status", body: { ...valid, status: "LIVE" } },
      { name: "extra name", body: { ...valid, name: "Hacked" } },
      { name: "extra slug", body: { ...valid, slug: "hacked" } },
      { name: "extra id", body: { ...valid, id: "hacked" } },
    ];

    for (const item of cases) {
      const response = await adminPut(request, product.id, item.body);
      expect(response.status(), item.name).toBeGreaterThanOrEqual(400);
      expect(response.status(), item.name).toBeLessThan(500);

      const fresh = await getProductById(product.id);
      expect(fresh.description, item.name).toBe(product.description);
      expect(fresh.seoTitle, item.name).toBe(product.seoTitle);
      expect(fresh.seoDescription, item.name).toBe(product.seoDescription);
      expect(fresh.status, item.name).toBe(product.status);
      expect(fresh.name, item.name).toBe(product.name);
      expect(fresh.slug, item.name).toBe(product.slug);
    }

    const get = await readJson(await adminGet(request, product.id));
    expect(get.status).toBe(200);
  });

  test("S4: a tampered session cookie is rejected", async ({
    page,
    context,
    baseURL,
  }) => {
    const cookies = await context.cookies();
    const session = cookies.find((cookie) => cookie.name === AUTH_COOKIE_NAME);
    expect(session).toBeDefined();
    const tampered = tamperJwt(session!.value);

    await context.clearCookies();
    await context.addCookies([
      {
        name: AUTH_COOKIE_NAME,
        value: tampered,
        url: baseURL,
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);

    const api = await context.request.get(urls.adminProductsApi);
    expect(api.status()).toBe(401);

    await page.goto(urls.products);
    await expect(page).toHaveURL(new RegExp(`${urls.login}`));
  });

  test("S5: cross-origin PUT with a valid cookie is rejected", async ({
    request,
  }) => {
    const product = await findPublishedProduct();
    const response = await adminPut(
      request,
      product.id,
      {
        description: "Hacked from a foreign origin",
        seoTitle: product.seoTitle,
        seoDescription: product.seoDescription,
        status: product.status,
      },
      { Origin: "https://attacker.example" },
    );

    expect(response.status()).toBe(403);
    const row = await getProductById(product.id);
    expect(row.description).toBe(product.description);
  });

  test("S6: error bodies do not leak stack traces, SQL, or paths", async ({
    request,
  }) => {
    const product = await findPublishedProduct();
    const notFound = await readJson(
      await request.get(urls.publicProductApi("missing-slug-e2e")),
    );
    expect(notFound.status).toBe(404);
    expect(notFound.text).not.toMatch(leakPatterns());

    const invalid = await readJson(
      await adminPut(request, product.id, {
        description: "",
        seoTitle: product.seoTitle,
        seoDescription: product.seoDescription,
        status: product.status,
      }),
    );
    expect(invalid.status).toBe(400);
    expect(invalid.text).not.toMatch(leakPatterns());
    expect(objectKeys(invalid.body).sort()).toEqual(
      expect.arrayContaining(["error"]),
    );
  });
});

async function expectXssSafe(
  page: import("@playwright/test").Page,
  payload: string,
  html: string,
  surface: "public" | "admin",
) {
  const xssFlag = await page.evaluate(
    () => (window as Window & { __xss?: unknown }).__xss,
  );
  expect(xssFlag, `${surface} window.__xss`).toBeUndefined();

  const injected = await page.evaluate(() => {
    const roots = [
      document.querySelector("article"),
      document.querySelector("form#product-editor-form"),
    ].filter((element): element is Element => element !== null);

    return roots.some((root) => {
      const hasPayloadScript = [...root.querySelectorAll("script")].some(
        (element) => (element.textContent ?? "").includes("window.__xss"),
      );
      const hasErrorImage = [...root.querySelectorAll("img")].some((element) =>
        (element.getAttribute("onerror") ?? "").includes("__xss"),
      );
      const hasLoadSvg = [...root.querySelectorAll("svg")].some((element) =>
        (element.getAttribute("onload") ?? "").includes("__xss"),
      );
      return hasPayloadScript || hasErrorImage || hasLoadSvg;
    });
  });
  expect(injected, `${surface} injected markup in user content`).toBe(false);

  const titleHtml = html.match(/<title>[\s\S]*?<\/title>/i)?.[0] ?? "";
  expect(titleHtml).not.toMatch(/<\/title>\s*<script>/i);
  expect(titleHtml.toLowerCase()).not.toContain("<script");
  expect(html).not.toMatch(/<\/title>\s*<script>window\.__xss/i);

  if (surface === "admin") {
    await expect(field(page, ui.description)).toHaveValue(payload);
    await expect(field(page, ui.seoTitle)).toHaveValue(payload);
    await expect(field(page, ui.seoDescription)).toHaveValue(payload);
    return;
  }

  await expect(page).toHaveTitle(payload);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    payload,
  );
  await expect(page.locator("#content")).toContainText(payload);

  const descriptionHtml = await page.locator("article p").first().innerHTML();
  expect(descriptionHtml).toMatch(/&lt;|&#x3c;|&#60;/i);
  expect(descriptionHtml.toLowerCase()).not.toContain("<script");
  expect(descriptionHtml.toLowerCase()).not.toMatch(/<img\b/);
  expect(descriptionHtml.toLowerCase()).not.toMatch(/<svg\b/);
}
