import type { Metadata } from "next";
import "./globals.css";
import { RootShell } from "@/components/site/root-shell";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <RootShell>{children}</RootShell>
      </body>
    </html>
  );
}
