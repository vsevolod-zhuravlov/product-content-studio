import type { PublicProduct } from "@/lib/api-types";
import { CatalogProductCard } from "./catalog-product-card";

type ProductGridProps = {
  products: PublicProduct[];
};

export function ProductGrid({ products }: ProductGridProps) {
  return (
    <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:auto-rows-[1fr] lg:gap-5">
      {products.map((product, index) => (
        <li key={product.slug} className="h-full min-w-0">
          <CatalogProductCard product={product} index={index} />
        </li>
      ))}
    </ul>
  );
}
