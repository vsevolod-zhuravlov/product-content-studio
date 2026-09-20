import { describe, expect, it } from "vitest";
import type { PublicProduct } from "@/lib/api-types";
import { buildProductMetadata } from "@/lib/public-metadata";

const product: PublicProduct = {
  slug: "aurora-x2",
  name: "Aurora X2",
  specs: [],
  description: "Опис",
  seoTitle: "Custom SEO Title",
  seoDescription: "Custom SEO Description",
};

describe("buildProductMetadata", () => {
  it("uses the stored SEO title absolutely, without a site-name suffix", () => {
    const metadata = buildProductMetadata(product);

    expect(metadata.title).toEqual({ absolute: product.seoTitle });
    expect(metadata.description).toBe(product.seoDescription);
    expect(JSON.stringify(metadata.title)).not.toContain("Store");
    expect(metadata.openGraph).toEqual({
      title: product.seoTitle,
      description: product.seoDescription,
      type: "website",
    });
  });

  it("returns a noindex title for a missing product", () => {
    const metadata = buildProductMetadata(null);

    expect(metadata.title).toEqual({ absolute: "Товар не знайдено" });
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
