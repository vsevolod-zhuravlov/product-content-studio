import { describe, expect, it } from "vitest";
import { isValidPublicProductSlug } from "@/lib/validation/public-slug";

describe("isValidPublicProductSlug", () => {
  it.each(["aurora-x2", "lumen-5", "a", "z".repeat(100)])(
    "accepts a published-style slug %j",
    (slug) => {
      expect(isValidPublicProductSlug(slug)).toBe(true);
    },
  );

  it.each([
    "' OR 1=1 --",
    "../etc/passwd",
    "..%2fetc",
    "%00",
    "a".repeat(101),
    "UPPERCASE",
    "contains space",
    "",
    "slug_with_underscore",
  ])("treats invalid slug %j as the not-found path", (slug) => {
    expect(isValidPublicProductSlug(slug)).toBe(false);
  });
});
