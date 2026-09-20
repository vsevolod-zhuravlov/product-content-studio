"use client";

import { useFormContext } from "react-hook-form";
import { CharacterCounter } from "@/components/products/editor/character-counter";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getCharacterCountState } from "@/lib/product-editor";
import type { ProductEditInput } from "@/lib/validation/product";

type TextAreaFieldName = "description" | "seoDescription";

type TextAreaFieldProps = {
  name: TextAreaFieldName;
  label: string;
  limit: number;
  disabled?: boolean;
  rows?: number;
  className?: string;
};

export function TextAreaField({
  name,
  label,
  limit,
  disabled,
  rows = 6,
  className,
}: TextAreaFieldProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<ProductEditInput>();
  const value = watch(name) ?? "";
  const counterId = `${name}-counter`;
  const errorId = `${name}-error`;
  const isOverLimit = getCharacterCountState(value, limit).isOverLimit;
  const error =
    errors[name]?.message ??
    (isOverLimit ? `Максимум ${limit} символів` : undefined);

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Textarea
        id={name}
        rows={rows}
        className={className}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${counterId} ${errorId}` : counterId}
        {...register(name)}
      />
      <CharacterCounter id={counterId} value={value} limit={limit} />
      <p
        id={errorId}
        role={error ? "alert" : undefined}
        className="min-h-5 text-sm text-destructive"
      >
        {error}
      </p>
    </div>
  );
}
