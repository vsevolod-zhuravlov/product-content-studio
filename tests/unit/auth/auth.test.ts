import { SignJWT } from "jose";
import { NextRequest } from "next/server";
import { beforeAll, describe, expect, it } from "vitest";
import { decodeJwtSignature, tamperJwt } from "../../helpers/tamper-jwt";
import {
  AUTH_COOKIE_NAME,
  SESSION_AUDIENCE,
  SESSION_ISSUER,
  SESSION_TTL_SECONDS,
} from "@/lib/auth/constants";
import {
  getClearingCookieOptions,
  getSessionCookieOptions,
} from "@/lib/auth/cookie";
import { isJsonRequest, isSameOrigin } from "@/lib/auth/csrf";
import { signSession, verifySessionToken } from "@/lib/auth/jwt";
import {
  DUMMY_PASSWORD_HASH,
  hashPassword,
  verifyPassword,
} from "@/lib/auth/password";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { loginSchema } from "@/lib/validation/auth";

const secret = "unit-test-jwt-secret-that-is-at-least-32-characters";

beforeAll(() => {
  process.env.DATABASE_URL =
    "postgresql://postgres:postgres@localhost:5432/unit_test";
  process.env.JWT_SECRET = secret;
});

async function customToken(
  payload: Record<string, unknown>,
  options: {
    secret?: string;
    issuer?: string;
    audience?: string;
    expiresAt?: string;
  } = {},
) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(options.issuer ?? SESSION_ISSUER)
    .setAudience(options.audience ?? SESSION_AUDIENCE)
    .setExpirationTime(options.expiresAt ?? "1h")
    .sign(new TextEncoder().encode(options.secret ?? secret));
}

describe("password helpers", () => {
  it("hashes passwords and verifies correct and incorrect values", async () => {
    const hash = await hashPassword("correct horse battery staple");

    expect(hash).not.toBe("correct horse battery staple");
    await expect(
      verifyPassword("correct horse battery staple", hash),
    ).resolves.toBe(true);
    await expect(verifyPassword("wrong", hash)).resolves.toBe(false);
  });

  it("exports a valid precomputed dummy bcrypt hash", async () => {
    await expect(
      verifyPassword("irrelevant", DUMMY_PASSWORD_HASH),
    ).resolves.toBe(false);
    expect(DUMMY_PASSWORD_HASH).toMatch(/^\$2[aby]\$\d{2}\$/);
  });
});

describe("JWT sessions", () => {
  it("round-trips a signed session", async () => {
    const token = await signSession({
      sub: "user-1",
      email: "ADMIN@EXAMPLE.COM",
    });

    await expect(verifySessionToken(token)).resolves.toMatchObject({
      sub: "user-1",
      email: "ADMIN@EXAMPLE.COM",
      iss: SESSION_ISSUER,
      aud: SESSION_AUDIENCE,
    });
  });

  it.each([
    [
      "expired",
      () =>
        customToken({ sub: "user-1", email: "a@b.com" }, { expiresAt: "0s" }),
    ],
    [
      "wrong secret",
      () =>
        customToken(
          { sub: "user-1", email: "a@b.com" },
          { secret: "another-secret-that-is-long-enough-for-testing" },
        ),
    ],
    [
      "wrong issuer",
      () =>
        customToken({ sub: "user-1", email: "a@b.com" }, { issuer: "other" }),
    ],
    [
      "wrong audience",
      () =>
        customToken({ sub: "user-1", email: "a@b.com" }, { audience: "other" }),
    ],
    ["missing subject", () => customToken({ email: "a@b.com" })],
  ])("rejects a token that is %s", async (_name, createToken) => {
    await expect(verifySessionToken(await createToken())).resolves.toBeNull();
  });

  it("rejects tampered payloads and signatures", async () => {
    const token = await signSession({ sub: "user-1", email: "a@b.com" });
    const [header, payload, signature] = token.split(".");
    const originalPayload = payload ?? "";
    const payloadIndex = Math.floor(originalPayload.length / 2);
    const replacement = originalPayload[payloadIndex] === "A" ? "B" : "A";
    const tamperedPayload = `${header}.${originalPayload.slice(0, payloadIndex)}${replacement}${originalPayload.slice(payloadIndex + 1)}.${signature}`;

    await expect(verifySessionToken(tamperedPayload)).resolves.toBeNull();
    await expect(verifySessionToken(tamperJwt(token))).resolves.toBeNull();
  });

  it("changes decoded signature bytes for 500 freshly signed tokens", async () => {
    for (let index = 0; index < 500; index += 1) {
      const token = await signSession({
        sub: `user-${index}`,
        email: `user-${index}@example.com`,
      });
      const tampered = tamperJwt(token);

      expect(tampered).not.toBe(token);
      expect(
        decodeJwtSignature(tampered).equals(decodeJwtSignature(token)),
      ).toBe(false);
      await expect(verifySessionToken(tampered)).resolves.toBeNull();
    }
  });

  it("rejects alg none", async () => {
    const header = Buffer.from(JSON.stringify({ alg: "none" })).toString(
      "base64url",
    );
    const payload = Buffer.from(
      JSON.stringify({
        sub: "user-1",
        email: "a@b.com",
        iss: SESSION_ISSUER,
        aud: SESSION_AUDIENCE,
        exp: Math.floor(Date.now() / 1000) + 3600,
      }),
    ).toString("base64url");

    await expect(
      verifySessionToken(`${header}.${payload}.`),
    ).resolves.toBeNull();
  });

  it("rejects signed tokens that do not use HS256", async () => {
    const token = await new SignJWT({ email: "a@b.com" })
      .setProtectedHeader({ alg: "HS384" })
      .setSubject("user-1")
      .setIssuer(SESSION_ISSUER)
      .setAudience(SESSION_AUDIENCE)
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(secret));

    await expect(verifySessionToken(token)).resolves.toBeNull();
  });
});

describe("session cookies", () => {
  it("uses the required attributes and TTL", () => {
    expect(AUTH_COOKIE_NAME).toBe("pcs_session");
    expect(getSessionCookieOptions(true)).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: true,
      maxAge: SESSION_TTL_SECONDS,
    });
    expect(getSessionCookieOptions(false).secure).toBe(false);
  });

  it("clears with matching attributes and max-age zero", () => {
    expect(getClearingCookieOptions(false)).toEqual({
      ...getSessionCookieOptions(false),
      maxAge: 0,
    });
  });
});

describe("request checks", () => {
  it("allows absent and matching origins and rejects another origin", () => {
    expect(
      isSameOrigin(new NextRequest("https://studio.test/api/auth/login")),
    ).toBe(true);
    expect(
      isSameOrigin(
        new NextRequest("https://studio.test/api/auth/login", {
          headers: { origin: "https://studio.test" },
        }),
      ),
    ).toBe(true);
    expect(
      isSameOrigin(
        new NextRequest("https://studio.test/api/auth/login", {
          headers: { origin: "https://evil.example" },
        }),
      ),
    ).toBe(false);
  });

  it("recognizes JSON content types", () => {
    expect(
      isJsonRequest(
        new NextRequest("https://studio.test", {
          headers: { "content-type": "application/json; charset=utf-8" },
        }),
      ),
    ).toBe(true);
    expect(isJsonRequest(new NextRequest("https://studio.test"))).toBe(false);
    expect(
      isJsonRequest(
        new NextRequest("https://studio.test", {
          headers: { "content-type": "text/plain" },
        }),
      ),
    ).toBe(false);
  });
});

describe("safeRedirectPath", () => {
  it.each(["/admin/products", "/admin/products/abc?x=1"])("allows %s", (path) =>
    expect(safeRedirectPath(path)).toBe(path),
  );

  it.each([
    null,
    "",
    "//evil.com",
    "https://evil.com",
    "/\\evil.com",
    "/api/x",
    "/admin/../x",
  ])("rejects %s", (path) => {
    expect(safeRedirectPath(path)).toBe("/admin/products");
  });
});

describe("loginSchema", () => {
  it("trims and lowercases email", () => {
    expect(
      loginSchema.parse({ email: "  ADMIN@Example.COM ", password: "secret" }),
    ).toEqual({ email: "admin@example.com", password: "secret" });
  });

  it.each([
    [{ email: "bad", password: "secret" }, "Введіть коректну пошту"],
    [{ email: "a@example.com", password: "" }, "Обов'язкове поле"],
    [{ email: "a@example.com", password: "x".repeat(129) }, undefined],
    [{ email: "a@example.com", password: "secret", role: "admin" }, undefined],
  ])("rejects invalid login input", (input, message) => {
    const result = loginSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success && message) {
      expect(result.error.issues.map((issue) => issue.message)).toContain(
        message,
      );
    }
  });
});
