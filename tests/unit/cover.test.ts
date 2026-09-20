import { describe, expect, it } from "vitest";
import { COVER_COLORS, COVER_GENERATORS, getCoverSpec } from "@/lib/cover";
import { getCoverBackground } from "@/server/cover";

const SAMPLE_SLUGS = [
  "aurora-x2",
  "lumen-5",
  "keyra-75",
  "nova-1",
  "pulse-9",
  "orbit-3",
  "zen-0",
  "alpha",
  "beta",
  "gamma",
  "delta",
  "echo",
  "foxtrot",
  "golf",
  "hotel",
  "india",
] as const;

describe("getCoverSpec", () => {
  it("returns a deterministic spec for the same slug", () => {
    expect(getCoverSpec("aurora-x2")).toEqual(getCoverSpec("aurora-x2"));
  });

  it.each(SAMPLE_SLUGS)(
    "returns a palette color and allowed generator for %j",
    (slug) => {
      const spec = getCoverSpec(slug);

      expect(COVER_COLORS).toContain(spec.color);
      expect(COVER_GENERATORS).toContain(spec.generator);
    },
  );

  it("spreads different slugs across several colors and generators", () => {
    const colors = new Set(
      SAMPLE_SLUGS.map((slug) => getCoverSpec(slug).color),
    );
    const generators = new Set(
      SAMPLE_SLUGS.map((slug) => getCoverSpec(slug).generator),
    );

    expect(colors.size).toBeGreaterThanOrEqual(3);
    expect(generators.size).toBeGreaterThanOrEqual(3);
  });
});

describe("getCoverBackground", () => {
  it("returns a CSS-ready SVG data URL", () => {
    expect(getCoverBackground("aurora-x2")).toMatch(
      /^url\("data:image\/svg\+xml/,
    );
  });

  it("is identical for the same slug", () => {
    expect(getCoverBackground("aurora-x2")).toBe(
      getCoverBackground("aurora-x2"),
    );
  });

  it("differs for different slugs", () => {
    expect(getCoverBackground("aurora-x2")).not.toBe(
      getCoverBackground("lumen-5"),
    );
  });
});
