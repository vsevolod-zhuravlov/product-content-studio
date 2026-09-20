import type { AdminProductListItem } from "@/lib/api-types";
import { ProductCard } from "./product-card";

type ProductCardListProps = {
  products: AdminProductListItem[];
};

export function ProductCardList({ products }: ProductCardListProps) {
  return (
    <div className="grid gap-3 md:hidden">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
