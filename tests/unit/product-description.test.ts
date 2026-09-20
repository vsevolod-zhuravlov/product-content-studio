import { describe, expect, it } from "vitest";
import {
  DESCRIPTION_EXCERPT_LENGTH,
  shortenDescription,
  splitDescriptionParagraphs,
} from "@/lib/product-description";

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

describe("shortenDescription", () => {
  it("returns an empty string for empty input", () => {
    expect(shortenDescription("")).toBe("");
    expect(shortenDescription("   \n\n  ")).toBe("");
  });

  it("uses only the first paragraph", () => {
    expect(
      shortenDescription("Перший абзац з деталями товару.\n\nДругий абзац."),
    ).toBe("Перший абзац з деталями товару.");
  });

  it("collapses inner whitespace", () => {
    expect(shortenDescription("рядок   один\nрядок два")).toBe(
      "рядок один рядок два",
    );
  });

  it("truncates a long paragraph at a word boundary", () => {
    expect(
      shortenDescription("один два три чотири п'ять шість сім вісім", 19),
    ).toBe("один два три…");
  });

  it("keeps text that fits the limit", () => {
    const text = "Короткий опис товару.";

    expect(shortenDescription(text, DESCRIPTION_EXCERPT_LENGTH)).toBe(text);
  });
});

