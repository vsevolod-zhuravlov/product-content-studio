import "server-only";
import { z } from "zod";
import { ProductStatus, type Product } from "@/generated/prisma/client";
import type { PublicProduct } from "@/lib/api-types";
import { db } from "@/lib/db";
import { productEditSchema } from "@/lib/validation/product";
import { NotFoundError, ValidationError } from "@/server/errors";
import { toPublicProduct } from "./product.dto";

const publicProductSelect = {
  slug: true,
  name: true,
  specs: true,
  description: true,
  seoTitle: true,
  seoDescription: true,
} as const;

export async function listPublishedProducts(): Promise<PublicProduct[]> {
  const products = await db.product.findMany({
    where: { status: ProductStatus.PUBLISHED },
    orderBy: { name: "asc" },
    select: publicProductSelect,
  });

  return products.map(toPublicProduct);
}

export async function getPublishedProductBySlug(
  slug: string,
): Promise<PublicProduct | null> {
  const product = await db.product.findFirst({
    where: { slug, status: ProductStatus.PUBLISHED },
    select: publicProductSelect,
  });

  return product ? toPublicProduct(product) : null;
}

export async function listAdminProducts(): Promise<
  Array<Pick<Product, "id" | "name" | "status" | "updatedAt">>
> {
  return db.product.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      status: true,
      updatedAt: true,
    },
  });
}

export async function getAdminProduct(id: string): Promise<Product> {
  const product = await db.product.findUnique({ where: { id } });

  if (!product) {
    throw new NotFoundError();
  }

  return product;
}

export async function updateProduct(
  id: string,
  input: unknown,
): Promise<Product> {
  const validation = productEditSchema.safeParse(input);

  if (!validation.success) {
    throw new ValidationError(toFieldErrors(validation.error));
  }

  try {
    return await db.product.update({
      where: { id },
      data: validation.data,
    });
  } catch (error: unknown) {
    if (isRecordNotFoundError(error)) {
      throw new NotFoundError();
    }

    throw error;
  }
}

function toFieldErrors(error: z.ZodError): Record<string, string[]> {
  const normalized: Record<string, string[]> = {};

  for (const issue of error.issues) {
    if (issue.code === "unrecognized_keys") {
      for (const key of issue.keys) {
        normalized[key] = [issue.message];
      }
      continue;
    }

    const field = typeof issue.path[0] === "string" ? issue.path[0] : "_root";
    normalized[field] = [...(normalized[field] ?? []), issue.message];
  }

  return normalized;
}

function isRecordNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2025"
  );
}
