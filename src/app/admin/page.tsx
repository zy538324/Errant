import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, Images, Mail, PenSquare, Settings, ShoppingCart } from "lucide-react";
import { adminDashboardSections } from "@/lib/content";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { AdminLogoutButton } from "@/components/admin/logout-button";

const sectionIcons = [Images, ShoppingCart, BarChart3, Settings] as const;

export default async function AdminPage() {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    redirect("/admin/login");
  }

  return (
    <main className="content-shell py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="eyebrow">Admin dashboard</div>
          <h1 className="mt-3 font-serif text-5xl text-stone-50">Welcome back, {admin.username}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-300">
            Manage photos, journal posts, sales, analytics, settings, and customer operations from one secure dashboard.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/"><Button variant="ghost">Back to site</Button></Link>
          <AdminLogoutButton />
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-4">
        {adminDashboardSections.map((section, index) => {
          const Icon = sectionIcons[index];
          return (
            <div key={section.title} className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <Icon className="h-5 w-5 text-brand-accent" />
              <div className="mt-4 font-serif text-2xl text-stone-50">{section.title}</div>
              <p className="mt-3 text-sm leading-7 text-stone-300">{section.body}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <div className="text-xs uppercase tracking-[0.3em] text-stone-400">Operations</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {[
              ["Photos", "/admin/artworks"],
              ["Journal", "/admin/news"],
              ["Collections", "/admin/collections"],
              ["Orders", "/admin/orders"],
              ["Customers", "/admin/customers"],
              ["Marketing", "/admin/marketing"],
              ["Settings", "/admin/settings"],
            ].map(([label, href]) => (
              <Link key={label} href={href} className="rounded-2xl border border-white/10 bg-black/20 p-5 text-stone-200 hover:bg-black/30">
                <span className="flex items-center gap-2">
                  {label === "Journal" && <PenSquare className="h-4 w-4 text-brand-accent" />}
                  {label === "Marketing" && <Mail className="h-4 w-4 text-brand-accent" />}
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <div className="text-xs uppercase tracking-[0.3em] text-stone-400">Security</div>
          <div className="mt-4 space-y-3 text-sm leading-7 text-stone-300">
            <p>Session cookies are HTTP-only and admin access now requires a username-backed password login flow.</p>
            <p>MFA enrolment is supported using TOTP secrets and six-digit authenticator codes.</p>
            <p>Use the seed script after migration to create the initial admin users and example journal posts in PostgreSQL.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
