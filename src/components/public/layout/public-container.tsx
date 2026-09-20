import type { ReactNode } from "react";
import { cn } from "cn";

const sizes = {
  catalog: "max-w-6xl",
  product: "max-w-5xl",
} as const;

type PublicContainerProps = {
  children: ReactNode;
  size?: keyof typeof sizes;
  className?: string;
};

export function PublicContainer({
  children,
  size = "catalog",
  className,
}: PublicContainerProps) {
  return (
    <div className={cn("mx-auto w-full px-4 sm:px-6", sizes[size], className)}>
      {children}
    </div>
  );
}
