import { formatProductCount } from "@/lib/format";

type CatalogHeaderProps = {
  count: number;
};

export function CatalogHeader({ count }: CatalogHeaderProps) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Каталог
        </h1>
        <p className="text-muted-foreground">Опубліковані товари</p>
      </div>
      <p className="text-sm text-muted-foreground">
        {formatProductCount(count)}
      </p>
    </header>
  );
}
