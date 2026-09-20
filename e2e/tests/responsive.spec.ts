import { expect, mutatingTest as test } from "../support/fixtures";
import {
  clickSave,
  expectNoHorizontalScroll,
  expectSavedToast,
  fillEditor,
  openEditor,
  saveButton,
  visible,
} from "../support/editor";
import { findPublishedProduct, getProductById } from "../support/db";
import { ui, urls } from "../support/ui";

test.describe("Responsive layout", () => {
  test("R1: public catalog and product page do not scroll horizontally @mobile-only", async ({
    page,
  }) => {
    const product = await findPublishedProduct();
    await page.goto(urls.catalog);
    await expect(page.getByRole("heading", { name: ui.catalog })).toBeVisible();
    await expect(page.getByRole("link", { name: product.name })).toBeVisible();
    await expectNoHorizontalScroll(page);

    await page.goto(urls.publicProduct(product.slug));
    await expect(
      page.getByRole("heading", { name: product.name }),
    ).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test("R2: admin list uses cards at 375px @mobile-only", async ({ page }) => {
    const product = await findPublishedProduct();
    await page.goto(urls.products);
    await expect(
      page.getByRole("heading", { name: ui.productsHeading }),
    ).toBeVisible();
    await expect(
      page.locator("article").filter({ hasText: product.name }),
    ).toBeVisible();
    await expect(page.locator("table")).toBeHidden();
    await expect(
      visible(page.getByRole("link", { name: ui.editProduct(product.name) })),
    ).toBeVisible();
    await expectNoHorizontalScroll(page);

    await visible(
      page.getByRole("link", { name: ui.editProduct(product.name) }),
    ).click();
    await expect(page).toHaveURL(urls.product(product.id));
  });

  test("R3: mobile save bar can complete an edit @mobile-only", async ({
    page,
  }) => {
    const product = await findPublishedProduct();
    await openEditor(page, product);

    const save = saveButton(page);
    await expect(save).toBeVisible();
    const box = await save.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeGreaterThan(500);

    const nextDescription = "Мобільне збереження опису з нижньої панелі.";
    await fillEditor(page, { description: nextDescription });
    await clickSave(page);
    await expectSavedToast(page);
    await expectNoHorizontalScroll(page);

    await expect
      .poll(async () => {
        const row = await getProductById(product.id);
        return row.description;
      })
      .toBe(nextDescription);
  });

  test("R4: desktop list is a table and the editor is two columns", async ({
    page,
  }) => {
    const product = await findPublishedProduct();
    await page.goto(urls.products);
    await expect(page.locator("table")).toBeVisible();
    await expect(
      visible(page.locator("article").filter({ hasText: product.name })),
    ).toHaveCount(0);

    await openEditor(page, product);
    const columns = await page
      .locator("form#product-editor-form .grid")
      .first()
      .evaluate((element) => getComputedStyle(element).gridTemplateColumns);
    expect(columns.split(" ").filter(Boolean).length).toBeGreaterThanOrEqual(2);
    await expect(saveButton(page)).toBeVisible();
    const box = await saveButton(page).boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeLessThan(400);
  });

  test.skip("R5: visual regression screenshots", () => {
    // Snapshots are brittle across font and CI environments; add only if asked.
  });
});
