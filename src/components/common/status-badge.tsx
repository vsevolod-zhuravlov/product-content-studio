import { cn } from "@/lib/utils";
import type { ProductStatus } from "@/lib/api-types";

const statusDetails: Record<
  ProductStatus,
  { label: string; className: string; dotClassName: string }
> = {
  DRAFT: {
    label: "Чернетка",
    className: "bg-status-draft text-status-draft-foreground",
    dotClassName: "bg-status-draft-foreground",
  },
  PUBLISHED: {
    label: "Опубліковано",
    className: "bg-status-published text-status-published-foreground",
    dotClassName: "bg-status-published-foreground",
  },
};

type StatusBadgeProps = {
  status: ProductStatus;
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const details = statusDetails[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        details.className,
        className,
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", details.dotClassName)}
        aria-hidden="true"
      />
      {details.label}
    </span>
  );
}
