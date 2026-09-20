import { LoaderCircle } from "lucide-react";
import { formatTime } from "@/lib/format";

export type SaveStatus =
  | { kind: "clean" }
  | { kind: "dirty" }
  | { kind: "saving" }
  | { kind: "saved"; at: Date }
  | { kind: "invalid" }
  | { kind: "failed" };

type SaveStatusIndicatorProps = {
  status: SaveStatus;
};

export function SaveStatusIndicator({ status }: SaveStatusIndicatorProps) {
  if (status.kind === "clean") {
    return null;
  }

  const content = (() => {
    switch (status.kind) {
      case "dirty":
        return "Є незбережені зміни";
      case "saving":
        return (
          <>
            <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
            Збереження…
          </>
        );
      case "saved":
        return `Збережено о ${formatTime(status.at)}`;
      case "invalid":
        return "Перевірте виділені поля";
      case "failed":
        return "Не вдалося зберегти";
    }
  })();

  return (
    <p
      aria-live="polite"
      className="flex items-center gap-1.5 text-sm text-muted-foreground"
    >
      {content}
    </p>
  );
}
