import type { Metadata } from "next";
import { NotFoundState } from "@/components/public/common/not-found-state";
import { PublicFooter } from "@/components/public/layout/public-footer";
import { PublicHeader } from "@/components/public/layout/public-header";
import { PublicContainer } from "@/components/public/layout/public-container";
import { SkipLink } from "@/components/public/layout/skip-link";

export const metadata: Metadata = {
  title: { absolute: "Сторінку не знайдено" },
  robots: { index: false, follow: false },
};

export default function RootNotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SkipLink />
      <PublicHeader />
      <main
        id="content"
        tabIndex={-1}
        className="flex-1 py-10 outline-none sm:py-12"
      >
        <PublicContainer>
          <NotFoundState title="Сторінку не знайдено" />
        </PublicContainer>
      </main>
      <PublicFooter />
    </div>
  );
}
