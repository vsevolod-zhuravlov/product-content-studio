import { SignJWT } from "jose";
import { NextRequest } from "next/server";
import {
  AUTH_COOKIE_NAME,
  SESSION_AUDIENCE,
  SESSION_ISSUER,
} from "@/lib/auth/constants";
import { signSession } from "@/lib/auth/jwt";

export const API_BASE_URL = "http://localhost:3000";

type RequestOptions = {
  method?: string;
  body?: BodyInit | null;
  contentType?: string | null;
  token?: string;
  headers?: Record<string, string>;
};

export function apiRequest(
  path: string,
  {
    method = "GET",
    body,
    contentType,
    token,
    headers = {},
  }: RequestOptions = {},
): NextRequest {
  const requestHeaders = new Headers(headers);

  if (
    contentType !== null &&
    (contentType !== undefined || body !== undefined)
  ) {
    requestHeaders.set("content-type", contentType ?? "application/json");
  }
  if (token) {
    requestHeaders.set("cookie", `${AUTH_COOKIE_NAME}=${token}`);
  }

  return new NextRequest(`${API_BASE_URL}${path}`, {
    method,
    headers: requestHeaders,
    body,
  });
}

export function jsonApiRequest(
  path: string,
  method: string,
  body: unknown,
  token?: string,
  headers?: Record<string, string>,
): NextRequest {
  return apiRequest(path, {
    method,
    body: JSON.stringify(body),
    token,
    headers,
  });
}

export async function validAdminToken(): Promise<string> {
  return signSession({ sub: "admin-1", email: "admin@example.com" });
}

export async function invalidAdminTokens(): Promise<
  Array<[name: string, token: string | undefined]>
> {
  const valid = await validAdminToken();
  const replacement = valid.endsWith("A") ? "B" : "A";

  return [
    ["no cookie", undefined],
    [
      "expired token",
      await customToken(
        { sub: "admin-1", email: "admin@example.com" },
        { expiresAt: "0s" },
      ),
    ],
    ["tampered token", `${valid.slice(0, -1)}${replacement}`],
    [
      "wrong-secret token",
      await customToken(
        { sub: "admin-1", email: "admin@example.com" },
        { secret: "wrong-secret-that-is-at-least-32-characters-long" },
      ),
    ],
  ];
}

async function customToken(
  payload: Record<string, unknown>,
  options: { secret?: string; expiresAt?: string } = {},
): Promise<string> {
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
