"use client";

import { ErrorState } from "@/components/common/error-state";
import { PublicContainer } from "@/components/public/layout/public-container";

export default function PublicError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <PublicContainer>
      <ErrorState
        title="Не вдалося завантажити каталог"
        onRetry={retry}
        retryVariant="default"
        className="rounded-2xl shadow-public"
        iconClassName="size-14 rounded-2xl bg-gradient-to-br from-destructive/15 to-secondary text-destructive"
      />
    </PublicContainer>
  );
}
