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
      <ErrorState title="Не вдалося завантажити каталог" onRetry={retry} />
    </PublicContainer>
  );
}
