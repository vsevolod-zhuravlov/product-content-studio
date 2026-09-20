import { describe, expect, it } from "vitest";
import {
  getCharacterCountState,
  mapFieldErrorsToFormErrors,
} from "@/lib/product-editor";

describe("getCharacterCountState", () => {
  it("reports an empty value using a caller-provided limit", () => {
    expect(getCharacterCountState("", 12)).toEqual({
      count: 0,
      limit: 12,
      remaining: 12,
      isEmpty: true,
      isAtLimit: false,
      isOverLimit: false,
    });
  });

  it("reports a value within the limit", () => {
    expect(getCharacterCountState("текст", 10)).toMatchObject({
      count: 5,
      remaining: 5,
      isEmpty: false,
      isAtLimit: false,
      isOverLimit: false,
    });
  });

  it("reports a value exactly at the limit", () => {
    expect(getCharacterCountState("текст", 5)).toMatchObject({
      count: 5,
      remaining: 0,
      isAtLimit: true,
      isOverLimit: false,
    });
  });

  it("reports a value over the limit", () => {
    expect(getCharacterCountState("тексти", 5)).toMatchObject({
      count: 6,
      remaining: -1,
      isAtLimit: false,
      isOverLimit: true,
    });
  });

  it("measures trimmed Unicode code points", () => {
    expect(getCharacterCountState("  текст \n", 5).count).toBe(5);
    expect(getCharacterCountState("😀".repeat(60), 60)).toMatchObject({
      count: 60,
      isAtLimit: true,
      isOverLimit: false,
    });
    expect(getCharacterCountState("e\u0301", 1)).toMatchObject({
      count: 2,
      isOverLimit: true,
    });
  });
});

describe("mapFieldErrorsToFormErrors", () => {
  it("maps the first error for editable ProductEditInput fields", () => {
    expect(
      mapFieldErrorsToFormErrors({
        description: ["Обов'язкове поле", "Інша помилка"],
        seoTitle: ["Максимум 60 символів"],
        seoDescription: ["Максимум 160 символів"],
        status: ["Некоректний статус"],
      }),
    ).toEqual({
      description: "Обов'язкове поле",
      seoTitle: "Максимум 60 символів",
      seoDescription: "Максимум 160 символів",
      status: "Некоректний статус",
    });
  });

  it("ignores unknown fields and empty error lists", () => {
    expect(
      mapFieldErrorsToFormErrors({
        name: ["Read only"],
        _root: ["Malformed JSON"],
        description: [],
      }),
    ).toEqual({});
  });
});
