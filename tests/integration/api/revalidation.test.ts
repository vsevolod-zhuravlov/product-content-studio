import { beforeEach, describe, expect, it, vi } from "vitest";
import { PUT as updateAdminProduct } from "@/app/api/admin/products/[id]/route";
import { db } from "@/lib/db";
import { buildProduct } from "../../factories/product";
import { jsonApiRequest, validAdminToken } from "../../helpers/api";
import { resetDb } from "../../helpers/database";

const revalidatePath = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ revalidatePath }));

const validEdit = {
  description: "Оновлений опис",
  seoTitle: "Оновлений SEO заголовок",
  seoDescription: "Оновлений SEO опис",
  status: "PUBLISHED",
} as const;

const context = (id: string) => ({
  params: Promise.resolve({ id }),
});

beforeEach(async () => {
  revalidatePath.mockReset();
  await resetDb();
});

describe("public page revalidation", () => {
  it("revalidates the home page and updated product path after success", async () => {
    const product = await db.product.create({
      data: buildProduct({ slug: "revalidate-me" }),
    });
    const response = await updateAdminProduct(
      jsonApiRequest(
        `/api/admin/products/${product.id}`,
        "PUT",
        validEdit,
        await validAdminToken(),
      ),
      context(product.id),
    );

    expect(response.status).toBe(200);
    expect(revalidatePath.mock.calls).toEqual([
      ["/"],
      ["/products/revalidate-me"],
    ]);
  });

  it("does not revalidate after a 401, 400, or 404", async () => {
    const product = await db.product.create({ data: buildProduct() });

    const unauthorized = await updateAdminProduct(
      jsonApiRequest(
        `/api/admin/products/${product.id}`,
        "PUT",
        validEdit,
      ),
      context(product.id),
    );
    const invalid = await updateAdminProduct(
      jsonApiRequest(
        `/api/admin/products/${product.id}`,
        "PUT",
        { ...validEdit, seoTitle: "" },
        await validAdminToken(),
      ),
      context(product.id),
    );
    const missing = await updateAdminProduct(
      jsonApiRequest(
        "/api/admin/products/missing",
        "PUT",
        validEdit,
        await validAdminToken(),
      ),
      context("missing"),
    );

    expect([
      unauthorized.status,
      invalid.status,
      missing.status,
    ]).toEqual([401, 400, 404]);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
