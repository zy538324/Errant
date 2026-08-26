import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getAdminSettingsForClient } from "@/lib/admin-settings";
import { SettingsEditor } from "@/components/admin/settings-editor";

export default async function AdminSettingsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin/login");
  }

  const { settings, secretStatus } = await getAdminSettingsForClient();

  return (
    <main className="content-shell py-16 text-stone-300">
      <div>
        <div className="eyebrow">System configuration</div>
        <h1 className="mt-3 font-serif text-5xl text-stone-50">Settings control room</h1>
        <p className="mt-4 max-w-4xl text-lg leading-8">
          Manage payments, storage, runtime identity, session security, customer-data operations, and other operator controls from one high-trust admin surface.
        </p>
      </div>

      <SettingsEditor initialSettings={settings} initialSecretStatus={secretStatus} />
    </main>
  );
}
