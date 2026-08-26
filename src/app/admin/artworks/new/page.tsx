import { redirect } from "next/navigation";
import { ArtworkEditor } from "@/components/admin/artwork-editor";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { AdminPageHeader, OwnerAdminNav } from "@/components/admin/owner-admin-nav";

export default async function NewArtworkPage() {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    redirect("/admin/login?next=/admin/artworks/new");
  }

  return (
    <main className="content-shell py-12">
      <OwnerAdminNav username={admin.username} />
      <div className="mt-10">
        <AdminPageHeader
          eyebrow="Owner catalogue"
          title="Add new artwork"
          description="Upload the original image to R2, set the title, collection, price and publish state, then save it as a controlled shop-ready record."
        />
      </div>
      <div className="mt-8">
        {/* @ts-expect-error Async Server Component */}
        <ArtworkEditorWrapper />
      </div>
    </main>
  );
}


async function ArtworkEditorWrapper() {
  const collections = await db.collection.findMany({ orderBy: { name: "asc" } });
  return <ArtworkEditor collections={collections} />;
}