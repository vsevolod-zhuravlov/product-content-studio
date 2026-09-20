import { SITE_NAME } from "@/config/site";
import { PublicContainer } from "./public-container";

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t bg-background/80">
      <PublicContainer className="py-6">
        <p className="text-center text-sm text-muted-foreground">
          © {year} {SITE_NAME}
        </p>
      </PublicContainer>
    </footer>
  );
}
