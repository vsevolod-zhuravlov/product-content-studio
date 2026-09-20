import type { ReactNode } from "react";
import { PublicFooter } from "@/components/public/layout/public-footer";
import { PublicHeader } from "@/components/public/layout/public-header";
import { SkipLink } from "@/components/public/layout/skip-link";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate flex min-h-screen flex-col bg-background">
      <SkipLink />
      <PublicHeader />
      <main id="content" tabIndex={-1} className="flex-1 py-10 outline-none">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
