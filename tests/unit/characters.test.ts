import { describe, expect, it } from "vitest";
import { countCharacters } from "@/lib/characters";
import { getCharacterCountState } from "@/lib/product-editor";
import { PRODUCT_LIMITS, productEditSchema } from "@/lib/validation/product";

const validInput = {
  description: "Опис товару",
  seoTitle: "SEO заголовок",
  seoDescription: "SEO опис",
  status: "DRAFT",
} as const;

const combining = "e\u0301";

function repeatToCodePoints(unit: string, count: number): string {
  const unitLength = countCharacters(unit);
  const fullUnits = Math.floor(count / unitLength);
  const remainder = count % unitLength;
  return `${unit.repeat(fullUnits)}${"x".repeat(remainder)}`;
}

const samples = [
  { name: "ASCII", char: "a" },
  { name: "Cyrillic yi", char: "ї" },
  { name: "emoji", char: "😀" },
  { name: "combining sequence", char: combining },
] as const;

describe("countCharacters", () => {
  it("counts ASCII, Cyrillic, emoji, and combining sequences as code points", () => {
    expect(countCharacters("Hello")).toBe(5);
    expect(countCharacters("ї")).toBe(1);
    expect(countCharacters("😀")).toBe(1);
    expect(countCharacters("😀".repeat(60))).toBe(60);
    expect(countCharacters(combining)).toBe(2);
    expect("😀".repeat(60).length).toBe(120);
  });
});

describe("schema and counter share code-point limits", () => {
  it.each(samples)(
    "agrees with the schema for $name at each field limit",
    ({ char }) => {
      for (const [field, limit] of Object.entries(PRODUCT_LIMITS)) {
        const atLimit = repeatToCodePoints(char, limit);
        const overLimit = repeatToCodePoints(char, limit + 1);

        expect(countCharacters(atLimit)).toBe(limit);
        expect(countCharacters(overLimit)).toBe(limit + 1);
        expect(getCharacterCountState(atLimit, limit)).toMatchObject({
          count: limit,
          isAtLimit: true,
          isOverLimit: false,
        });
        expect(getCharacterCountState(overLimit, limit)).toMatchObject({
          count: limit + 1,
          isOverLimit: true,
        });
        expect(
          productEditSchema.safeParse({ ...validInput, [field]: atLimit })
            .success,
        ).toBe(true);
        expect(
          productEditSchema.safeParse({ ...validInput, [field]: overLimit })
            .success,
        ).toBe(false);
      }
    },
  );

  it("agrees on a shared table of mixed inputs", () => {
    const table = [
      { value: "Hello", expected: 5 },
      { value: "їїї", expected: 3 },
      { value: "😀😀", expected: 2 },
      { value: combining, expected: 2 },
      { value: `  ${"😀".repeat(60)}  `, expected: 60 },
    ];

    for (const { value, expected } of table) {
      const trimmed = value.trim();
      const schemaResult = productEditSchema.safeParse({
        ...validInput,
        seoTitle: value,
      });
      const counter = getCharacterCountState(value, PRODUCT_LIMITS.seoTitle);

      expect(countCharacters(trimmed)).toBe(expected);
      expect(counter.count).toBe(expected);
      expect(schemaResult.success).toBe(expected <= PRODUCT_LIMITS.seoTitle);
    }
  });
});
