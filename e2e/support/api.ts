import { type APIRequestContext, type APIResponse } from "@playwright/test";
import { urls } from "./ui";

export async function readJson(response: APIResponse): Promise<{
  status: number;
  text: string;
  body: unknown;
}> {
  const text = await response.text();
  let body: unknown = undefined;
  try {
    body = JSON.parse(text) as unknown;
  } catch {
    body = undefined;
  }
  return { status: response.status(), text, body };
}

export async function adminPut(
  request: APIRequestContext,
  id: string,
  data: unknown,
  extraHeaders: Record<string, string> = {},
) {
  return request.put(urls.adminProductApi(id), {
    data,
    headers: {
      "content-type": "application/json",
      ...extraHeaders,
    },
  });
}

export async function adminGet(request: APIRequestContext, id: string) {
  return request.get(urls.adminProductApi(id));
}

export const PUBLIC_PRODUCT_KEYS = [
  "slug",
  "name",
  "specs",
  "description",
  "seoTitle",
  "seoDescription",
].sort();

export function objectKeys(value: unknown): string[] {
  if (typeof value !== "object" || value === null) {
    return [];
  }
  return Object.keys(value).sort();
}
