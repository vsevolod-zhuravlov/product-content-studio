import { expect, mutatingTest as test } from "../support/fixtures";
import {
  clickSave,
  expectSavedToast,
  field,
  fillControl,
  fillEditor,
  openEditor,
  setStatus,
} from "../support/editor";
import {
  findDraftProduct,
  findPublishedProduct,
  getProductById,
  listProducts,
} from "../support/db";
import { ui, urls } from "../support/ui";

test.describe("Publishing flow", () => {
  test("P5: saved SEO fields become the public title and meta description", async ({
    page,
    request,
  }) => {
    const product = await findPublishedProduct();
    const seoTitle = "E2E публічний SEO заголовок Halo";
    const seoDescription = "E2E публічний SEO опис, який має потрапити в meta.";

    await openEditor(page, product);
    await fillEditor(page, { seoTitle, seoDescription });
    await clickSave(page);
    await expectSavedToast(page);

    await page.goto(urls.publicProduct(product.slug));
    await expect(page).toHaveTitle(seoTitle);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      seoDescription,
    );

    const raw = await request.get(urls.publicProduct(product.slug));
    expect(raw.status()).toBe(200);
    const html = await raw.text();
    expect(html).toContain(seoTitle);
    expect(html).toContain(seoDescription);
    expect(html).toMatch(
      new RegExp(
        `<meta[^>]*name=["']description["'][^>]*content=["']${seoDescription}["']|<meta[^>]*content=["']${seoDescription}["'][^>]*name=["']description["']`,
      ),
    );
  });

  test("P6: publishing a draft appears on the public site immediately", async ({
    page,
    request,
  }) => {
    const draft = await findDraftProduct();
    await openEditor(page, draft);
    await setStatus(page, ui.published);
    await clickSave(page);
    await expectSavedToast(page);

    const catalog = await page.goto(urls.catalog);
    expect(catalog?.status()).toBe(200);
    await expect(page.getByRole("link", { name: draft.name })).toBeVisible();

    const detail = await request.get(urls.publicProduct(draft.slug));
    expect(detail.status()).toBe(200);
    await page.goto(urls.publicProduct(draft.slug));
    await expect(page.getByRole("heading", { name: draft.name })).toBeVisible();
  });

  test("P7: unpublishing removes the product from catalog, related, and the URL", async ({
    page,
    request,
  }) => {
    const published = (await listProducts())
      .filter((product) => product.status === "PUBLISHED")
      .sort((left, right) => left.name.localeCompare(right.name, "uk"));
    const product = published[0]!;
    const other = published[published.length - 1]!;

    await page.goto(urls.publicProduct(other.slug));
    await expect(page.getByRole("heading", { name: ui.related })).toBeVisible();
    await expect(page.getByRole("link", { name: product.name })).toBeVisible();

    await openEditor(page, product);
    await setStatus(page, ui.draft);
    await clickSave(page);
    await expectSavedToast(page);

    await page.goto(urls.catalog);
    await expect(page.getByRole("link", { name: product.name })).toHaveCount(0);

    await page.goto(urls.publicProduct(other.slug));
    await expect(page.getByRole("heading", { name: ui.related })).toBeVisible();
    await expect(page.getByRole("link", { name: product.name })).toHaveCount(0);

    const detail = await request.get(urls.publicProduct(product.slug));
    expect(detail.status()).toBe(404);
    const html = await detail.text();
    expect(html).not.toContain(product.name);
    expect(html).not.toContain(product.description);
  });

  test("P8: the public page shows the last saved description, not unsaved edits", async ({
    page,
    context,
  }) => {
    const product = await findPublishedProduct();
    const unsaved = "UNSAVED_E2E_MARKER_НЕ_ПУБЛІКУВАТИ";

    await openEditor(page, product);
    await fillControl(field(page, ui.description), unsaved);

    const publicPage = await context.newPage();
    await publicPage.goto(urls.publicProduct(product.slug));
    await expect(
      publicPage.getByRole("heading", { name: product.name }),
    ).toBeVisible();
    await expect(publicPage.locator("#content")).toContainText(
      product.description.slice(0, 80),
    );
    await expect(publicPage.locator("#content")).not.toContainText(unsaved);

    const row = await getProductById(product.id);
    expect(row.description).toBe(product.description);
    await publicPage.close();
  });
});
