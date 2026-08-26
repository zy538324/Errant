import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import {
  getMarketingDashboard,
  getMarketingFromEmail,
  getMarketingReplyToEmail,
} from "@/lib/marketing";
import { getGraphMailStatus } from "@/lib/microsoft-graph-mail";
import { MarketingManager } from "@/components/admin/marketing-manager";

export const dynamic = "force-dynamic";

export default async function AdminMarketingPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin/login");
  }

  const dashboard = await getMarketingDashboard();

  return (
    <main className="content-shell py-16 text-stone-300">
      <div>
        <div className="eyebrow">Marketing</div>
        <h1 className="mt-3 font-serif text-5xl text-stone-50">
          Email campaign control.
        </h1>
        <p className="mt-4 max-w-4xl text-lg leading-8">
          Create one campaign message and send private, individual copies only
          to customers who actively opted in. Each email includes its own
          unsubscribe link.
        </p>
      </div>

      <MarketingManager
        initialDashboard={{
          ...dashboard,
          graph: getGraphMailStatus({
            senderEmail: getMarketingFromEmail(),
            replyToEmail: getMarketingReplyToEmail(),
          }),
        }}
      />
    </main>
  );
}
