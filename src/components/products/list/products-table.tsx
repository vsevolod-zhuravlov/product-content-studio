import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminProductListItem } from "@/lib/api-types";
import { ProductsTableRow } from "./products-table-row";

type ProductsTableProps = {
  products: AdminProductListItem[];
};

export function ProductsTable({ products }: ProductsTableProps) {
  return (
    <div className="hidden overflow-hidden rounded-xl border bg-card shadow-sm md:block">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-11 px-4" scope="col">
              Назва
            </TableHead>
            <TableHead className="h-11 px-4" scope="col">
              Статус
            </TableHead>
            <TableHead className="h-11 px-4" scope="col">
              Оновлено
            </TableHead>
            <TableHead className="h-11 px-4 text-right" scope="col">
              <span className="sr-only">Дії</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <ProductsTableRow key={product.id} product={product} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
