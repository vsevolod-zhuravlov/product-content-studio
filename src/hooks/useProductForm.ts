"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useUnsavedChanges } from "@/components/common/unsaved-changes-provider";
import type { FormBannerKind } from "@/components/products/editor/form-error-banner";
import type { SaveStatus } from "@/components/products/editor/save-status-indicator";
import { saveProduct } from "@/lib/api/client";
import type { AdminProduct } from "@/lib/api-types";
import {
  mapFieldErrorsToFormErrors,
  toProductEditValues,
} from "@/lib/product-editor";
import {
  productEditSchema,
  type ProductEditInput,
} from "@/lib/validation/product";

export const PRODUCT_EDITOR_FORM_ID = "product-editor-form";

const FIELD_ORDER: Array<keyof ProductEditInput> = [
  "description",
  "seoTitle",
  "seoDescription",
  "status",
];

function focusField(name: keyof ProductEditInput) {
  const element = document.getElementById(name);
  element?.focus();
  element?.scrollIntoView({ behavior: "smooth", block: "center" });
}

export function useProductForm(product: AdminProduct) {
  const router = useRouter();
  const { setIsDirty } = useUnsavedChanges();
  const [savedProduct, setSavedProduct] = useState(product);
  const [banner, setBanner] = useState<FormBannerKind | null>(null);
  const [outcome, setOutcome] = useState<"none" | "invalid" | "saved" | "failed">(
    "none",
  );
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const form = useForm<ProductEditInput>({
    resolver: zodResolver(productEditSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: toProductEditValues(product),
    shouldFocusError: false,
  });

  const { isDirty, isSubmitting, errors } = form.formState;
  const hasFieldErrors = FIELD_ORDER.some((field) => errors[field]);

  useEffect(() => {
    setIsDirty(isDirty);
    return () => setIsDirty(false);
  }, [isDirty, setIsDirty]);

  const saveStatus: SaveStatus = useMemo(() => {
    if (isSubmitting) return { kind: "saving" };
    if (outcome === "failed") return { kind: "failed" };
    if (outcome === "invalid" && hasFieldErrors) return { kind: "invalid" };
    if (isDirty) return { kind: "dirty" };
    if (outcome === "saved" && savedAt) return { kind: "saved", at: savedAt };
    return { kind: "clean" };
  }, [hasFieldErrors, isDirty, isSubmitting, outcome, savedAt]);

  const focusFirstInvalid = useCallback(
    (errors: Partial<Record<keyof ProductEditInput, unknown>>) => {
      const first = FIELD_ORDER.find((field) => errors[field]);
      if (first) focusField(first);
    },
    [],
  );

  const onSubmit = form.handleSubmit(
    async (values) => {
      setBanner(null);

      try {
        const result = await saveProduct(savedProduct.id, values);
        if (result.ok) {
          setSavedProduct(result.data);
          form.reset(toProductEditValues(result.data));
          setOutcome("saved");
          setSavedAt(new Date());
          toast.success("Зміни збережено");
          router.refresh();
          return;
        }

        setOutcome("failed");

        if (result.kind === "validation") {
          const mapped = mapFieldErrorsToFormErrors(result.fieldErrors ?? {});
          for (const field of FIELD_ORDER) {
            const message = mapped[field];
            if (message) {
              form.setError(field, { type: "server", message });
            }
          }
          setBanner("validation");
          focusFirstInvalid(mapped);
          return;
        }

        if (result.kind === "unauthorized") {
          setBanner("unauthorized");
          return;
        }

        if (result.kind === "not_found") {
          setBanner("not_found");
          return;
        }

        setBanner("retryable");
      } catch {
        setOutcome("failed");
        setBanner("retryable");
      }
    },
    (errors) => {
      setOutcome("invalid");
      focusFirstInvalid(errors);
    },
  );

  const resetToSaved = useCallback(() => {
    form.reset(toProductEditValues(savedProduct));
    setOutcome("none");
    setBanner(null);
  }, [form, savedProduct]);

  return {
    form,
    formId: PRODUCT_EDITOR_FORM_ID,
    savedProduct,
    saveStatus,
    banner,
    isDirty,
    isSubmitting,
    canSave: isDirty && !isSubmitting,
    onSubmit,
    onRetry: onSubmit,
    resetToSaved,
  };
}
