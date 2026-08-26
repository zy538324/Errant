"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";

export function RootShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isStudioRoute = pathname?.startsWith("/studio");

  return (
    <div className="min-h-screen">
      {!isStudioRoute ? <SiteHeader /> : null}
      {children}
      {!isStudioRoute ? <SiteFooter /> : null}
    </div>
  );
}
