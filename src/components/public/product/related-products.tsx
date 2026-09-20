import type { PublicProduct } from "@/lib/api-types";
import { ProductGrid } from "@/components/public/catalog/product-grid";

type RelatedProductsProps = {
  products: PublicProduct[];
};

export function RelatedProducts({ products }: RelatedProductsProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold tracking-tight text-balance">
        Інші товари
      </h2>
      <ProductGrid products={products} />
    </section>
  );
}
