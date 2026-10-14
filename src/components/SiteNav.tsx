"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenText, ClipboardList, LayoutGrid } from "lucide-react";
import { motion } from "framer-motion";

const LINKS = [
  { href: "/", label: "Balcão", icon: ClipboardList },
  { href: "/produtos", label: "Catálogo", icon: BookOpenText },
  { href: "/vendas", label: "Vendas", icon: LayoutGrid },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-night/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1440px] items-center gap-4 px-4 py-3 sm:px-6 lg:px-10">
        <Link href="/" className="group flex items-center gap-3">
          <span className="notch flex size-11 items-center justify-center bg-brand2 font-display text-xl text-night shadow-[0_6px_18px_-6px_rgba(224,164,88,0.6)] transition-transform duration-300 group-hover:-rotate-6">
            $
          </span>
          <span className="leading-none">
            <span className="block font-display text-[22px] tracking-wide text-brand">
              O SALOON
            </span>
            <span className="mt-0.5 block text-[11px] font-medium uppercase tracking-[0.35em] text-mute">
              Balcão · Preçário
            </span>
          </span>
        </Link>

        <nav className="ml-auto flex items-center gap-1 rounded-full border border-line/70 bg-panel/70 p-1">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="relative flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-semibold uppercase tracking-[0.18em] transition-colors sm:px-5"
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-brand2/90"
                    transition={{ type: "spring", bounce: 0.25, duration: 0.55 }}
                  />
                )}
                <Icon
                  className={`relative z-10 size-4 ${active ? "text-night" : "text-mute"}`}
                  strokeWidth={2.4}
                />
                <span
                  className={`relative z-10 hidden sm:block ${active ? "text-night" : "text-mute hover:text-cream"}`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        <span className="hidden rotate-2 rounded-sm border-2 border-dashed border-line2 px-3 py-1.5 font-type text-[11px] tracking-[0.2em] text-mute lg:block">
          VALENTINE · EST. 1899
        </span>
      </div>
    </header>
  );
}
