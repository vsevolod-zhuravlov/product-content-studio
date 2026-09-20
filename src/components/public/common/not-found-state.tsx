import { SearchX } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

type NotFoundStateProps = {
  title?: string;
};

export function NotFoundState({
  title = "Товар не знайдено",
}: NotFoundStateProps) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center py-8">
      <section className="flex w-full max-w-md flex-col items-center rounded-2xl border bg-card px-6 py-12 text-center shadow-public">
        <div
          className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-secondary text-primary"
          aria-hidden="true"
        >
          <SearchX className="size-6" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-balance">
          {title}
        </h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Можливо, його не існує або він тимчасово недоступний
        </p>
        <Link className={buttonVariants({ className: "mt-6 h-10" })} href="/">
          Повернутися до каталогу
        </Link>
      </section>
    </div>
  );
}
