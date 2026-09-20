import Link from "next/link";
import type { PublicProduct } from "@/lib/api-types";
import { ProductCover } from "@/components/public/common/product-cover";
import { shortenDescription } from "@/lib/product-description";

const CATALOG_SPEC_LIMIT = 4;

type CatalogProductCardProps = {
  product: PublicProduct;
  index?: number;
};

export function CatalogProductCard({
  product,
  index = 0,
}: CatalogProductCardProps) {
  const excerpt = shortenDescription(product.description);
  const specs = product.specs.slice(0, CATALOG_SPEC_LIMIT);

  return (
    <article
      className="group relative flex h-full min-w-0 flex-row overflow-hidden rounded-2xl border bg-card shadow-public outline-none motion-safe:animate-public-enter motion-safe:transition-[transform,box-shadow] motion-safe:hover:shadow-public-hover focus-within:ring-3 focus-within:ring-ring/50"
      style={{ animationDelay: `${Math.min(index, 6) * 40}ms` }}
    >
      <div className="hidden aspect-[3/4] w-32 shrink-0 self-start overflow-hidden min-[565px]:block sm:aspect-auto sm:w-48 sm:self-stretch">
        <div className="h-full motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-safe:group-hover:scale-[1.04]">
          <ProductCover slug={product.slug} size="split" />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-6">
        <div className="flex min-w-0 flex-1 flex-col">
          <h2 className="line-clamp-2 text-base font-semibold tracking-tight break-words sm:text-xl">
            <Link
              href={`/products/${product.slug}`}
              className="outline-none after:absolute after:inset-0 after:z-10 after:rounded-2xl after:content-['']"
            >
              {product.name}
            </Link>
          </h2>
          {excerpt ? (
            <p className="mt-1.5 line-clamp-2 text-sm break-words text-muted-foreground sm:mt-2">
              {excerpt}
            </p>
          ) : null}
          {specs.length > 0 ? (
            <dl className="mt-auto flex flex-wrap gap-x-3 gap-y-1 pt-3 text-xs sm:mt-4 sm:grid sm:grid-cols-[minmax(0,auto)_minmax(0,1fr)] sm:gap-x-3 sm:gap-y-1.5 sm:pt-0 sm:text-sm">
              {specs.map((spec, specIndex) => (
                <div
                  key={`${specIndex}-${spec.label}`}
                  className="flex max-w-full items-baseline gap-1 sm:contents"
                >
                  <dt className="shrink-0 text-muted-foreground">
                    {spec.label}:
                  </dt>
                  <dd className="min-w-0 font-medium break-words">
                    {spec.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </div>
    </article>
  );
}
