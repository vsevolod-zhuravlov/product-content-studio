"use client";

import { Search } from "lucide-react";
import { SerpPreview } from "@/components/products/editor/serp-preview";
import { TextAreaField } from "@/components/products/editor/text-area-field";
import { TextField } from "@/components/products/editor/text-field";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PRODUCT_LIMITS } from "@/lib/validation/product";

type SeoCardProps = {
  slug: string;
  disabled?: boolean;
};

export function SeoCard({ slug, disabled }: SeoCardProps) {
  return (
    <Card className="bg-card shadow-sm ring-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-semibold">
          <Search className="size-4 text-primary" aria-hidden="true" />
          SEO
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <SerpPreview slug={slug} />
        <TextField
          name="seoTitle"
          label="SEO-заголовок"
          limit={PRODUCT_LIMITS.seoTitle}
          disabled={disabled}
        />
        <TextAreaField
          name="seoDescription"
          label="SEO-опис"
          limit={PRODUCT_LIMITS.seoDescription}
          disabled={disabled}
          rows={4}
          className="min-h-28 bg-white [field-sizing:fixed]"
        />
      </CardContent>
    </Card>
  );
}
