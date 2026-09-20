import "server-only";
import type { Product } from "@/generated/prisma/client";
import type {
  AdminProduct,
  AdminProductListItem,
  PublicProduct,
} from "@/lib/api-types";
import { specsSchema } from "@/lib/validation/product";

type AdminListSource = Pick<
  Product,
  "id" | "name" | "status" | "updatedAt"
>;

type PublicProductSource = Pick<
  Product,
  | "slug"
  | "name"
  | "specs"
  | "description"
  | "seoTitle"
  | "seoDescription"
>;

export function toAdminProductListItem(
  product: AdminListSource,
): AdminProductListItem {
  return {
    id: product.id,
    name: product.name,
    status: product.status,
    updatedAt: product.updatedAt.toISOString(),
  };
}

export function toAdminProduct(product: Product): AdminProduct {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    specs: specsSchema.parse(product.specs),
    description: product.description,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    status: product.status,
    updatedAt: product.updatedAt.toISOString(),
  };
}

export function toPublicProduct(
  product: PublicProductSource,
): PublicProduct {
  return {
    slug: product.slug,
    name: product.name,
    specs: specsSchema.parse(product.specs),
    description: product.description,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
  };
}
