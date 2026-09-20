import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getSession } from "@/lib/auth/session";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  if (await getSession()) {
    redirect("/admin/products");
  }

  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <LoginForm next={next} />
    </main>
  );
}
