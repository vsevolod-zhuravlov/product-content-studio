import { expect, test as setup } from "@playwright/test";
import { getAdminCredentials } from "./support/env";
import { ui, urls } from "./support/ui";

const authFile = "e2e/.auth/user.json";

setup("authenticate via the login form", async ({ page }) => {
  const { email, password } = getAdminCredentials();

  await page.goto(urls.login);
  await page.getByLabel(ui.email).fill(email);
  await page.getByLabel(ui.password, { exact: true }).fill(password);
  await page.getByRole("button", { name: ui.login }).click();
  await expect(page).toHaveURL(urls.products);
  await expect(
    page.getByRole("heading", { name: ui.productsHeading }),
  ).toBeVisible();

  await page.context().storageState({ path: authFile });
});
