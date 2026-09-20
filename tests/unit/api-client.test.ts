import { afterEach, describe, expect, it, vi } from "vitest";
import type { AdminProduct } from "@/lib/api-types";
import { saveProduct } from "@/lib/api/client";
import type { ProductEditInput } from "@/lib/validation/product";

const input: ProductEditInput = {
  description: "Опис",
  seoTitle: "Заголовок",
  seoDescription: "Опис для пошуку",
  status: "DRAFT",
};

const product: AdminProduct = {
  id: "product-1",
  slug: "product",
  name: "Товар",
  specs: [],
  ...input,
  updatedAt: "2026-09-20T12:00:00.000Z",
};

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("saveProduct", () => {
  it("sends JSON with same-origin credentials and unwraps a 200 response", async () => {
    const fetchStub = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ data: product }, 200));
    vi.stubGlobal("fetch", fetchStub);

    await expect(saveProduct("product-1", input)).resolves.toEqual({
      ok: true,
      data: product,
    });
    expect(fetchStub).toHaveBeenCalledWith(
      "/api/admin/products/product-1",
      expect.objectContaining({
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("returns validation field errors for 400", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(
        jsonResponse(
          {
            error: "Validation failed",
            fieldErrors: { seoTitle: ["Максимум 60 символів"] },
          },
          400,
        ),
      ),
    );

    await expect(saveProduct("product-1", input)).resolves.toEqual({
      ok: false,
      kind: "validation",
      message: "Validation failed",
      fieldErrors: { seoTitle: ["Максимум 60 символів"] },
    });
  });

  it.each([
    [401, "unauthorized"],
    [404, "not_found"],
    [413, "too_large"],
  ] as const)("maps HTTP %i to %s", async (status, kind) => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(jsonResponse({ error: "Request failed" }, status)),
    );

    await expect(saveProduct("product-1", input)).resolves.toMatchObject({
      ok: false,
      kind,
      message: "Request failed",
    });
  });

  it("safely maps a non-JSON 500 response to server failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          new Response("<html>Failure</html>", { status: 500 }),
        ),
    );

    await expect(saveProduct("product-1", input)).resolves.toEqual({
      ok: false,
      kind: "server",
      message: "Server error",
    });
  });

  it("returns a network failure instead of throwing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockRejectedValue(new TypeError("Failed to fetch")),
    );

    await expect(saveProduct("product-1", input)).resolves.toEqual({
      ok: false,
      kind: "network",
      message: "Network error",
    });
  });

  it("aborts after 15 seconds and returns a timeout failure", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockImplementation((_url, init) => {
        return new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        });
      }),
    );

    const resultPromise = saveProduct("product-1", input);
    await vi.advanceTimersByTimeAsync(15_000);

    await expect(resultPromise).resolves.toEqual({
      ok: false,
      kind: "timeout",
      message: "Request timed out",
    });
  });
});
