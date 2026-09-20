"use client";

import { useFormContext } from "react-hook-form";
import { SITE_DISPLAY_URL } from "@/config/site";
import type { ProductEditInput } from "@/lib/validation/product";

type SerpPreviewProps = {
  slug: string;
};

export function SerpPreview({ slug }: SerpPreviewProps) {
  const { watch } = useFormContext<ProductEditInput>();
  const seoTitle = watch("seoTitle");
  const seoDescription = watch("seoDescription");
  const title = seoTitle.trim() || "SEO-заголовок";
  const description = seoDescription.trim() || "SEO-опис";
  const siteInitial = SITE_DISPLAY_URL.trim().charAt(0).toUpperCase() || "S";

  return (
    <div className="rounded-xl border bg-muted/30 p-4">
      <p className="text-xs font-medium text-muted-foreground">
        Попередній перегляд у Google
      </p>
      <div className="mt-3 rounded-xl bg-serp-surface px-4 py-3">
        <div className="font-serp max-w-xl">
          <div className="flex items-center gap-2.5">
            <span
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-serp-sitename"
              aria-hidden="true"
            >
              {siteInitial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] leading-tight text-serp-sitename">
                {SITE_DISPLAY_URL}
              </p>
              <p className="truncate text-xs leading-tight text-serp-url">
                {SITE_DISPLAY_URL}
                <span aria-hidden="true"> › </span>
                products
                <span aria-hidden="true"> › </span>
                {slug}
              </p>
            </div>
          </div>
          <p
            className="mt-1.5 line-clamp-2 text-xl leading-snug text-serp-title"
            title={title}
          >
            {title}
          </p>
          <p className="mt-1 line-clamp-2 text-sm leading-5 text-serp-snippet">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
