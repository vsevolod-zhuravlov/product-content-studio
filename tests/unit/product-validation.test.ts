import { describe, expect, it } from "vitest";
import { ProductStatus } from "@/generated/prisma/enums";
import {
  PRODUCT_LIMITS,
  productEditSchema,
  specsSchema,
} from "@/lib/validation/product";

const validInput = {
  description: "Опис товару",
  seoTitle: "SEO заголовок",
  seoDescription: "SEO опис",
  status: "DRAFT",
} as const;

describe("productEditSchema", () => {
  it("exposes the specified UI limits", () => {
    expect(PRODUCT_LIMITS).toEqual({
      description: 1000,
      seoTitle: 60,
      seoDescription: 160,
    });
  });

  it("accepts valid input", () => {
    expect(productEditSchema.parse(validInput)).toEqual(validInput);
  });

  it.each([
    ["description", 1000],
    ["seoTitle", 60],
    ["seoDescription", 160],
  ] as const)("accepts %s at its maximum length", (field, limit) => {
    expect(
      productEditSchema.safeParse({
        ...validInput,
        [field]: "а".repeat(limit),
      }).success,
    ).toBe(true);
  });

  it.each([
    ["description", 1000],
    ["seoTitle", 60],
    ["seoDescription", 160],
  ] as const)("rejects %s above its maximum length", (field, limit) => {
    const result = productEditSchema.safeParse({
      ...validInput,
      [field]: "а".repeat(limit + 1),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        `Максимум ${limit} символів`,
      );
    }
  });

  it.each(["description", "seoTitle", "seoDescription"] as const)(
    "rejects an empty %s",
    (field) => {
      const result = productEditSchema.safeParse({
        ...validInput,
        [field]: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Обов'язкове поле");
      }
    },
  );

  it.each(["description", "seoTitle", "seoDescription"] as const)(
    "rejects a whitespace-only %s",
    (field) => {
      expect(
        productEditSchema.safeParse({
          ...validInput,
          [field]: " \t\n ",
        }).success,
      ).toBe(false);
    },
  );

  it("trims all editable text values before measuring and returning them", () => {
    expect(
      productEditSchema.parse({
        description: "  Опис  ",
        seoTitle: "\tЗаголовок\n",
        seoDescription: " Опис для пошуку ",
        status: "PUBLISHED",
      }),
    ).toEqual({
      description: "Опис",
      seoTitle: "Заголовок",
      seoDescription: "Опис для пошуку",
      status: "PUBLISHED",
    });
  });

  it.each(["name", "specs", "slug", "id"] as const)(
    "rejects the unknown key %s",
    (key) => {
      expect(
        productEditSchema.safeParse({
          ...validInput,
          [key]: "not editable",
        }).success,
      ).toBe(false);
    },
  );

  it("rejects an invalid status", () => {
    expect(
      productEditSchema.safeParse({ ...validInput, status: "ARCHIVED" })
        .success,
    ).toBe(false);
  });

  it.each(["description", "seoTitle", "seoDescription"] as const)(
    "rejects a non-string %s",
    (field) => {
      expect(
        productEditSchema.safeParse({
          ...validInput,
          [field]: 42,
        }).success,
      ).toBe(false);
    },
  );

  it("counts Cyrillic text using String.length", () => {
    const atLimit = "ї".repeat(60);

    expect(
      productEditSchema.safeParse({ ...validInput, seoTitle: atLimit }).success,
    ).toBe(true);
    expect(
      productEditSchema.safeParse({
        ...validInput,
        seoTitle: `${atLimit}ї`,
      }).success,
    ).toBe(false);
  });

  it("accepts HTML-like text unchanged", () => {
    const description = "<script>alert(1)</script>";

    expect(
      productEditSchema.parse({ ...validInput, description }).description,
    ).toBe(description);
  });

  it("keeps status values in sync with the generated Prisma enum", () => {
    const zodStatuses = productEditSchema.shape.status.options;

    expect([...zodStatuses].sort()).toEqual(
      Object.values(ProductStatus).sort(),
    );
  });
});

describe("specsSchema", () => {
  it("accepts valid specs", () => {
    const specs = [
      { label: "Вага", value: "250 г" },
      { label: "Колір", value: "Чорний" },
    ];

    expect(specsSchema.parse(specs)).toEqual(specs);
  });

  it.each([
    [{ label: "Вага" }],
    [{ value: "250 г" }],
    [{ label: 1, value: "250 г" }],
    "not an array",
  ])("rejects malformed specs %#", (specs) => {
    expect(specsSchema.safeParse(specs).success).toBe(false);
  });
});
