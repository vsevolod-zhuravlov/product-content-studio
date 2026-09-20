import type { ReactNode } from "react";
import { LogoutButton } from "@/components/auth/logout-button";
import { requireAdminPage } from "@/lib/auth/session";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireAdminPage();

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="font-semibold">Product Content Studio</p>
            <p className="text-sm text-muted-foreground">{session.email}</p>
          </div>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
