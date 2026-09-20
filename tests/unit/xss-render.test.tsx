// @vitest-environment jsdom

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProductDescription } from "@/components/public/product/product-description";
import { buildProductMetadata } from "@/lib/public-metadata";
import type { PublicProduct } from "@/lib/api-types";

const payloads = [
  "<script>alert(1)</script>",
  '<img src=x onerror="alert(1)">',
  "</title><script>alert(1)</script>",
] as const;

function productWith(description: string, seoTitle: string): PublicProduct {
  return {
    slug: "xss-probe",
    name: "Probe",
    specs: [],
    description,
    seoTitle,
    seoDescription: description,
  };
}

describe("stored XSS rendering", () => {
  it.each(payloads)("escapes %s in the description and metadata", (payload) => {
    const { container } = render(
      <ProductDescription description={payload} />,
    );

    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain(payload);

    const metadata = buildProductMetadata(productWith(payload, payload));
    expect(metadata.title).toEqual({ absolute: payload });
    expect(metadata.description).toBe(payload);
    expect(JSON.stringify(metadata)).toContain(JSON.stringify(payload).slice(1, -1));
  });
});
