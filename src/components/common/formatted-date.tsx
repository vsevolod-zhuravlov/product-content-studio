"use client";

import { useSyncExternalStore } from "react";
import { formatDateTime } from "@/lib/format";

type FormattedDateProps = {
  value: string | Date | null | undefined;
  fallback?: string;
  className?: string;
};

const subscribe = () => () => {};

export function FormattedDate({
  value,
  fallback,
  className,
}: FormattedDateProps) {
  const isMounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  if (!isMounted) {
    return (
      <span className={className} aria-hidden="true">
        {fallback ?? "—"}
      </span>
    );
  }

  const date = value instanceof Date ? value : value ? new Date(value) : null;
  const isValid = date !== null && !Number.isNaN(date.getTime());

  return (
    <time className={className} dateTime={isValid ? date.toISOString() : undefined}>
      {formatDateTime(value, fallback)}
    </time>
  );
}
