import { formatProductCount } from "../../src/lib/format";
import {
  findDraftProduct,
  findPublishedProduct,
  listProducts,
  resetAndSeed,
} from "../support/db";
import { expect, test } from "../support/fixtures";
import { objectKeys, PUBLIC_PRODUCT_KEYS, readJson } from "../support/api";
import { ui, urls } from "../support/ui";

test.describe("Public catalog", () => {
  test.beforeAll(async () => {
    await resetAndSeed();
  });

  test("P1: catalog lists only the 10 published products @mobile", async ({
    page,
  }) => {
    const products = await listProducts();
    const published = products.filter(
      (product) => product.status === "PUBLISHED",
    );
    const drafts = products.filter((product) => product.status === "DRAFT");
    expect(published).toHaveLength(10);
    expect(drafts).toHaveLength(5);

    await page.goto(urls.catalog);
    await expect(page.getByRole("heading", { name: ui.catalog })).toBeVisible();
    await expect(
      page.getByText(formatProductCount(10), { exact: true }),
    ).toBeVisible();

    for (const product of published) {
      const card = page.getByRole("link", { name: product.name });
      await expect(card).toBeVisible();
      await expect(card).toHaveAttribute(
        "href",
        urls.publicProduct(product.slug),
      );
    }

    for (const product of drafts) {
      await expect(page.getByText(product.name, { exact: true })).toHaveCount(
        0,
      );
    }
  });

  test("P2: product page renders saved content and returns to the catalog", async ({
    page,
  }) => {
    const product = await findPublishedProduct();
    await page.goto(urls.catalog);
    await page.getByRole("link", { name: product.name }).click();
    await expect(page).toHaveURL(urls.publicProduct(product.slug));
    await expect(
      page.getByRole("heading", { name: product.name }),
    ).toBeVisible();
    await expect(page.locator("#content")).toContainText(
      product.description.slice(0, 80),
    );

    const specs = product.specs as Array<{ label: string; value: string }>;
    await expect(
      page.getByText(specs[0]!.label, { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(specs[0]!.value, { exact: true }),
    ).toBeVisible();

    await page.getByRole("link", { name: ui.backToCatalog }).click();
    await expect(page).toHaveURL(urls.catalog);
    await expect(page.getByRole("heading", { name: ui.catalog })).toBeVisible();
  });

  test("P3: a draft direct URL is a 404 without leaking draft content", async ({
    page,
    request,
  }) => {
    const draft = await findDraftProduct();
    const response = await page.goto(urls.publicProduct(draft.slug));
    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { name: ui.productNotFound }),
    ).toBeVisible();
    await expect(page.getByText(ui.publicNotFoundHint)).toBeVisible();

    const html = await page.content();
    expect(html).not.toContain(draft.name);
    expect(html).not.toContain(draft.description);

    const api = await request.get(urls.publicProductApi(draft.slug));
    expect(api.status()).toBe(404);
    expect(await api.text()).not.toContain(draft.name);
  });

  test("P4: an unknown slug uses the same 404 UI as a draft", async ({
    page,
    request,
  }) => {
    const unknown = "/products/this-slug-does-not-exist-e2e";
    const response = await page.goto(unknown);
    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { name: ui.productNotFound }),
    ).toBeVisible();
    await expect(page.getByText(ui.publicNotFoundHint)).toBeVisible();

    const draft = await findDraftProduct();
    const draftApi = await readJson(
      await request.get(urls.publicProductApi(draft.slug)),
    );
    const unknownApi = await readJson(
      await request.get(urls.publicProductApi("this-slug-does-not-exist-e2e")),
    );
    expect(unknownApi.status).toBe(draftApi.status);
    expect(unknownApi.body).toEqual(draftApi.body);
    expect(unknownApi.status).toBe(404);
  });

  test("P9: public API smoke — published list, draft 404, documented DTO only", async ({
    request,
  }) => {
    const products = await listProducts();
    const published = products.filter(
      (product) => product.status === "PUBLISHED",
    );
    const draft = products.find((product) => product.status === "DRAFT");
    expect(draft).toBeDefined();

    const list = await readJson(await request.get(urls.publicProductsApi));
    expect(list.status).toBe(200);
    expect(list.body).toEqual(
      expect.objectContaining({
        data: expect.any(Array),
      }),
    );

    const data = (list.body as { data: Array<Record<string, unknown>> }).data;
    expect(data).toHaveLength(published.length);
    expect(data.map((item) => item.slug).sort()).toEqual(
      published.map((item) => item.slug).sort(),
    );
    expect(data.map((item) => item.name)).not.toContain(draft!.name);

    for (const item of data) {
      expect(objectKeys(item)).toEqual(PUBLIC_PRODUCT_KEYS);
    }

    const detail = await readJson(
      await request.get(urls.publicProductApi(draft!.slug)),
    );
    expect(detail.status).toBe(404);
    expect(detail.text).not.toContain(draft!.name);
    expect(objectKeys(detail.body)).toEqual(["error"]);
  });

  test("P10: catalog and product pages do not call external hosts", async ({
    page,
  }) => {
    const product = await findPublishedProduct();
    const hosts = new Set<string>();
    page.on("request", (request) => {
      hosts.add(new URL(request.url()).host);
    });

    await page.goto(urls.catalog);
    await expect(page.getByRole("heading", { name: ui.catalog })).toBeVisible();
    await page.goto(urls.publicProduct(product.slug));
    await expect(
      page.getByRole("heading", { name: product.name }),
    ).toBeVisible();

    const origin = new URL(page.url()).host;
    expect([...hosts]).toEqual([origin]);
  });
});
