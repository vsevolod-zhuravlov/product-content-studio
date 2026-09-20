import { randomUUID } from "node:crypto";
import {
  ProductStatus,
  type Prisma,
} from "@/generated/prisma/client";

export function buildProduct(
  overrides: Partial<Prisma.ProductCreateInput> = {},
): Prisma.ProductCreateInput {
  const suffix = randomUUID();

  return {
    slug: `product-${suffix}`,
    name: `Product ${suffix}`,
    specs: [{ label: "Колір", value: "Чорний" }],
    description: "Опис товару",
    seoTitle: "SEO title",
    seoDescription: "SEO description",
    status: ProductStatus.DRAFT,
    ...overrides,
  };
}
