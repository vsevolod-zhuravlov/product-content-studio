import { Store } from "lucide-react";
import Link from "next/link";
import { SITE_NAME } from "@/config/site";
import { PublicContainer } from "./public-container";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-card/80 backdrop-blur-md supports-backdrop-filter:bg-card/70">
      <PublicContainer className="flex h-16 items-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Store className="size-4" aria-hidden="true" />
          </span>
          <span className="text-xl font-bold tracking-tight">{SITE_NAME}</span>
        </Link>
      </PublicContainer>
    </header>
  );
}
