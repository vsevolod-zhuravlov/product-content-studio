import type { AdminProduct } from "@/lib/api-types";
import type { ProductEditInput } from "@/lib/validation/product";

export function toProductEditValues(product: AdminProduct): ProductEditInput {
  return {
    description: product.description,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    status: product.status,
  };
}

export type CharacterCountState = {
  count: number;
  limit: number;
  remaining: number;
  isEmpty: boolean;
  isAtLimit: boolean;
  isOverLimit: boolean;
};

export function getCharacterCountState(
  value: string,
  limit: number,
): CharacterCountState {
  const count = value.trim().length;

  return {
    count,
    limit,
    remaining: limit - count,
    isEmpty: count === 0,
    isAtLimit: count === limit,
    isOverLimit: count > limit,
  };
}

export type ProductFormErrors = Partial<Record<keyof ProductEditInput, string>>;

const EDITABLE_PRODUCT_FIELDS = [
  "description",
  "seoTitle",
  "seoDescription",
  "status",
] as const satisfies readonly (keyof ProductEditInput)[];

export function mapFieldErrorsToFormErrors(
  fieldErrors: Record<string, readonly string[] | undefined>,
): ProductFormErrors {
  const formErrors: ProductFormErrors = {};

  for (const field of EDITABLE_PRODUCT_FIELDS) {
    const message = fieldErrors[field]?.[0];
    if (message !== undefined) {
      formErrors[field] = message;
    }
  }

  return formErrors;
}
