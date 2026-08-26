import { CustomerDrawer } from "@/components/admin/customer-drawer";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

export default async function AdminCustomersPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin/login");
  }

  return <main className="mx-auto max-w-7xl px-6 py-16 lg:px-10"><CustomerDrawer /></main>;
}
