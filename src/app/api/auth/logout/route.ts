import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth/constants";
import { getClearingCookieOptions } from "@/lib/auth/cookie";
import { isSameOrigin } from "@/lib/auth/csrf";

function json(body: unknown, init?: ResponseInit): NextResponse {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request)) {
    return json({ error: "Forbidden" }, { status: 403 });
  }

  const response = json({ ok: true });
  response.cookies.set(AUTH_COOKIE_NAME, "", getClearingCookieOptions());
  return response;
}
