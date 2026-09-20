import { cn } from "cn";
import { getCharacterCountState } from "@/lib/product-editor";

type CharacterCounterProps = {
  id: string;
  value: string;
  limit: number;
};

export function CharacterCounter({ id, value, limit }: CharacterCounterProps) {
  const state = getCharacterCountState(value, limit);
  const percent = Math.min(100, limit === 0 ? 0 : (state.count / limit) * 100);
  const isWarning =
    !state.isEmpty && !state.isOverLimit && state.count / limit >= 0.8;

  return (
    <div id={id} className="space-y-1">
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-[width,background-color]",
            state.isOverLimit
              ? "bg-destructive"
              : isWarning
                ? "bg-success"
                : state.isEmpty
                  ? "bg-border"
                  : "bg-primary/50",
          )}
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={limit}
          aria-valuenow={Math.min(state.count, limit)}
          aria-label={`${state.count} з ${limit} символів`}
        />
      </div>
      <p
        className={cn(
          "text-xs tabular-nums",
          state.isOverLimit
            ? "text-destructive"
            : isWarning
              ? "text-success"
              : "text-muted-foreground",
        )}
      >
        {state.count} / {limit}
      </p>
    </div>
  );
}
