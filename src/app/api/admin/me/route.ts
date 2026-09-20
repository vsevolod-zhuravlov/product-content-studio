import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth/guard";

export const GET = withAdmin<RouteContext<"/api/admin/me">>(
  async (_request, _context, session) =>
    NextResponse.json({ email: session.email }),
);
