import {
  type Locator,
  type Page,
  type Request,
  expect,
} from "@playwright/test";
import { ui, urls } from "./ui";

export function visible(locator: Locator): Locator {
  return locator.filter({ visible: true });
}

export function saveButton(page: Page): Locator {
  return visible(page.getByRole("button", { name: ui.save }));
}

export function cancelButton(page: Page): Locator {
  return visible(page.getByRole("button", { name: ui.cancel }));
}

export function retryButton(page: Page): Locator {
  return visible(page.getByRole("button", { name: ui.retry }));
}

export function editProductLink(page: Page, name: string): Locator {
  return visible(page.getByRole("link", { name: ui.editProduct(name) }));
}

export function field(page: Page, label: string): Locator {
  return visible(page.getByLabel(label, { exact: true }));
}

export function fieldError(page: Page, fieldName: string): Locator {
  return page.locator(`#${fieldName}-error`);
}

export function fieldCounter(page: Page, fieldName: string): Locator {
  return page.locator(`#${fieldName}-counter p`);
}

export function listenForPuts(page: Page) {
  const urlsSeen: string[] = [];
  const handler = (request: Request) => {
    if (
      request.method() === "PUT" &&
      request.url().includes("/api/admin/products/")
    ) {
      urlsSeen.push(request.url());
    }
  };
  page.on("request", handler);
  return {
    urls: urlsSeen,
    count() {
      return urlsSeen.length;
    },
    detach() {
      page.off("request", handler);
    },
  };
}

export function listenForLogin(page: Page) {
  const urlsSeen: string[] = [];
  const handler = (request: Request) => {
    if (request.method() === "POST" && request.url().includes(urls.loginApi)) {
      urlsSeen.push(request.url());
    }
  };
  page.on("request", handler);
  return {
    count() {
      return urlsSeen.length;
    },
    detach() {
      page.off("request", handler);
    },
  };
}

export async function openEditor(
  page: Page,
  product: { id: string; name: string },
) {
  await page.goto(urls.product(product.id));
  await expect(
    visible(page.getByRole("heading", { name: product.name })),
  ).toBeVisible();
}

export async function fillControl(locator: Locator, value: string) {
  await locator.waitFor({ state: "visible" });
  await locator.click();
  await locator.evaluate((element, next) => {
    const input = element as HTMLInputElement | HTMLTextAreaElement;
    const prototype =
      input instanceof HTMLTextAreaElement
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
    setter?.call(input, next);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
  await expect(locator).toHaveValue(value);
}

export async function fillEditor(
  page: Page,
  values: {
    description?: string;
    seoTitle?: string;
    seoDescription?: string;
  },
) {
  if (values.description !== undefined) {
    await fillControl(field(page, ui.description), values.description);
  }
  if (values.seoTitle !== undefined) {
    await fillControl(field(page, ui.seoTitle), values.seoTitle);
  }
  if (values.seoDescription !== undefined) {
    await fillControl(field(page, ui.seoDescription), values.seoDescription);
  }
}

export async function setStatus(
  page: Page,
  label: typeof ui.draft | typeof ui.published,
) {
  await page.getByLabel(ui.publicationStatus).click();
  await page.getByRole("option", { name: label, exact: true }).click();
}

export async function clickSave(page: Page) {
  await saveButton(page).click();
}

export async function expectSavedToast(page: Page) {
  await expect(page.getByText(ui.savedToast).first()).toBeVisible();
}

export async function expectNoSavedToast(page: Page) {
  await expect(page.getByText(ui.savedToast)).toHaveCount(0);
}

export function alertWithText(page: Page, text: string): Locator {
  return page.getByRole("alert").filter({ hasText: text });
}

export async function expectNoHorizontalScroll(page: Page) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
}

export function interceptPut(
  page: Page,
  productId: string,
  handler: Parameters<Page["route"]>[1],
) {
  return page.route(`**/api/admin/products/${productId}`, (route, request) => {
    if (request.method() !== "PUT") {
      return route.continue();
    }
    return handler(route, request);
  });
}
