import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth/constants";
import { getSessionCookieOptions } from "@/lib/auth/cookie";
import { isJsonRequest, isSameOrigin } from "@/lib/auth/csrf";
import { signSession } from "@/lib/auth/jwt";
import { DUMMY_PASSWORD_HASH, verifyPassword } from "@/lib/auth/password";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validation/auth";
import { z } from "zod";

function json(body: unknown, init?: ResponseInit): NextResponse {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request)) {
    return json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isJsonRequest(request)) {
    return json({ error: "Unsupported Media Type" }, { status: 415 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Некоректні дані", fieldErrors: {} }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return json(
      {
        error: "Некоректні дані",
        fieldErrors: z.flattenError(parsed.error).fieldErrors,
      },
      { status: 400 },
    );
  }

  const user = await db.user.findUnique({
    where: { email: parsed.data.email },
  });
  const passwordMatches = await verifyPassword(
    parsed.data.password,
    user?.passwordHash ?? DUMMY_PASSWORD_HASH,
  );

  if (!user || !passwordMatches) {
    return json({ error: "Невірна пошта або пароль" }, { status: 401 });
  }

  const token = await signSession({ sub: user.id, email: user.email });
  const response = json({ user: { email: user.email } });
  response.cookies.set(AUTH_COOKIE_NAME, token, getSessionCookieOptions());
  return response;
}
