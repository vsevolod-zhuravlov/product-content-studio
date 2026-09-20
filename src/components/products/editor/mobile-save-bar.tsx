import { EditorActions } from "@/components/products/editor/editor-actions";

type MobileSaveBarProps = {
  formId: string;
  canSave: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
};

export function MobileSaveBar({
  formId,
  canSave,
  isSubmitting,
  onCancel,
}: MobileSaveBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 p-3 backdrop-blur lg:hidden">
      <EditorActions
        formId={formId}
        canSave={canSave}
        isSubmitting={isSubmitting}
        onCancel={onCancel}
        layout="stack"
      />
    </div>
  );
}
