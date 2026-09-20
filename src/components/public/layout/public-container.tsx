import type { ReactNode } from "react";
import { cn } from "cn";

type PublicContainerProps = {
  children: ReactNode;
  className?: string;
};

export function PublicContainer({ children, className }: PublicContainerProps) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", className)}>
      {children}
    </div>
  );
}
