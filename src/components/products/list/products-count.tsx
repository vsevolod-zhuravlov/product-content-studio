import { formatProductCount } from "@/lib/format";

type ProductsCountProps = {
  count: number;
};

export function ProductsCount({ count }: ProductsCountProps) {
  return (
    <span className="w-fit text-sm font-medium text-primary">
      {formatProductCount(count)}
    </span>
  );
}
