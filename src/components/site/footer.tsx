import Link from "next/link";
import { footerMenus } from "@/lib/content";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-black/40">
      <div className="content-shell grid gap-10 px-0 py-10 text-sm text-stone-400 lg:grid-cols-[1.1fr_0.9fr_0.9fr_0.9fr]">
        <div>
          <div className="text-sm uppercase tracking-[0.38em] text-stone-100">Errant-Arts</div>
          <p className="mt-4 max-w-sm leading-7 text-stone-400">
            Original photography by Errant Arts, curated for collectors, homes, and creative spaces.
          </p>
        </div>

        {footerMenus.map((menu) => (
          <div key={menu.title}>
            <div className="text-xs uppercase tracking-[0.28em] text-stone-500">{menu.title}</div>
            <div className="mt-4 flex flex-col gap-3">
              {menu.links.map((link) => (
                <Link key={link.href} href={link.href} className="text-stone-300 hover:text-white">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </footer>
  );
}
