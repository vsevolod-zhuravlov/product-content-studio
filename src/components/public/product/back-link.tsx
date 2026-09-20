import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

type BackLinkProps = {
  name: string;
};

export function BackLink({ name }: BackLinkProps) {
  return (
    <div className="flex min-w-0 items-center">
      <Link
        href="/"
        aria-label="Назад до каталогу"
        className="inline-flex size-10 shrink-0 items-center justify-center text-muted-foreground outline-none"
      >
        <ArrowLeft className="size-5" aria-hidden="true" />
      </Link>
      <Breadcrumbs
        items={[
          { label: "Каталог", href: "/" },
          { label: name },
        ]}
      />
    </div>
  );
}
