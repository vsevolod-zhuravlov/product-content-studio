import { requireAdminPage } from "@/lib/auth/session";

export default async function AdminProductsPage() {
  await requireAdminPage();

  return <h1 className="text-2xl font-semibold">Товари</h1>;
}
