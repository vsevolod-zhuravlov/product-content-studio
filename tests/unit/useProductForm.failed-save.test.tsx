// @vitest-environment jsdom

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useProductForm } from "@/hooks/useProductForm";
import type { AdminProduct } from "@/lib/api-types";
import type { SaveProductResult } from "@/lib/api/client";

const { saveProductMock, toastSuccess, refresh } = vi.hoisted(() => ({
  saveProductMock: vi.fn(),
  toastSuccess: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("sonner", () => ({
  toast: { success: toastSuccess },
}));

vi.mock("@/lib/api/client", () => ({
  saveProduct: saveProductMock,
}));

vi.mock("@/components/common/unsaved-changes-provider", () => ({
  useUnsavedChanges: () => ({
    setIsDirty: vi.fn(),
    isDirty: false,
    requestLeave: vi.fn(),
  }),
}));

const product: AdminProduct = {
  id: "product-1",
  slug: "aurora-x2",
  name: "Aurora X2",
  specs: [{ label: "Вага", value: "250 г" }],
  description: "Початковий опис",
  seoTitle: "Початковий заголовок",
  seoDescription: "Початковий SEO опис",
  status: "DRAFT",
  updatedAt: "2026-09-20T12:00:00.000Z",
};

const editedTitle = "Змінений SEO заголовок";

function savedProduct(overrides: Partial<AdminProduct> = {}): AdminProduct {
  return {
    ...product,
    seoTitle: editedTitle,
    updatedAt: "2026-09-20T13:00:00.000Z",
    ...overrides,
  };
}

async function editSeoTitle(result: {
  current: ReturnType<typeof useProductForm>;
}) {
  await act(async () => {
    result.current.form.setValue("seoTitle", editedTitle, {
      shouldDirty: true,
      shouldTouch: true,
    });
  });

  await waitFor(() => {
    expect(result.current.form.getValues("seoTitle")).toBe(editedTitle);
    expect(result.current.isDirty).toBe(true);
  });
}

async function submit(result: { current: ReturnType<typeof useProductForm> }) {
  await act(async () => {
    await result.current.onSubmit({
      preventDefault() {},
      persist() {},
    } as unknown as React.FormEvent);
  });
}

describe("useProductForm failed save", () => {
  beforeEach(() => {
    saveProductMock.mockReset();
    toastSuccess.mockReset();
    refresh.mockReset();
  });

  it("keeps edits and shows a retryable banner after a server error", async () => {
    saveProductMock.mockResolvedValue({
      ok: false,
      kind: "server",
      message: "Server error",
    } satisfies SaveProductResult);

    const { result } = renderHook(() => useProductForm(product));
    await editSeoTitle(result);
    await submit(result);

    await waitFor(() => {
      expect(result.current.banner).toBe("retryable");
    });

    expect(result.current.form.getValues("seoTitle")).toBe(editedTitle);
    expect(result.current.form.getValues("description")).toBe(
      product.description,
    );
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(result.current.saveStatus.kind).not.toBe("saved");
    expect(result.current.saveStatus.kind).toBe("failed");
    expect(result.current.isDirty).toBe(true);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.canSave).toBe(true);
  });

  it("keeps edits after a network failure", async () => {
    saveProductMock.mockResolvedValue({
      ok: false,
      kind: "network",
      message: "Network error",
    } satisfies SaveProductResult);

    const { result } = renderHook(() => useProductForm(product));
    await editSeoTitle(result);
    await submit(result);

    await waitFor(() => {
      expect(result.current.banner).toBe("retryable");
    });

    expect(result.current.form.getValues("seoTitle")).toBe(editedTitle);
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(result.current.saveStatus.kind).not.toBe("saved");
    expect(result.current.isDirty).toBe(true);
    expect(result.current.canSave).toBe(true);
  });

  it("surfaces server field errors without dropping values", async () => {
    saveProductMock.mockResolvedValue({
      ok: false,
      kind: "validation",
      message: "Validation failed",
      fieldErrors: { seoTitle: ["Максимум 60 символів"] },
    } satisfies SaveProductResult);

    const { result } = renderHook(() => useProductForm(product));
    await editSeoTitle(result);
    await submit(result);

    await waitFor(() => {
      expect(result.current.banner).toBe("validation");
    });

    expect(result.current.form.getValues("seoTitle")).toBe(editedTitle);
    expect(result.current.form.formState.errors.seoTitle?.message).toBe(
      "Максимум 60 символів",
    );
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(result.current.saveStatus.kind).not.toBe("saved");
  });

  it("retries after failure and reports success once", async () => {
    saveProductMock
      .mockResolvedValueOnce({
        ok: false,
        kind: "server",
        message: "Server error",
      } satisfies SaveProductResult)
      .mockResolvedValueOnce({
        ok: true,
        data: savedProduct(),
      } satisfies SaveProductResult);

    const { result } = renderHook(() => useProductForm(product));
    await editSeoTitle(result);
    await submit(result);

    await waitFor(() => {
      expect(result.current.banner).toBe("retryable");
    });

    await submit(result);

    await waitFor(() => {
      expect(result.current.saveStatus.kind).toBe("saved");
    });

    expect(toastSuccess).toHaveBeenCalledTimes(1);
    expect(toastSuccess).toHaveBeenCalledWith("Зміни збережено");
    expect(result.current.form.getValues("seoTitle")).toBe(editedTitle);
    expect(result.current.isDirty).toBe(false);
    expect(result.current.banner).toBeNull();
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("treats a successful save as saved and not dirty", async () => {
    saveProductMock.mockResolvedValue({
      ok: true,
      data: savedProduct(),
    } satisfies SaveProductResult);

    const { result } = renderHook(() => useProductForm(product));
    await editSeoTitle(result);
    await submit(result);

    await waitFor(() => {
      expect(result.current.saveStatus.kind).toBe("saved");
    });

    expect(toastSuccess).toHaveBeenCalledTimes(1);
    expect(result.current.isDirty).toBe(false);
    expect(result.current.banner).toBeNull();
    expect(result.current.saveStatus.kind).not.toBe("failed");
  });
});
