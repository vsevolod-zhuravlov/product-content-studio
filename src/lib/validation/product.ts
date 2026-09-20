import { z } from "zod";
import { countCharacters } from "@/lib/characters";

export const PRODUCT_LIMITS = {
  description: 1000,
  seoTitle: 60,
  seoDescription: 160,
} as const;

function editableText(maximum: number) {
  return z
    .string()
    .trim()
    .min(1, { error: "Обов'язкове поле" })
    .refine((value) => countCharacters(value) <= maximum, {
      error: `Максимум ${maximum} символів`,
    });
}

export const productEditSchema = z.strictObject({
  description: editableText(PRODUCT_LIMITS.description),
  seoTitle: editableText(PRODUCT_LIMITS.seoTitle),
  seoDescription: editableText(PRODUCT_LIMITS.seoDescription),
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

export const specsSchema = z.array(
  z.strictObject({
    label: z.string(),
    value: z.string(),
  }),
);

export type ProductEditInput = z.infer<typeof productEditSchema>;
export type ProductSpec = z.infer<typeof specsSchema>[number];
