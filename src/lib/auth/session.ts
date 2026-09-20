import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME } from "./constants";
import { verifySessionToken, type Session } from "./jwt";

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  return token ? verifySessionToken(token) : null;
}

export async function requireAdminPage(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return session;
}
