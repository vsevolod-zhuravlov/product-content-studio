import { NextResponse, type NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/guard";

export async function handleProxyRequest(
  request: NextRequest,
): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const session = await getSessionFromRequest(request);
  if (session) {
    return NextResponse.next();
  }

  if (pathname === "/api/admin" || pathname.startsWith("/api/admin/")) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export function proxy(request: NextRequest): Promise<NextResponse> {
  return handleProxyRequest(request);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
