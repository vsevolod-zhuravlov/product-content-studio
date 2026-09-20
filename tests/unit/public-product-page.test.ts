import { beforeEach, describe, expect, it, vi } from "vitest";

const { getPublicProduct, notFound, listPublishedProducts } = vi.hoisted(
  () => ({
    getPublicProduct: vi.fn(),
    notFound: vi.fn(() => {
      throw new Error("NEXT_NOT_FOUND");
    }),
    listPublishedProducts: vi.fn(),
  }),
);

vi.mock("@/server/products/get-public-product", () => ({
  getPublicProduct,
}));

vi.mock("next/navigation", () => ({
  notFound,
}));

vi.mock("@/server/products/products.service", () => ({
  listPublishedProducts,
}));

describe("public product page", () => {
  beforeEach(() => {
    getPublicProduct.mockReset();
    notFound.mockClear();
    listPublishedProducts.mockReset();
  });

  it("takes the same not-found path for a draft slug and an unknown slug", async () => {
    getPublicProduct.mockResolvedValue(null);
    const { default: ProductPage } = await import(
      "@/app/(public)/products/[slug]/page"
    );

    await expect(
      ProductPage({ params: Promise.resolve({ slug: "hidden-draft" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(
      ProductPage({ params: Promise.resolve({ slug: "missing-slug" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(getPublicProduct).toHaveBeenCalledWith("hidden-draft");
    expect(getPublicProduct).toHaveBeenCalledWith("missing-slug");
    expect(notFound).toHaveBeenCalledTimes(2);
    expect(listPublishedProducts).not.toHaveBeenCalled();
  });
});
