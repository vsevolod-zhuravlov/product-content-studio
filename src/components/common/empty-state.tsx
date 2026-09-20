import type { ReactNode } from "react";
import { PackageOpen } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  iconClassName?: string;
  className?: string;
};

export function EmptyState({
  title,
  description,
  action,
  icon,
  iconClassName,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-card px-6 py-12 text-center",
        className,
      )}
    >
      <div
        className={cn(
          "mb-4 flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground",
          iconClassName,
        )}
        aria-hidden="true"
      >
        {icon ?? <PackageOpen className="size-5" />}
      </div>
      <h2 className="text-base font-semibold">{title}</h2>
      {description ? (
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
