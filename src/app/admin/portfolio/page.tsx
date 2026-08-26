import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { listOwnerPortfolioItems } from "@/lib/app-content";
import { PortfolioManager } from "@/components/admin/portfolio-manager";
import { AdminPageHeader, AdminStatCard, OwnerAdminNav } from "@/components/admin/owner-admin-nav";

export default async function AdminPortfolioPage() {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    redirect("/admin/login?next=/admin/portfolio");
  }

  const portfolioItems = await listOwnerPortfolioItems();
  const published = portfolioItems.filter((item) => item.status === "PUBLISHED").length;
  const drafts = portfolioItems.filter((item) => item.status === "DRAFT").length;
  const missingImages = portfolioItems.filter((item) => !item.previewUrl).length;

  return (
    <main className="content-shell py-12">
      <OwnerAdminNav username={admin.username} />
      <div className="mt-10">
        <AdminPageHeader
          eyebrow="Owner content"
          title="Portfolio"
          description="Add, edit, delete and publish portfolio entries directly from the application. Portfolio content is now managed from the local database and Cloudflare R2 only."
        />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <AdminStatCard label="Portfolio items" value={portfolioItems.length} />
        <AdminStatCard label="Published" value={published} />
        <AdminStatCard label="Drafts" value={drafts} />
        <AdminStatCard label="Missing images" value={missingImages} detail="Managed locally" />
      </div>

      <div className="mt-8">
        <PortfolioManager items={portfolioItems} />
      </div>
    </main>
  );
}
