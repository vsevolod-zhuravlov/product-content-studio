import { redirect } from "next/navigation";
import { requireAdminPage } from "@/lib/auth/session";

export default async function AdminPage() {
  await requireAdminPage();
  redirect("/admin/products");
}
