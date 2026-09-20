import { describe, expect, it } from "vitest";
import { parseEnv } from "@/lib/env";

const validSource = {
  DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/app",
  JWT_SECRET: "a-secure-secret-that-is-at-least-32-characters",
  NODE_ENV: "test",
};

describe("parseEnv", () => {
  it("parses a valid environment", () => {
    expect(parseEnv(validSource)).toEqual(validSource);
  });

  it("defaults NODE_ENV to development", () => {
    const withoutNodeEnv = {
      DATABASE_URL: validSource.DATABASE_URL,
      JWT_SECRET: validSource.JWT_SECRET,
    };

    expect(parseEnv(withoutNodeEnv).NODE_ENV).toBe("development");
  });

  it("reports a missing DATABASE_URL by name", () => {
    const source = {
      JWT_SECRET: validSource.JWT_SECRET,
      NODE_ENV: validSource.NODE_ENV,
    };

    expect(() => parseEnv(source)).toThrow(/DATABASE_URL/);
  });

  it("reports a missing JWT_SECRET by name", () => {
    const source = {
      DATABASE_URL: validSource.DATABASE_URL,
      NODE_ENV: validSource.NODE_ENV,
    };

    expect(() => parseEnv(source)).toThrow(/JWT_SECRET/);
  });

  it("rejects a JWT_SECRET shorter than 32 characters without leaking it", () => {
    const secretValue = "recognizable-short-secret";

    expect(() =>
      parseEnv({ ...validSource, JWT_SECRET: secretValue }),
    ).toThrowError(
      expect.objectContaining({
        message: expect.not.stringContaining(secretValue),
      }),
    );
  });
});
