import type { ReactNode } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { AdminLogoutButton } from "@/components/admin/logout-button";

const ownerAdminLinks = [
  ["Dashboard", "/admin"],
  ["Collections", "/admin/collections"],
  ["Artworks", "/admin/artworks"],
  ["New artwork", "/admin/artworks/new"],
  ["Portfolio", "/admin/portfolio"],
  ["Readiness", "/admin/shop-readiness"],
] as const;

export function OwnerAdminNav({ username }: { username: string }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-sm text-stone-200">
          <ShieldCheck className="h-4 w-4 text-brand-accent" />
          <span>Secure owner admin</span>
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100">
            MFA protected · {username}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/" className="rounded-full border border-white/10 px-4 py-2 text-xs text-stone-100 hover:bg-white/5">
            View site
          </Link>
          <AdminLogoutButton />
        </div>
      </div>
      <nav className="mt-5 flex flex-wrap gap-2">
        {ownerAdminLinks.map(([label, href]) => (
          <Link key={href} href={href} className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs font-medium text-stone-200 hover:bg-white/10">
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function AdminPageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="mt-3 font-serif text-5xl text-stone-50">{title}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-300">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function AdminStatCard({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
      <div className="text-xs uppercase tracking-[0.25em] text-stone-400">{label}</div>
      <div className="mt-3 font-serif text-3xl text-stone-50">{value}</div>
      {detail ? <div className="mt-2 text-sm text-stone-400">{detail}</div> : null}
    </div>
  );
}

export function formatCurrency(pricePence: number, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(pricePence / 100);
}
