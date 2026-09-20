import { SITE_NAME } from "@/config/site";
import { PublicContainer } from "./public-container";

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-black text-white">
      <PublicContainer className="p-6">
        <p className="text-center text-sm text-white">
          © {year} {SITE_NAME} All rights reserved.
        </p>
      </PublicContainer>
    </footer>
  );
}
