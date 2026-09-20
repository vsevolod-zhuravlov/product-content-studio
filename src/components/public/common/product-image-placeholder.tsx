import { Image as ImageIcon } from "lucide-react";
import { cn } from "cn";

type ProductImagePlaceholderProps = {
  aspect?: "4/3" | "square";
  className?: string;
};

export function ProductImagePlaceholder({
  aspect = "4/3",
  className,
}: ProductImagePlaceholderProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex items-center justify-center bg-gradient-to-br from-muted to-secondary",
        aspect === "square" ? "aspect-square" : "aspect-[4/3]",
        className,
      )}
    >
      <ImageIcon className="size-10 text-muted-foreground/70" />
    </div>
  );
}
