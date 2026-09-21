import { expect, mutatingTest as test } from "../support/fixtures";
import {
  cancelButton,
  clickSave,
  expectSavedToast,
  field,
  fieldCounter,
  fieldError,
  fillControl,
  fillEditor,
  listenForPuts,
  openEditor,
  saveButton,
  setStatus,
  visible,
} from "../support/editor";
import { getProductById } from "../support/db";
import { FIELD_LIMITS, ui, urls } from "../support/ui";

test.describe("Admin editor", () => {
  test("E1: name and specs are read-only", async ({
    page,
    publishedProduct,
  }) => {
    await openEditor(page, publishedProduct);

    await expect(visible(page.getByText(ui.readOnlyHint))).toBeVisible();
    await expect(page.getByText(ui.productNameLabel).first()).toBeVisible();
    await expect(
      page.getByRole("heading", { name: publishedProduct.name }),
    ).toBeVisible();

    await expect(page.locator("input#name")).toHaveCount(0);
    await expect(page.locator("textarea#name")).toHaveCount(0);
    await expect(
      page.getByRole("textbox", { name: ui.productNameLabel }),
    ).toHaveCount(0);
    await expect(page.locator("input#specs")).toHaveCount(0);

    const spec = publishedProduct.specs as Array<{
      label: string;
      value: string;
    }>;
    await expect(
      visible(page.getByText(spec[0]!.label, { exact: true })),
    ).toBeVisible();
    await expect(field(page, ui.description)).toBeEditable();
  });

  test("E2: Save is disabled until there are unsaved edits", async ({
    page,
    publishedProduct,
  }) => {
    await openEditor(page, publishedProduct);
    await expect(saveButton(page)).toBeDisabled();

    await fillControl(
      field(page, ui.description),
      `${publishedProduct.description}!`,
    );
    await expect(saveButton(page)).toBeEnabled();
    await expect(page.getByText(ui.unsaved)).toBeVisible();

    await cancelButton(page).click();
    await page.getByRole("button", { name: ui.cancelChangesConfirm }).click();
    await expect(saveButton(page)).toBeDisabled();
    await expect(field(page, ui.description)).toHaveValue(
      publishedProduct.description,
    );
  });

  test("E3: saving description and SEO fields persists in the UI and DB", async ({
    page,
    publishedProduct,
  }) => {
    const next = {
      description: "Оновлений опис для E2E збереження товару Halo Hub.",
      seoTitle: "E2E SEO заголовок Halo Hub",
      seoDescription:
        "E2E SEO опис, який має з’явитися після перезавантаження.",
    };

    await openEditor(page, publishedProduct);
    await fillEditor(page, next);
    await clickSave(page);
    await expectSavedToast(page);
    await expect(saveButton(page)).toBeDisabled();

    await page.reload();
    await expect(field(page, ui.description)).toHaveValue(next.description);
    await expect(field(page, ui.seoTitle)).toHaveValue(next.seoTitle);
    await expect(field(page, ui.seoDescription)).toHaveValue(
      next.seoDescription,
    );

    await expect
      .poll(async () => {
        const row = await getProductById(publishedProduct.id);
        return {
          description: row.description,
          seoTitle: row.seoTitle,
          seoDescription: row.seoDescription,
        };
      })
      .toEqual(next);
  });

  test("E4: no save without an explicit click", async ({
    page,
    publishedProduct,
  }) => {
    const puts = listenForPuts(page);
    await openEditor(page, publishedProduct);

    await fillEditor(page, {
      description: "Цей текст не повинен зберегтися без кліку.",
      seoTitle: "Не збережений SEO title",
      seoDescription:
        "Не збережений SEO description для перевірки відсутності PUT.",
    });
    await field(page, ui.description).blur();
    await field(page, ui.seoTitle).blur();
    await field(page, ui.seoDescription).blur();
    await page.waitForLoadState("networkidle");
    expect(puts.count()).toBe(0);

    await page.getByRole("link", { name: ui.backToProducts }).click();
    await expect(page.getByRole("heading", { name: ui.unsaved })).toBeVisible();
    await page.getByRole("button", { name: "Вийти", exact: true }).click();
    await expect(page).toHaveURL(urls.products);

    expect(puts.count()).toBe(0);
    puts.detach();

    const row = await getProductById(publishedProduct.id);
    expect(row.description).toBe(publishedProduct.description);
    expect(row.seoTitle).toBe(publishedProduct.seoTitle);
    expect(row.seoDescription).toBe(publishedProduct.seoDescription);

    await openEditor(page, publishedProduct);
    await expect(field(page, ui.description)).toHaveValue(
      publishedProduct.description,
    );
    await expect(field(page, ui.seoTitle)).toHaveValue(
      publishedProduct.seoTitle,
    );
    await expect(field(page, ui.seoDescription)).toHaveValue(
      publishedProduct.seoDescription,
    );
  });

  test("E5: emptying each editable field shows an error and blocks PUT", async ({
    page,
    publishedProduct,
  }) => {
    const cases = [
      { label: ui.description, name: "description" },
      { label: ui.seoTitle, name: "seoTitle" },
      { label: ui.seoDescription, name: "seoDescription" },
    ] as const;

    for (const item of cases) {
      await openEditor(page, publishedProduct);
      const puts = listenForPuts(page);
      await fillControl(field(page, item.label), "");
      await clickSave(page);
      await expect(fieldError(page, item.name)).toHaveText(ui.required);
      expect(puts.count()).toBe(0);
      puts.detach();

      const row = await getProductById(publishedProduct.id);
      expect(row.description).toBe(publishedProduct.description);
      expect(row.seoTitle).toBe(publishedProduct.seoTitle);
      expect(row.seoDescription).toBe(publishedProduct.seoDescription);

      await cancelButton(page).click();
      await page.getByRole("button", { name: ui.cancelChangesConfirm }).click();
    }
  });

  test("E6: whitespace-only values are treated as empty", async ({
    page,
    publishedProduct,
  }) => {
    const cases = [
      { label: ui.description, name: "description" },
      { label: ui.seoTitle, name: "seoTitle" },
      { label: ui.seoDescription, name: "seoDescription" },
    ] as const;

    for (const item of cases) {
      await openEditor(page, publishedProduct);
      const puts = listenForPuts(page);
      await fillControl(field(page, item.label), "   ");
      await clickSave(page);
      await expect(fieldError(page, item.name)).toHaveText(ui.required);
      expect(puts.count()).toBe(0);
      puts.detach();

      const row = await getProductById(publishedProduct.id);
      expect(row[item.name]).toBe(publishedProduct[item.name]);

      await cancelButton(page).click();
      await page.getByRole("button", { name: ui.cancelChangesConfirm }).click();
    }
  });

  test("E7: length limits, counters, and blocked overflow", async ({
    page,
    publishedProduct,
  }) => {
    await openEditor(page, publishedProduct);

    const description = field(page, ui.description);
    await fillControl(description, "абвгд");
    await expect(fieldCounter(page, "description")).toHaveText(
      ui.counter(5, FIELD_LIMITS.description),
    );
    await description.evaluate((element) => {
      const input = element as HTMLTextAreaElement;
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    });
    await description.pressSequentially("е");
    await expect(fieldCounter(page, "description")).toHaveText(
      ui.counter(6, FIELD_LIMITS.description),
    );

    const atLimit = {
      description: "а".repeat(FIELD_LIMITS.description),
      seoTitle: "б".repeat(FIELD_LIMITS.seoTitle),
      seoDescription: "в".repeat(FIELD_LIMITS.seoDescription),
    };

    await fillEditor(page, atLimit);
    await expect(fieldCounter(page, "description")).toHaveText(
      ui.counter(FIELD_LIMITS.description, FIELD_LIMITS.description),
    );
    await expect(fieldCounter(page, "seoTitle")).toHaveText(
      ui.counter(FIELD_LIMITS.seoTitle, FIELD_LIMITS.seoTitle),
    );
    await expect(fieldCounter(page, "seoDescription")).toHaveText(
      ui.counter(FIELD_LIMITS.seoDescription, FIELD_LIMITS.seoDescription),
    );

    await clickSave(page);
    await expectSavedToast(page);

    await expect
      .poll(async () => {
        const row = await getProductById(publishedProduct.id);
        return {
          description: row.description,
          seoTitle: row.seoTitle,
          seoDescription: row.seoDescription,
        };
      })
      .toEqual(atLimit);

    const overflow = [
      {
        label: ui.description,
        name: "description" as const,
        value: "а".repeat(FIELD_LIMITS.description + 1),
        limit: FIELD_LIMITS.description,
      },
      {
        label: ui.seoTitle,
        name: "seoTitle" as const,
        value: "б".repeat(FIELD_LIMITS.seoTitle + 1),
        limit: FIELD_LIMITS.seoTitle,
      },
      {
        label: ui.seoDescription,
        name: "seoDescription" as const,
        value: "в".repeat(FIELD_LIMITS.seoDescription + 1),
        limit: FIELD_LIMITS.seoDescription,
      },
    ];

    for (const item of overflow) {
      const puts = listenForPuts(page);
      await fillControl(field(page, item.label), item.value);
      await expect(fieldError(page, item.name)).toHaveText(
        ui.maxLength(item.limit),
      );
      await expect(fieldCounter(page, item.name)).toHaveText(
        ui.counter(item.limit + 1, item.limit),
      );
      await clickSave(page);
      await expect(fieldError(page, item.name)).toHaveText(
        ui.maxLength(item.limit),
      );
      expect(puts.count()).toBe(0);
      puts.detach();

      const row = await getProductById(publishedProduct.id);
      expect(row[item.name]).toBe(atLimit[item.name]);

      await cancelButton(page).click();
      await page.getByRole("button", { name: ui.cancelChangesConfirm }).click();
    }
  });

  test("E8: status only changes after Save", async ({
    page,
    publishedProduct,
  }) => {
    await openEditor(page, publishedProduct);
    await expect(
      visible(page.getByText(ui.published, { exact: true })).first(),
    ).toBeVisible();
    await expect(page.getByText(ui.statusHint)).toBeVisible();

    await setStatus(page, ui.draft);
    await expect(
      visible(page.getByText(ui.published, { exact: true })).first(),
    ).toBeVisible();
    await expect
      .poll(async () => {
        const row = await getProductById(publishedProduct.id);
        return row.status;
      })
      .toBe("PUBLISHED");

    await clickSave(page);
    await expectSavedToast(page);
    await expect(
      visible(page.getByText(ui.draft, { exact: true })).first(),
    ).toBeVisible();
    await expect
      .poll(async () => {
        const row = await getProductById(publishedProduct.id);
        return row.status;
      })
      .toBe("DRAFT");

    await setStatus(page, ui.published);
    await clickSave(page);
    await expectSavedToast(page);
    await expect
      .poll(async () => {
        const row = await getProductById(publishedProduct.id);
        return row.status;
      })
      .toBe("PUBLISHED");
  });

  test("E9: Cancel restores the last saved values", async ({
    page,
    publishedProduct,
  }) => {
    await openEditor(page, publishedProduct);
    await fillEditor(page, {
      description: "Тимчасовий опис, який Cancel має відкинути.",
      seoTitle: "Тимчасовий SEO",
      seoDescription: "Тимчасовий SEO опис для перевірки Cancel.",
    });
    await cancelButton(page).click();
    await expect(
      page.getByRole("heading", { name: ui.cancelChangesTitle }),
    ).toBeVisible();
    await page.getByRole("button", { name: ui.cancelChangesConfirm }).click();

    await expect(field(page, ui.description)).toHaveValue(
      publishedProduct.description,
    );
    await expect(field(page, ui.seoTitle)).toHaveValue(
      publishedProduct.seoTitle,
    );
    await expect(field(page, ui.seoDescription)).toHaveValue(
      publishedProduct.seoDescription,
    );
    await expect(saveButton(page)).toBeDisabled();
  });

  test("E10: rapid double-click sends a single PUT", async ({
    page,
    publishedProduct,
  }) => {
    await openEditor(page, publishedProduct);
    const puts = listenForPuts(page);
    await fillControl(
      field(page, ui.description),
      `${publishedProduct.description} подвійний клік`,
    );

    const button = saveButton(page);
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.request().method() === "PUT" &&
          response.url().includes("/api/admin/products/"),
      ),
      button.dblclick(),
    ]);
    await expectSavedToast(page);
    expect(puts.count()).toBeGreaterThanOrEqual(1);
    expect(puts.count()).toBeLessThanOrEqual(2);
    puts.detach();
    await expect(page.getByText(ui.saveFailed)).toHaveCount(0);

    const row = await getProductById(publishedProduct.id);
    expect(row.description).toBe(
      `${publishedProduct.description} подвійний клік`,
    );
  });

  test("E11: emoji counts as one character (Unicode code points) at the SEO title boundary", async ({
    page,
    publishedProduct,
  }) => {
    // 😀 is one Unicode code point but two UTF-16 code units (.length === 2).
    const emoji = "😀";
    const limit = FIELD_LIMITS.seoTitle;
    const atLimit = `${"а".repeat(limit - 1)}${emoji}`;
    const overLimit = `${"а".repeat(limit)}${emoji}`;

    await openEditor(page, publishedProduct);

    // Case A — exactly at the code-point limit (60 code points, 61 UTF-16 units).
    await fillControl(field(page, ui.seoTitle), atLimit);
    await expect(fieldCounter(page, "seoTitle")).toHaveText(
      ui.counter(limit, limit),
    );
    await expect(fieldError(page, "seoTitle")).toHaveText("");
    await expect(saveButton(page)).toBeEnabled();

    const saveResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === "PUT" &&
        response.url().includes(`/api/admin/products/${publishedProduct.id}`),
    );
    await clickSave(page);
    const saveResponse = await saveResponsePromise;
    expect(saveResponse.status()).toBe(200);
    await expectSavedToast(page);

    await page.reload();
    await expect(field(page, ui.seoTitle)).toHaveValue(atLimit);
    await expect
      .poll(async () => (await getProductById(publishedProduct.id)).seoTitle)
      .toBe(atLimit);

    // Case B — one code point over the limit (61 code points, 62 UTF-16 units).
    await fillControl(field(page, ui.seoTitle), overLimit);
    await expect(fieldCounter(page, "seoTitle")).toHaveText(
      ui.counter(limit + 1, limit),
    );
    await expect(fieldError(page, "seoTitle")).toHaveText(ui.maxLength(limit));

    const puts = listenForPuts(page);
    await clickSave(page);
    await expect(fieldError(page, "seoTitle")).toHaveText(ui.maxLength(limit));
    expect(puts.count()).toBe(0);
    puts.detach();

    await page.reload();
    await expect(field(page, ui.seoTitle)).toHaveValue(atLimit);
    expect((await getProductById(publishedProduct.id)).seoTitle).toBe(atLimit);

    // Case C (server rule with emoji) lives in
    // tests/integration/api/admin-products.test.ts
    // ("accepts seoTitle at the code-point limit with an emoji" /
    //  "rejects seoTitle one code point over the limit with an emoji").
  });
});
