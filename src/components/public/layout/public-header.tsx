import Link from "next/link";
import { SITE_NAME } from "@/config/site";
import { PublicContainer } from "./public-container";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <PublicContainer className="flex h-16 items-center">
        <Link
          href="/"
          className="rounded-md text-lg font-semibold tracking-tight outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {SITE_NAME}
        </Link>
      </PublicContainer>
    </header>
  );
}
