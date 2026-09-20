import { Package } from "lucide-react";
import { cn } from "cn";
import { GuardedLink } from "@/components/common/guarded-link";

type AppLogoProps = {
  href?: string;
  className?: string;
};

export function AppLogo({ href = "/admin/products", className }: AppLogoProps) {
  return (
    <GuardedLink
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-md font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
      aria-label="Product Content Studio — на головну"
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Package className="size-4" aria-hidden="true" />
      </span>
      <span className="text-xl font-bold hidden sm:inline">Product Content Studio</span>
    </GuardedLink>
  );
}
