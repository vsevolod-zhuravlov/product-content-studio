import "server-only";
import { getEnv } from "@/lib/env";
import { SESSION_TTL_SECONDS } from "./constants";

export function getSessionCookieOptions(secure = getEnv().AUTH_COOKIE_SECURE) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure,
    maxAge: SESSION_TTL_SECONDS,
  };
}

export function getClearingCookieOptions(secure = getEnv().AUTH_COOKIE_SECURE) {
  return {
    ...getSessionCookieOptions(secure),
    maxAge: 0,
  };
}
