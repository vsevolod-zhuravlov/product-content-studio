"use client";

import { useFormContext } from "react-hook-form";
import { CharacterCounter } from "@/components/products/editor/character-counter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCharacterCountState } from "@/lib/product-editor";
import type { ProductEditInput } from "@/lib/validation/product";

type TextFieldName = "seoTitle";

type TextFieldProps = {
  name: TextFieldName;
  label: string;
  limit: number;
  disabled?: boolean;
};

export function TextField({ name, label, limit, disabled }: TextFieldProps) {
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
      <Input
        id={name}
        className="h-10 bg-white"
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? `${counterId} ${errorId}` : counterId
        }
        {...register(name)}
      />
      <CharacterCounter id={counterId} value={value} limit={limit} />
      <p id={errorId} role={error ? "alert" : undefined} className="min-h-5 text-sm text-destructive">
        {error}
      </p>
    </div>
  );
}
