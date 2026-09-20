import { SignJWT } from "jose";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET as getMe } from "@/app/api/admin/me/route";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import {
  AUTH_COOKIE_NAME,
  SESSION_AUDIENCE,
  SESSION_ISSUER,
} from "@/lib/auth/constants";
import { signSession, verifySessionToken } from "@/lib/auth/jwt";
import { db } from "@/lib/db";
import { handleProxyRequest } from "@/proxy";
import { buildUser } from "../../factories/user";
import { resetDb } from "../../helpers/database";

const bcryptCompare = vi.hoisted(() => vi.fn());

vi.mock("bcryptjs", async (importOriginal) => {
  const original = await importOriginal<typeof import("bcryptjs")>();
  return {
    ...original,
    compare: (password: string, passwordHash: string) => {
      bcryptCompare(password, passwordHash);
      return original.compare(password, passwordHash);
    },
  };
});

const baseUrl = "http://localhost:3000";
function jsonRequest(
  path: string,
  body: unknown,
  headers: Record<string, string> = {},
) {
  return new NextRequest(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

function cookieValue(response: Response): string {
  const setCookie = response.headers.get("set-cookie") ?? "";
  const match = setCookie.match(new RegExp(`${AUTH_COOKIE_NAME}=([^;]+)`));
  if (!match?.[1]) throw new Error("Session cookie was not set.");
  return match[1];
}

function withCookie(path: string, token: string, method = "GET") {
  return new NextRequest(`${baseUrl}${path}`, {
    method,
    headers: { cookie: `${AUTH_COOKIE_NAME}=${token}` },
  });
}

async function insecureToken(
  payload: Record<string, unknown>,
  options: { secret?: string; expiresAt?: string } = {},
) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setExpirationTime(options.expiresAt ?? "1h")
    .sign(
      new TextEncoder().encode(
        options.secret ??
          process.env.JWT_SECRET ??
          "integration-secret-must-be-at-least-32-characters",
      ),
    );
}

beforeEach(async () => {
  bcryptCompare.mockClear();
  await resetDb();
});

describe("POST /api/auth/login", () => {
  it("logs in, returns only the user email, and sets a verifiable cookie", async () => {
    const fixture = await buildUser();
    const user = await db.user.create({ data: fixture.data });

    const response = await login(
      jsonRequest("/api/auth/login", {
        email: fixture.data.email,
        password: fixture.password,
      }),
    );
    const body = await response.json();
    const setCookie = response.headers.get("set-cookie") ?? "";
    const token = cookieValue(response);

    expect(response.status).toBe(200);
    expect(body).toEqual({ user: { email: fixture.data.email } });
    expect(JSON.stringify(body)).not.toContain("passwordHash");
    expect(JSON.stringify(body)).not.toContain(token);
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toMatch(/SameSite=Lax/i);
    expect(setCookie).toContain("Path=/");
    expect(setCookie).toMatch(/Max-Age=\d+/);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(verifySessionToken(token)).resolves.toMatchObject({
      sub: user.id,
      email: fixture.data.email,
    });
  });

  it("treats email case-insensitively", async () => {
    const fixture = await buildUser();
    await db.user.create({ data: fixture.data });

    const response = await login(
      jsonRequest("/api/auth/login", {
        email: " ADMIN@EXAMPLE.COM ",
        password: fixture.password,
      }),
    );

    expect(response.status).toBe(200);
  });

  it("makes wrong-password and unknown-user failures identical", async () => {
    const fixture = await buildUser();
    await db.user.create({ data: fixture.data });

    const wrongPassword = await login(
      jsonRequest("/api/auth/login", {
        email: fixture.data.email,
        password: "wrong",
      }),
    );
    const unknownEmail = await login(
      jsonRequest("/api/auth/login", {
        email: "unknown@example.com",
        password: "wrong",
      }),
    );

    expect(unknownEmail.status).toBe(wrongPassword.status);
    expect(await unknownEmail.json()).toEqual(await wrongPassword.json());
    expect(wrongPassword.status).toBe(401);
    expect(wrongPassword.headers.get("set-cookie")).toBeNull();
    expect(unknownEmail.headers.get("set-cookie")).toBeNull();
  });

  it("always performs a password comparison for an unknown email", async () => {
    await login(
      jsonRequest("/api/auth/login", {
        email: "unknown@example.com",
        password: "wrong",
      }),
    );

    expect(bcryptCompare).toHaveBeenCalledOnce();
  });

  it("rejects malformed input, oversized passwords, non-JSON, and cross-origin requests", async () => {
    const invalid = await login(
      jsonRequest("/api/auth/login", { email: "bad", password: "" }),
    );
    const oversized = await login(
      jsonRequest("/api/auth/login", {
        email: "admin@example.com",
        password: "x".repeat(129),
      }),
    );
    const nonJson = await login(
      new NextRequest(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "content-type": "text/plain" },
        body: "{}",
      }),
    );
    const crossOrigin = await login(
      jsonRequest(
        "/api/auth/login",
        { email: "admin@example.com", password: "password" },
        { origin: "https://evil.example" },
      ),
    );

    expect(invalid.status).toBe(400);
    expect(await invalid.json()).toMatchObject({
      fieldErrors: expect.any(Object),
    });
    expect(oversized.status).toBe(400);
    expect(nonJson.status).toBe(415);
    expect(crossOrigin.status).toBe(403);
  });
});

describe("POST /api/auth/logout", () => {
  it("clears the cookie and is idempotent without a session", async () => {
    const response = await logout(
      new NextRequest(`${baseUrl}/api/auth/logout`, { method: "POST" }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("rejects cross-origin requests", async () => {
    const response = await logout(
      new NextRequest(`${baseUrl}/api/auth/logout`, {
        method: "POST",
        headers: { origin: "https://evil.example" },
      }),
    );

    expect(response.status).toBe(403);
  });
});

describe("GET /api/admin/me direct guard", () => {
  it("returns 401 without a cookie", async () => {
    const response = await getMe(new NextRequest(`${baseUrl}/api/admin/me`));
    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("returns the email for a valid cookie", async () => {
    const token = await signSession({
      sub: "user-1",
      email: "admin@example.com",
    });
    const response = await getMe(withCookie("/api/admin/me", token));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      email: "admin@example.com",
    });
  });

  it.each([
    [
      "expired",
      () =>
        insecureToken({ sub: "user-1", email: "a@b.com" }, { expiresAt: "0s" }),
    ],
    [
      "wrong-secret",
      () =>
        insecureToken(
          { sub: "user-1", email: "a@b.com" },
          { secret: "another-integration-secret-at-least-32-characters" },
        ),
    ],
  ])("rejects %s tokens", async (_name, createToken) => {
    const response = await getMe(
      withCookie("/api/admin/me", await createToken()),
    );
    expect(response.status).toBe(401);
  });

  it("rejects tampered and alg-none tokens", async () => {
    const signed = await signSession({ sub: "user-1", email: "a@b.com" });
    const tampered = `${signed.slice(0, -1)}A`;
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

    expect((await getMe(withCookie("/api/admin/me", tampered))).status).toBe(
      401,
    );
    expect(
      (await getMe(withCookie("/api/admin/me", `${header}.${payload}.`)))
        .status,
    ).toBe(401);
  });
});

describe("admin proxy", () => {
  it("redirects pages with the complete path and query", async () => {
    const response = await handleProxyRequest(
      new NextRequest(`${baseUrl}/admin/products?draft=1`),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      `${baseUrl}/admin/login?next=%2Fadmin%2Fproducts%3Fdraft%3D1`,
    );
  });

  it("returns API 401 without a cookie", async () => {
    const response = await handleProxyRequest(
      new NextRequest(`${baseUrl}/api/admin/me`),
    );
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("passes through a valid cookie and leaves login public", async () => {
    const token = await signSession({ sub: "user-1", email: "a@b.com" });
    const protectedResponse = await handleProxyRequest(
      withCookie("/admin/products", token),
    );
    const loginResponse = await handleProxyRequest(
      new NextRequest(`${baseUrl}/admin/login`),
    );

    expect(protectedResponse.headers.get("x-middleware-next")).toBe("1");
    expect(loginResponse.headers.get("x-middleware-next")).toBe("1");
  });

  it("treats expired and tampered cookies as unauthenticated", async () => {
    const expired = await insecureToken(
      { sub: "user-1", email: "a@b.com" },
      { expiresAt: "0s" },
    );
    const valid = await signSession({ sub: "user-1", email: "a@b.com" });
    const tampered = `${valid.slice(0, -1)}A`;

    expect(
      (await handleProxyRequest(withCookie("/admin/products", expired))).status,
    ).toBe(307);
    expect(
      (await handleProxyRequest(withCookie("/admin/products", tampered)))
        .status,
    ).toBe(307);
  });
});
