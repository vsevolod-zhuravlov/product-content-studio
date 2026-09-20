import type { ReactNode } from "react";
import { UnsavedChangesProvider } from "@/components/common/unsaved-changes-provider";
import { AdminHeader } from "@/components/layout/admin-header";
import { requireAdminPage } from "@/lib/auth/session";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireAdminPage();

  return (
    <UnsavedChangesProvider>
      <div className="min-h-screen">
        <AdminHeader email={session.email} />
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </UnsavedChangesProvider>
  );
}
