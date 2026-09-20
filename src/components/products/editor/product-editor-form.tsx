"use client";

import { useState } from "react";
import { FormProvider } from "react-hook-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DescriptionCard } from "@/components/products/editor/description-card";
import { EditorHeader } from "@/components/products/editor/editor-header";
import { FormErrorBanner } from "@/components/products/editor/form-error-banner";
import { MobileSaveBar } from "@/components/products/editor/mobile-save-bar";
import { ReadOnlyInfoCard } from "@/components/products/editor/read-only-info-card";
import { SeoCard } from "@/components/products/editor/seo-card";
import { StatusCard } from "@/components/products/editor/status-card";
import { useProductForm } from "@/hooks/useProductForm";
import type { AdminProduct } from "@/lib/api-types";

type ProductEditorFormProps = {
  product: AdminProduct;
};

export function ProductEditorForm({ product }: ProductEditorFormProps) {
  const {
    form,
    formId,
    savedProduct,
    saveStatus,
    banner,
    isDirty,
    isSubmitting,
    canSave,
    onSubmit,
    onRetry,
    resetToSaved,
  } = useProductForm(product);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  function handleCancel() {
    if (isDirty) {
      setIsCancelOpen(true);
      return;
    }
    resetToSaved();
  }

  return (
    <FormProvider {...form}>
      <div className="pb-28 lg:pb-0">
        <EditorHeader
          name={savedProduct.name}
          savedStatus={savedProduct.status}
          saveStatus={saveStatus}
          formId={formId}
          canSave={canSave}
          isSubmitting={isSubmitting}
          onCancel={handleCancel}
        />

        <form
          id={formId}
          onSubmit={onSubmit}
          noValidate
          className="mt-6 space-y-4"
          aria-busy={isSubmitting}
        >
          <fieldset disabled={isSubmitting} className="min-w-0 space-y-4">
            {banner ? (
              <FormErrorBanner
                kind={banner}
                productId={savedProduct.id}
                onRetry={onRetry}
              />
            ) : null}

            <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)] lg:items-start">
              <div className="order-2 space-y-4 lg:order-1">
                <div className="hidden lg:block">
                  <ReadOnlyInfoCard product={savedProduct} />
                </div>
                <DescriptionCard disabled={isSubmitting} />
                <SeoCard slug={savedProduct.slug} disabled={isSubmitting} />
                <div className="lg:hidden">
                  <ReadOnlyInfoCard product={savedProduct} />
                </div>
              </div>
              <div className="order-1 lg:order-2 lg:sticky lg:top-36">
                <StatusCard
                  slug={savedProduct.slug}
                  savedStatus={savedProduct.status}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </fieldset>
        </form>
      </div>

      <MobileSaveBar
        formId={formId}
        canSave={canSave}
        isSubmitting={isSubmitting}
        onCancel={handleCancel}
      />

      <AlertDialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Скасувати зміни?</AlertDialogTitle>
            <AlertDialogDescription>
              Є незбережені зміни. Відновити останні збережені значення?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Продовжити редагування</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                resetToSaved();
                setIsCancelOpen(false);
              }}
            >
              Скасувати зміни
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FormProvider>
  );
}
