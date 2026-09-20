import { AUTH_COOKIE_NAME, ui, urls } from "../support/ui";
import { getAdminCredentials } from "../support/env";
import { findPublishedProduct, resetAndSeed } from "../support/db";
import { expect, test } from "../support/fixtures";
import { alertWithText, listenForLogin } from "../support/editor";

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Auth", () => {
  test.beforeAll(async () => {
    await resetAndSeed();
  });

  test("A1: logged-out visitor is redirected from admin URLs", async ({
    page,
  }) => {
    const product = await findPublishedProduct();

    const listResponse = await page.goto(urls.products);
    await expect(page).toHaveURL(new RegExp(`${urls.login}`));
    expect(listResponse?.status()).toBe(200);
    const listHtml = await page.content();
    expect(listHtml).not.toContain(product.name);
    expect(listHtml).not.toContain(product.description);

    const editorResponse = await page.goto(urls.product(product.id));
    await expect(page).toHaveURL(new RegExp(`${urls.login}`));
    expect(editorResponse?.status()).toBe(200);
    const editorHtml = await page.content();
    expect(editorHtml).not.toContain(product.name);
    expect(editorHtml).not.toContain(product.description);
    expect(editorHtml).not.toContain(product.seoTitle);
  });

  test("A2: wrong password shows the shared error and sets no session", async ({
    page,
    context,
  }) => {
    const { email } = getAdminCredentials();
    await page.goto(urls.login);
    await page.getByLabel(ui.email).fill(email);
    await page
      .getByLabel(ui.password, { exact: true })
      .fill("not-the-admin-password");
    await page.getByRole("button", { name: ui.login }).click();

    await expect(alertWithText(page, ui.invalidCredentials)).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`${urls.login}`));
    const session = (await context.cookies()).find(
      (cookie) => cookie.name === AUTH_COOKIE_NAME,
    );
    expect(session).toBeUndefined();
  });

  test("A3: unknown email shows the same error as a wrong password", async ({
    page,
  }) => {
    await page.goto(urls.login);
    await page.getByLabel(ui.email).fill("nobody@example.com");
    await page
      .getByLabel(ui.password, { exact: true })
      .fill("not-the-admin-password");
    await page.getByRole("button", { name: ui.login }).click();

    await expect(alertWithText(page, ui.invalidCredentials)).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`${urls.login}`));
  });

  test("A4: successful login sets an HttpOnly session cookie @mobile", async ({
    page,
    context,
  }) => {
    const { email, password } = getAdminCredentials();
    await page.goto(urls.login);
    await page.getByLabel(ui.email).fill(email);
    await page.getByLabel(ui.password, { exact: true }).fill(password);
    await page.getByRole("button", { name: ui.login }).click();

    await expect(page).toHaveURL(urls.products);
    await expect(
      page.getByRole("heading", { name: ui.productsHeading }),
    ).toBeVisible();

    const session = (await context.cookies()).find(
      (cookie) => cookie.name === AUTH_COOKIE_NAME,
    );
    expect(session).toBeDefined();
    expect(session?.httpOnly).toBe(true);
    const documentCookie = await page.evaluate(() => document.cookie);
    expect(documentCookie).not.toContain(AUTH_COOKIE_NAME);
  });

  test("A5: logout returns to login and Back does not reveal admin HTML", async ({
    page,
  }) => {
    const { email, password } = getAdminCredentials();
    const product = await findPublishedProduct();

    await page.goto(urls.login);
    await page.getByLabel(ui.email).fill(email);
    await page.getByLabel(ui.password, { exact: true }).fill(password);
    await page.getByRole("button", { name: ui.login }).click();
    await expect(page).toHaveURL(urls.products);

    await page.getByRole("button", { name: ui.userMenu(email) }).click();
    await page.getByRole("menuitem", { name: ui.logout }).click();
    await expect(page).toHaveURL(new RegExp(`${urls.login}`));

    await page.goto(urls.products);
    await expect(page).toHaveURL(new RegExp(`${urls.login}`));

    await page.goBack();
    await expect(page.locator("body")).not.toContainText(product.name);
    await expect(
      page.getByRole("heading", { name: ui.productsHeading }),
    ).toHaveCount(0);
  });

  test("A6: empty login fields stay client-side", async ({ page }) => {
    await page.goto(urls.login);
    const loginRequests = listenForLogin(page);
    await page.getByRole("button", { name: ui.login }).click();

    await expect(
      page.getByRole("alert").filter({ hasText: ui.emailInvalid }),
    ).toBeVisible();
    await expect(
      page.getByRole("alert").filter({ hasText: ui.required }),
    ).toBeVisible();
    expect(loginRequests.count()).toBe(0);
    loginRequests.detach();
  });

  test("A7: password visibility toggle", async ({ page }) => {
    await page.goto(urls.login);
    const input = page.getByLabel(ui.password, { exact: true });
    await expect(input).toHaveAttribute("type", "password");

    await page.getByRole("button", { name: ui.showPassword }).click();
    await expect(input).toHaveAttribute("type", "text");

    await page.getByRole("button", { name: ui.hidePassword }).click();
    await expect(input).toHaveAttribute("type", "password");
  });
});
