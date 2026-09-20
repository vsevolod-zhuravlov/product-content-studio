import { cn } from "cn";
import { Button } from "@/components/ui/button";

type EditorActionsProps = {
  formId: string;
  canSave: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
  layout?: "inline" | "stack";
  className?: string;
};

export function EditorActions({
  formId,
  canSave,
  isSubmitting,
  onCancel,
  layout = "inline",
  className,
}: EditorActionsProps) {
  return (
    <div
      className={cn(
        layout === "stack"
          ? "flex w-full flex-col-reverse gap-2 sm:flex-row"
          : "flex items-center gap-2",
        className,
      )}
    >
      <Button
        type="button"
        variant="outline"
        className={cn("h-10", layout === "stack" && "w-full sm:w-auto")}
        disabled={isSubmitting}
        onClick={onCancel}
      >
        Скасувати
      </Button>
      <Button
        type="submit"
        form={formId}
        className={cn("h-10", layout === "stack" && "w-full sm:flex-1")}
        disabled={!canSave}
      >
        Зберегти зміни
      </Button>
    </div>
  );
}
