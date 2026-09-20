import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicContainer } from "@/components/public/layout/public-container";
import { ProductDetail } from "@/components/public/product/product-detail";
import { buildProductMetadata } from "@/lib/public-metadata";
import { getPublicProduct } from "@/server/products/get-public-product";
import { listPublishedProducts } from "@/server/products/products.service";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return buildProductMetadata(await getPublicProduct(slug));
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getPublicProduct(slug);

  if (!product) {
    notFound();
  }

  const related = (await listPublishedProducts())
    .filter((item) => item.slug !== product.slug)
    .slice(0, 3);

  return (
    <PublicContainer>
      <ProductDetail product={product} related={related} />
    </PublicContainer>
  );
}
