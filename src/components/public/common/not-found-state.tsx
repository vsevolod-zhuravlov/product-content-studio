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
      <section className="flex w-full max-w-md flex-col items-center rounded-xl border bg-card px-6 py-12 text-center shadow-sm">
        <div
          className="mb-4 flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground"
          aria-hidden="true"
        >
          <SearchX className="size-5" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
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
