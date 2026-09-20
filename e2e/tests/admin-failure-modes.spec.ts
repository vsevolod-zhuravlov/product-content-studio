import { expect, mutatingTest as test } from "../support/fixtures";
import {
  alertWithText,
  clickSave,
  expectNoSavedToast,
  expectSavedToast,
  field,
  fillControl,
  fillEditor,
  interceptPut,
  openEditor,
  retryButton,
  saveButton,
} from "../support/editor";
import { findPublishedProduct, getProductById } from "../support/db";
import { readJson } from "../support/api";
import { ui, urls } from "../support/ui";

test.describe("Admin failure modes", () => {
  test("F1: save 500 keeps edits, shows an error, then retry succeeds", async ({
    page,
  }) => {
    const product = await findPublishedProduct();
    const next = {
      description: "Опис після збою 500, має лишитися у формі.",
      seoTitle: "SEO title після 500",
      seoDescription: "SEO опис після 500 має зберегтися після retry.",
    };

    await openEditor(page, product);
    let failNext = true;
    await interceptPut(page, product.id, async (route) => {
      if (failNext) {
        failNext = false;
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Internal server error" }),
        });
        return;
      }
      await route.continue();
    });

    await fillEditor(page, next);
    await clickSave(page);

    await expect(alertWithText(page, ui.saveFailed)).toBeVisible();
    await expect(page.getByText(ui.saveFailedBody)).toBeVisible();
    await expectNoSavedToast(page);
    await expect(field(page, ui.description)).toHaveValue(next.description);
    await expect(field(page, ui.seoTitle)).toHaveValue(next.seoTitle);
    await expect(saveButton(page)).toBeEnabled();

    const unchanged = await getProductById(product.id);
    expect(unchanged.description).toBe(product.description);

    await retryButton(page).click();
    await expectSavedToast(page);

    await expect
      .poll(async () => {
        const row = await getProductById(product.id);
        return row.description;
      })
      .toBe(next.description);
  });

  test("F2: network failure keeps edits and is not stuck saving", async ({
    page,
  }) => {
    const product = await findPublishedProduct();
    const nextDescription = "Опис після обриву мережі має лишитися у формі.";

    await openEditor(page, product);
    let failNext = true;
    await interceptPut(page, product.id, async (route) => {
      if (failNext) {
        failNext = false;
        await route.abort("failed");
        return;
      }
      await route.continue();
    });

    await fillControl(field(page, ui.description), nextDescription);
    await clickSave(page);

    await expect(alertWithText(page, ui.saveFailed)).toBeVisible();
    await expectNoSavedToast(page);
    await expect(page.getByText(ui.saving)).toHaveCount(0);
    await expect(saveButton(page)).toBeEnabled();
    await expect(field(page, ui.description)).toHaveValue(nextDescription);

    const unchanged = await getProductById(product.id);
    expect(unchanged.description).toBe(product.description);

    await retryButton(page).click();
    await expectSavedToast(page);
  });

  test("F3: 400 with a real validation body is shown and edits are kept", async ({
    page,
    request,
  }) => {
    const product = await findPublishedProduct();
    const captured = await request.put(urls.adminProductApi(product.id), {
      data: {
        description: product.description,
        seoTitle: "а".repeat(61),
        seoDescription: product.seoDescription,
        status: product.status,
      },
    });
    const { status, body } = await readJson(captured);
    expect(status).toBe(400);
    expect(body).toMatchObject({
      error: "Validation failed",
      fieldErrors: {
        seoTitle: [ui.maxLength(60)],
      },
    });

    const nextDescription = "Опис, який має лишитися після 400 від сервера.";
    await openEditor(page, product);
    await interceptPut(page, product.id, async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    });

    await fillControl(field(page, ui.description), nextDescription);
    await clickSave(page);

    await expect(alertWithText(page, ui.validationBanner)).toBeVisible();
    await expect(page.getByText(ui.checkFields)).toBeVisible();
    await expectNoSavedToast(page);
    await expect(field(page, ui.description)).toHaveValue(nextDescription);

    const unchanged = await getProductById(product.id);
    expect(unchanged.description).toBe(product.description);
  });

  test("F4: expired session mid-edit is not shown as success", async ({
    page,
    context,
  }) => {
    const product = await findPublishedProduct();
    const nextDescription = "Незбережений опис під час простроченої сесії.";

    await openEditor(page, product);
    await fillControl(field(page, ui.description), nextDescription);
    await context.clearCookies();
    await clickSave(page);

    await expectNoSavedToast(page);
    await expect(alertWithText(page, ui.sessionExpired)).toBeVisible();
    await expect(
      page.getByRole("link", { name: ui.signInAgain }),
    ).toBeVisible();
    await expect(field(page, ui.description)).toHaveValue(nextDescription);

    const unchanged = await getProductById(product.id);
    expect(unchanged.description).toBe(product.description);
  });

  test("F5: slow save shows a loading state until the response", async ({
    page,
  }) => {
    const product = await findPublishedProduct();
    await openEditor(page, product);
    await interceptPut(page, product.id, async (route) => {
      await new Promise((resolve) => {
        setTimeout(resolve, 1500);
      });
      await route.continue();
    });

    await fillControl(
      field(page, ui.description),
      "Опис після повільного збереження.",
    );
    await clickSave(page);

    await expect(page.getByText(ui.saving)).toBeVisible();
    await expect(saveButton(page)).toBeDisabled();
    await expectNoSavedToast(page);

    await expectSavedToast(page);
    await expect(page.getByText(ui.saving)).toHaveCount(0);
    await expect(saveButton(page)).toBeDisabled();
  });

  test("F6: missing product id shows a clean 404 page", async ({ page }) => {
    const response = await page.goto(urls.product("missing-product-id-e2e"));
    expect(response?.status()).toBeLessThan(500);
    expect(response?.status()).not.toBe(302);
    await expect(
      page.getByRole("heading", { name: ui.productNotFound }),
    ).toBeVisible();
    await expect(page.getByText(ui.adminNotFoundHint)).toBeVisible();
    await expect(
      page.getByRole("link", { name: ui.toProductList }),
    ).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Application error");
  });
});
