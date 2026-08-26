import Link from "next/link";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
  // { href: "/news", label: "News" }, // disabled — restore when public news is back
  { href: "/contact", label: "Contact" },
  { href: "/account", label: "Account" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#3C3E47] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" aria-label="Errant-Arts home" className="inline-flex shrink-0 items-center">
            <Image
              src="/logo.png"
              alt="Errant Arts"
              width={520}
              height={178}
              className="h-auto w-[clamp(140px,42vw,200px)] max-w-[200px] md:w-[clamp(180px,18vw,260px)] md:max-w-[260px]"
              sizes="(max-width: 768px) 200px, 260px"
              priority
            />
          </Link>
          <Link href="/cart" className="lg:hidden">
            <Button variant="ghost" size="sm">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Cart
            </Button>
          </Link>
        </div>
        <nav className="flex gap-2 overflow-x-auto pb-1 lg:gap-6 lg:overflow-visible lg:pb-0">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-full px-3 py-2 text-sm text-stone-300 hover:bg-white/5 hover:text-white lg:px-0"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link href="/cart" className="hidden lg:block">
          <Button variant="ghost" size="sm">
            <ShoppingBag className="mr-2 h-4 w-4" />
            Cart
          </Button>
        </Link>
      </div>
    </header>
  );
}
