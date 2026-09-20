import type { Metadata } from "next";
import { NotFoundState } from "@/components/public/common/not-found-state";
import { PublicContainer } from "@/components/public/layout/public-container";

export const metadata: Metadata = {
  title: { absolute: "Товар не знайдено" },
  robots: { index: false, follow: false },
};

export default function PublicNotFound() {
  return (
    <PublicContainer>
      <NotFoundState />
    </PublicContainer>
  );
}
