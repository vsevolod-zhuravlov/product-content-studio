import { formatProductCount } from "../../src/lib/format";
import { countByStatus, listProducts, resetAndSeed } from "../support/db";
import { expect, test } from "../support/fixtures";
import { editProductLink, visible } from "../support/editor";
import { ui, urls } from "../support/ui";

test.describe("Admin list", () => {
  test.beforeAll(async () => {
    await resetAndSeed();
  });
  test("L1: list shows every seeded product and matching counts @mobile", async ({
    page,
  }) => {
    const products = await listProducts();
    const counts = await countByStatus();
    expect(products).toHaveLength(15);
    expect(counts).toEqual({ published: 10, drafts: 5, total: 15 });

    await page.goto(urls.products);
    await expect(
      page.getByRole("heading", { name: ui.productsHeading }),
    ).toBeVisible();
    await expect(
      page.getByText(formatProductCount(15), { exact: true }),
    ).toBeVisible();

    await expect(
      visible(page.getByRole("link", { name: /Редагувати товар/ })),
    ).toHaveCount(15);

    for (const product of products) {
      await expect(
        visible(page.getByText(product.name, { exact: true })),
      ).toBeVisible();
    }

    await expect(
      visible(page.getByText(ui.published, { exact: true })),
    ).toHaveCount(10);
    await expect(
      visible(page.getByText(ui.draft, { exact: true })),
    ).toHaveCount(5);
  });

  test("L2: Редагувати opens that product's editor", async ({
    page,
    publishedProduct,
  }) => {
    await page.goto(urls.products);
    await editProductLink(page, publishedProduct.name).click();
    await expect(page).toHaveURL(urls.product(publishedProduct.id));
    await expect(
      visible(page.getByRole("heading", { name: publishedProduct.name })),
    ).toBeVisible();
  });

  test("L3: unauthenticated browser GET of the list API is not 200", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      baseURL,
      storageState: { cookies: [], origins: [] },
    });
    const response = await context.request.get(urls.adminProductsApi);
    expect(response.status()).not.toBe(200);
    const body = await response.text();
    expect(body).not.toMatch(/halo-hub|seoTitle|description/i);
    await context.close();
  });
});
