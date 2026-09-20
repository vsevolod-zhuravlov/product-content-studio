import { formatProductCount } from "@/lib/format";

type CatalogHeaderProps = {
  count: number;
};

export function CatalogHeader({ count }: CatalogHeaderProps) {
  return (
    <header className="flex flex-col gap-4 pb-8 sm:flex-row sm:items-end sm:justify-between sm:pb-10">
      <div className="min-w-0">
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Каталог
        </h1>
        <p className="mt-2 text-muted-foreground">Тут можна переглянути всі товари</p>
      </div>
      <p className="w-fit text-sm font-medium text-primary">
        {formatProductCount(count)}
      </p>
    </header>
  );
}
