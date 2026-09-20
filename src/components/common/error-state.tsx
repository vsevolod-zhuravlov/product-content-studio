"use client";

import { CircleAlert, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryVariant?: "outline" | "default";
  iconClassName?: string;
  className?: string;
};

export function ErrorState({
  title = "Не вдалося завантажити дані",
  description = "Спробуйте ще раз.",
  onRetry,
  retryVariant = "outline",
  iconClassName,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex min-h-64 flex-col items-center justify-center rounded-xl border bg-card px-6 py-12 text-center",
        className,
      )}
    >
      <div
        className={cn(
          "mb-4 flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive",
          iconClassName,
        )}
      >
        <CircleAlert className="size-5" aria-hidden="true" />
      </div>
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        {description}
      </p>
      {onRetry ? (
        <Button className="mt-5" variant={retryVariant} onClick={onRetry}>
          <RotateCcw aria-hidden="true" />
          Спробувати ще раз
        </Button>
      ) : null}
    </div>
  );
}
