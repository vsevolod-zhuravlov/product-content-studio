import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "./constants";
import { isSameOrigin } from "./csrf";
import { verifySessionToken, type Session } from "./jwt";

type AdminHandler<Context> = (
  request: NextRequest,
  context: Context,
  session: Session,
) => Response | Promise<Response>;

function noStore(response: Response): Response {
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function getSessionFromRequest(
  request: NextRequest,
): Promise<Session | null> {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  return token ? verifySessionToken(token) : null;
}

export function withAdmin<Context>(handler: AdminHandler<Context>) {
  return async (request: NextRequest, context?: Context): Promise<Response> => {
    if (
      request.method !== "GET" &&
      request.method !== "HEAD" &&
      !isSameOrigin(request)
    ) {
      return noStore(
        NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      );
    }

    const session = await getSessionFromRequest(request);
    if (!session) {
      return noStore(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      );
    }

    return noStore(await handler(request, context as Context, session));
  };
}
