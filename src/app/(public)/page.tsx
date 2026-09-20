import { PackageOpen } from "lucide-react";
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
      <CatalogHeader count={products.length} />
      {products.length === 0 ? (
        <EmptyState
          title="Поки що немає опублікованих товарів"
          className="mx-auto max-w-lg rounded-2xl border-solid shadow-public"
          icon={<PackageOpen className="size-6" />}
          iconClassName="size-14 rounded-2xl bg-gradient-to-br from-primary/15 to-secondary text-primary"
        />
      ) : (
        <ProductGrid products={products} />
      )}
    </PublicContainer>
  );
}
