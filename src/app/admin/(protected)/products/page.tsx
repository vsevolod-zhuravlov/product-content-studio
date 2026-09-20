import type { Metadata } from "next";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { ProductCardList } from "@/components/products/list/product-card-list";
import { ProductsCount } from "@/components/products/list/products-count";
import { ProductsTable } from "@/components/products/list/products-table";
import { requireAdminPage } from "@/lib/auth/session";
import { toAdminProductListItem } from "@/server/products/product.dto";
import { listAdminProducts } from "@/server/products/products.service";

export const metadata: Metadata = {
  title: "Товари",
};

export default async function AdminProductsPage() {
  await requireAdminPage();
  const products = (await listAdminProducts()).map(toAdminProductListItem);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Товари"
        description="Редагування описів і SEO-полів товарів"
        actions={<ProductsCount count={products.length} />}
      />

      {products.length === 0 ? (
        <EmptyState title="Товарів поки немає" />
      ) : (
        <>
          <ProductsTable products={products} />
          <ProductCardList products={products} />
        </>
      )}
    </div>
  );
}
