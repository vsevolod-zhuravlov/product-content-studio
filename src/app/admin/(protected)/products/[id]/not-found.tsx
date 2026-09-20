import Link from "next/link";
import { EmptyState } from "@/components/common/empty-state";
import { buttonVariants } from "@/components/ui/button";

export default function ProductNotFound() {
  return (
    <EmptyState
      title="Товар не знайдено"
      description="Цього товару немає в каталозі або його вже видалили."
      action={
        <Link
          className={buttonVariants({ className: "h-10" })}
          href="/admin/products"
        >
          До списку товарів
        </Link>
      }
    />
  );
}
