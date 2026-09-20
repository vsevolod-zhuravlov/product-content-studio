import type { PublicProduct } from "@/lib/api-types";
import { ProductCover } from "@/components/public/common/product-cover";
import { BackLink } from "./back-link";
import { ProductDescription } from "./product-description";
import { RelatedProducts } from "./related-products";
import { SpecsCard } from "./specs-card";

type ProductDetailProps = {
  product: PublicProduct;
  related?: PublicProduct[];
};

export function ProductDetail({ product, related = [] }: ProductDetailProps) {
  return (
    <div className="space-y-12 motion-safe:animate-public-enter">
      <article>
        <BackLink name={product.name} />
        <div className="flex flex-col gap-6 sm:flex-row sm:items-stretch">
          <div className="aspect-[3/4] w-full shrink-0 overflow-hidden rounded-2xl border bg-card shadow-public sm:aspect-auto sm:w-72 sm:self-stretch lg:w-80">
            <ProductCover slug={product.slug} size="split" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-semibold tracking-tight text-balance break-words sm:text-4xl lg:text-5xl">
              {product.name}
            </h1>
            <div className="mt-6 space-y-6">
              <ProductDescription description={product.description} />
              <SpecsCard specs={product.specs} />
            </div>
          </div>
        </div>
      </article>
      <RelatedProducts products={related} />
    </div>
  );
}
