import { ArrowLeft } from "lucide-react";
import { GuardedLink } from "@/components/common/guarded-link";
import { StatusBadge } from "@/components/common/status-badge";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { EditorActions } from "@/components/products/editor/editor-actions";
import { SaveStatusIndicator, type SaveStatus } from "@/components/products/editor/save-status-indicator";
import type { ProductStatus } from "@/lib/api-types";

type EditorHeaderProps = {
  name: string;
  savedStatus: ProductStatus;
  saveStatus: SaveStatus;
  formId: string;
  canSave: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
};

export function EditorHeader({
  name,
  savedStatus,
  saveStatus,
  formId,
  canSave,
  isSubmitting,
  onCancel,
}: EditorHeaderProps) {
  return (
    <div className="sticky top-16 z-20 -mx-4 border-b bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <GuardedLink
            href="/admin/products"
            aria-label="Назад до товарів"
            className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </GuardedLink>
          <div className="min-w-0 space-y-1">
            <Breadcrumbs
              items={[
                { label: "Товари", href: "/admin/products" },
                { label: name },
              ]}
            />
            <div className="flex flex-col items-start gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
              <h1
                className="max-w-full text-lg font-semibold tracking-tight break-words sm:truncate sm:text-xl"
                title={name}
              >
                {name}
              </h1>
              <StatusBadge status={savedStatus} className="shrink-0" />
            </div>
            <SaveStatusIndicator status={saveStatus} />
          </div>
        </div>
        <div className="hidden lg:block">
          <EditorActions
            formId={formId}
            canSave={canSave}
            isSubmitting={isSubmitting}
            onCancel={onCancel}
          />
        </div>
      </div>
    </div>
  );
}
