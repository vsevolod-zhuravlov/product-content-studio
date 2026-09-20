import type { Metadata } from "next";
import { CATALOG_DESCRIPTION, CATALOG_TITLE } from "@/config/site";
import type { PublicProduct } from "@/lib/api-types";

export const catalogMetadata: Metadata = {
  title: { absolute: CATALOG_TITLE },
  description: CATALOG_DESCRIPTION,
};

export function buildProductMetadata(product: PublicProduct | null): Metadata {
  if (!product) {
    return {
      title: { absolute: "Товар не знайдено" },
      robots: { index: false, follow: false },
    };
  }

  return {
    title: { absolute: product.seoTitle },
    description: product.seoDescription,
    openGraph: {
      title: product.seoTitle,
      description: product.seoDescription,
      type: "website",
    },
  };
}
