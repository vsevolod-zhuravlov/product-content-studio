import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginCard } from "@/components/auth/login-card";
import { LoginForm } from "@/components/auth/login-form";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Вхід до адмін-панелі",
};

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
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <LoginCard>
        <LoginForm next={next} />
      </LoginCard>
    </main>
  );
}
