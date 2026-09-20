import { cn } from "@/lib/utils";
import { getCoverBackground } from "@/server/cover";

type ProductCoverProps = {
  slug: string;
  size?: "card" | "split";
  className?: string;
};

const sizeClassName = {
  card: "aspect-[16/10]",
  split: "size-full",
} as const;

export function ProductCover({
  slug,
  size = "card",
  className,
}: ProductCoverProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative w-full overflow-hidden bg-repeat ring-1 ring-black/5 ring-inset",
        sizeClassName[size],
        className,
      )}
      style={{ backgroundImage: getCoverBackground(slug) }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
    </div>
  );
}
