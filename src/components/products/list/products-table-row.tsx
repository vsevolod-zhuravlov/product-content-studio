import { Pencil } from "lucide-react";
import Link from "next/link";
import { FormattedDate } from "@/components/common/formatted-date";
import { StatusBadge } from "@/components/common/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import type { AdminProductListItem } from "@/lib/api-types";

type ProductsTableRowProps = {
  product: AdminProductListItem;
};

export function ProductsTableRow({ product }: ProductsTableRowProps) {
  const href = `/admin/products/${product.id}`;

  return (
    <TableRow>
      <TableCell className="px-4 py-3 font-medium">
        <Link
          className="rounded-sm text-foreground underline-offset-4 outline-none hover:text-primary hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          href={href}
        >
          {product.name}
        </Link>
      </TableCell>
      <TableCell className="px-4 py-3">
        <StatusBadge status={product.status} />
      </TableCell>
      <TableCell className="px-4 py-3 text-muted-foreground">
        <FormattedDate value={product.updatedAt} />
      </TableCell>
      <TableCell className="px-4 py-3 text-right">
        <Link
          className={buttonVariants({ variant: "outline", size: "sm" })}
          href={href}
          aria-label={`Редагувати товар «${product.name}»`}
        >
          <Pencil aria-hidden="true" />
          Редагувати
        </Link>
      </TableCell>
    </TableRow>
  );
}
