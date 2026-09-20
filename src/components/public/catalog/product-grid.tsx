import type { PublicProduct } from "@/lib/api-types";
import { CatalogProductCard } from "./catalog-product-card";

type ProductGridProps = {
  products: PublicProduct[];
};

export function ProductGrid({ products }: ProductGridProps) {
  return (
    <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <li key={product.slug} className="h-full min-w-0">
          <CatalogProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
