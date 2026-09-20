import type { PublicProduct } from "@/lib/api-types";
import { ProductImagePlaceholder } from "@/components/public/common/product-image-placeholder";
import { BackLink } from "./back-link";
import { ProductDescription } from "./product-description";
import { SpecsCard } from "./specs-card";

type ProductDetailProps = {
  product: PublicProduct;
};

export function ProductDetail({ product }: ProductDetailProps) {
  return (
    <div className="space-y-8">
      <BackLink />
      <article>
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start lg:gap-12">
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <ProductImagePlaceholder />
          </div>
          <div className="min-w-0 space-y-8">
            <h1 className="text-3xl font-semibold tracking-tight break-words sm:text-4xl">
              {product.name}
            </h1>
            <ProductDescription description={product.description} />
            <SpecsCard specs={product.specs} />
          </div>
        </div>
      </article>
    </div>
  );
}
