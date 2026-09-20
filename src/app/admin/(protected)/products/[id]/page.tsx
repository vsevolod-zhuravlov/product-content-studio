import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ProductEditorForm } from "@/components/products/editor/product-editor-form";
import { requireAdminPage } from "@/lib/auth/session";
import { NotFoundError } from "@/server/errors";
import { toAdminProduct } from "@/server/products/product.dto";
import { getAdminProduct } from "@/server/products/products.service";

const loadProduct = cache(async (id: string) => {
  try {
    return toAdminProduct(await getAdminProduct(id));
  } catch (error) {
    if (error instanceof NotFoundError) {
      return null;
    }
    throw error;
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await loadProduct(id);

  return {
    title: product?.name ?? "Товар не знайдено",
  };
}

export default async function ProductEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const product = await loadProduct(id);

  if (!product) {
    notFound();
  }

  return <ProductEditorForm product={product} />;
}
