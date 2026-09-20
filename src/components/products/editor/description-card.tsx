"use client";

import { AlignLeft } from "lucide-react";
import { TextAreaField } from "@/components/products/editor/text-area-field";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PRODUCT_LIMITS } from "@/lib/validation/product";

type DescriptionCardProps = {
  disabled?: boolean;
};

export function DescriptionCard({ disabled }: DescriptionCardProps) {
  return (
    <Card className="bg-card shadow-sm ring-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-semibold">
          <AlignLeft className="size-4 text-primary" aria-hidden="true" />
          Опис
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TextAreaField
          name="description"
          label="Опис"
          limit={PRODUCT_LIMITS.description}
          disabled={disabled}
          rows={10}
          className="min-h-48 bg-white [field-sizing:fixed]"
        />
      </CardContent>
    </Card>
  );
}
