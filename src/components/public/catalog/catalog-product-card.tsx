import Link from "next/link";
import type { PublicProduct } from "@/lib/api-types";
import { ProductImagePlaceholder } from "@/components/public/common/product-image-placeholder";

type CatalogProductCardProps = {
  product: PublicProduct;
};

export function CatalogProductCard({ product }: CatalogProductCardProps) {
  return (
    <article className="relative flex h-full min-w-0 flex-col overflow-hidden rounded-xl border bg-card shadow-sm motion-safe:transition-[border-color,box-shadow] motion-safe:hover:border-primary/25 motion-safe:hover:shadow-md">
      <ProductImagePlaceholder />
      <div className="flex min-w-0 flex-1 flex-col p-5">
        <h2 className="line-clamp-2 text-lg font-semibold break-words">
          <Link
            href={`/products/${product.slug}`}
            className="outline-none after:absolute after:inset-0 after:z-10 after:rounded-xl after:content-[''] focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
          >
            {product.name}
          </Link>
        </h2>
        <p className="mt-2 line-clamp-2 flex-1 text-sm break-words text-muted-foreground">
          {product.description}
        </p>
        <p className="mt-4 text-sm font-medium text-primary" aria-hidden="true">
          Докладніше →
        </p>
      </div>
    </article>
  );
}
