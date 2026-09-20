import { EmptyState } from "@/components/common/empty-state";
import { CatalogHeader } from "@/components/public/catalog/catalog-header";
import { ProductGrid } from "@/components/public/catalog/product-grid";
import { PublicContainer } from "@/components/public/layout/public-container";
import { catalogMetadata } from "@/lib/public-metadata";
import { listPublishedProducts } from "@/server/products/products.service";

export const dynamic = "force-dynamic";
export const metadata = catalogMetadata;

export default async function CatalogPage() {
  const products = await listPublishedProducts();

  return (
    <PublicContainer>
      <div className="space-y-8 sm:space-y-10">
        <CatalogHeader count={products.length} />
        {products.length === 0 ? (
          <EmptyState title="Поки що немає опублікованих товарів" />
        ) : (
          <ProductGrid products={products} />
        )}
      </div>
    </PublicContainer>
  );
}
