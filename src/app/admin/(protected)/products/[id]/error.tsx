"use client";

import { ErrorState } from "@/components/common/error-state";

export default function ProductEditorError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ErrorState title="Не вдалося завантажити товар" onRetry={retry} />;
}
