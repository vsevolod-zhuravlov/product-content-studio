import { Pencil } from "lucide-react";
import Link from "next/link";
import { FormattedDate } from "@/components/common/formatted-date";
import { StatusBadge } from "@/components/common/status-badge";
import { buttonVariants } from "@/components/ui/button";
import type { AdminProductListItem } from "@/lib/api-types";

type ProductCardProps = {
  product: AdminProductListItem;
};

export function ProductCard({ product }: ProductCardProps) {
  const href = `/admin/products/${product.id}`;

  return (
    <article className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h2 className="min-w-0 text-base font-semibold">
          <Link
            className="rounded-sm underline-offset-4 outline-none hover:text-primary hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            href={href}
          >
            {product.name}
          </Link>
        </h2>
        <StatusBadge status={product.status} />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Оновлено: <FormattedDate value={product.updatedAt} />
      </p>
      <Link
        className={buttonVariants({
          variant: "outline",
          className: "mt-4 h-10 w-full",
        })}
        href={href}
        aria-label={`Редагувати товар «${product.name}»`}
      >
        <Pencil aria-hidden="true" />
        Редагувати
      </Link>
    </article>
  );
}
