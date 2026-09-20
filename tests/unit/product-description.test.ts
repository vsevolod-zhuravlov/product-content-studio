import { describe, expect, it } from "vitest";
import { splitDescriptionParagraphs } from "@/lib/product-description";

describe("splitDescriptionParagraphs", () => {
  it("splits paragraphs on blank lines", () => {
    expect(splitDescriptionParagraphs("Перший абзац\n\nДругий абзац")).toEqual([
      "Перший абзац",
      "Другий абзац",
    ]);
  });

  it("keeps single line breaks inside a paragraph", () => {
    expect(splitDescriptionParagraphs("рядок один\nрядок два")).toEqual([
      "рядок один\nрядок два",
    ]);
  });

  it("trims leading and trailing whitespace", () => {
    expect(splitDescriptionParagraphs("  перший  \n\n  другий  \n")).toEqual([
      "перший",
      "другий",
    ]);
  });

  it("keeps script tags as a plain string", () => {
    expect(splitDescriptionParagraphs("<script>alert(1)</script>")).toEqual([
      "<script>alert(1)</script>",
    ]);
  });

  it("returns no paragraphs for empty input", () => {
    expect(splitDescriptionParagraphs("")).toEqual([]);
    expect(splitDescriptionParagraphs("   \n\n  ")).toEqual([]);
  });
});
