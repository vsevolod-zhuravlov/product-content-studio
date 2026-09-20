import { formatProductCount } from "@/lib/format";

type ProductsCountProps = {
  count: number;
};

export function ProductsCount({ count }: ProductsCountProps) {
  return (
    <span className="inline-flex rounded-full bg-secondary px-2.5 py-1 text-sm font-medium text-secondary-foreground">
      {formatProductCount(count)}
    </span>
  );
}
