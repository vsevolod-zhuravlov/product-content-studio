"use client";

import { Controller, useFormContext } from "react-hook-form";
import { CircleDot } from "lucide-react";
import type { ProductStatus } from "@/lib/api-types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProductEditInput } from "@/lib/validation/product";

type StatusCardProps = {
  slug: string;
  savedStatus: ProductStatus;
  disabled?: boolean;
};

export function StatusCard({ slug, savedStatus, disabled }: StatusCardProps) {
  const {
    control,
    watch,
    formState: { errors },
  } = useFormContext<ProductEditInput>();
  const selectedStatus = watch("status");
  const error = errors.status?.message;
  const errorId = "status-error";
  const helpId = "status-help";

  return (
    <Card className="bg-card shadow-sm ring-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-semibold">
          <CircleDot className="size-4 text-primary" aria-hidden="true" />
          Статус
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="status">Статус публікації</Label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => {
                  if (value) field.onChange(value);
                }}
                disabled={disabled}
              >
                <SelectTrigger
                  id="status"
                  className="h-10 w-full bg-white"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? `${helpId} ${errorId}` : helpId}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Чернетка</SelectItem>
                  <SelectItem value="PUBLISHED">Опубліковано</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <p id={helpId} className="text-sm text-muted-foreground">
          Зміна статусу набуде чинності після збереження.{" "}
          {selectedStatus === "PUBLISHED"
            ? "Опублікований товар буде видимий у публічному каталозі."
            : "Чернетка прихована з публічного каталогу."}
        </p>
        {error ? (
          <p id={errorId} className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {savedStatus === "PUBLISHED" ? (
          <a
            href={`/products/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Переглянути на сайті
          </a>
        ) : null}
      </CardContent>
    </Card>
  );
}
