import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime, formatProductCount } from "@/lib/format";

describe("formatProductCount", () => {
  it.each([
    [1, "1 товар"],
    [2, "2 товари"],
    [5, "5 товарів"],
    [11, "11 товарів"],
    [21, "21 товар"],
    [22, "22 товари"],
    [25, "25 товарів"],
  ])("formats %i using Ukrainian plural rules", (count, expected) => {
    expect(formatProductCount(count)).toBe(expected);
  });
});

describe("formatDate", () => {
  it("formats a valid date in Ukrainian", () => {
    expect(formatDate(new Date(2026, 8, 20))).toBe("20.09.2026");
  });

  it.each([null, undefined, "", "not-a-date"])(
    "returns a fallback for %s",
    (value) => {
      expect(formatDate(value)).toBe("—");
    },
  );
});

describe("formatDateTime", () => {
  it("formats a valid date with time in Ukrainian", () => {
    const value = new Date(2026, 8, 20, 14, 5);
    const formatted = formatDateTime(value);

    expect(formatted).toContain("20.09.2026");
    expect(formatted).toMatch(/14:05/);
  });

  it.each([null, undefined, "", "not-a-date"])(
    "returns a fallback for %s",
    (value) => {
      expect(formatDateTime(value)).toBe("—");
    },
  );
});
