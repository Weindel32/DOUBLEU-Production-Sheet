"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, Package, Calculator } from "lucide-react";

const VOCI = [
  { href: "/m", label: "Home", icon: Home },
  { href: "/m/materiali", label: "Materiali", icon: Package },
  { href: "/m/costi", label: "Costi", icon: Calculator },
  { href: "/m/schede", label: "Schede", icon: FileText },
];

/** Barra in basso, a portata di pollice. */
export default function BarraMobile() {
  const pathname = usePathname();
  return (
    <nav aria-label="Navigazione" className="fixed bottom-0 inset-x-0 z-40 bg-[#0E1B2C] pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-xl mx-auto grid grid-cols-4">
        {VOCI.map(({ href, label, icon: Icon }) => {
          const attiva = href === "/m" ? pathname === "/m" : pathname.startsWith(href);
          return (
            <Link key={href} href={href} aria-current={attiva ? "page" : undefined}
              className={`h-[64px] flex flex-col items-center justify-center gap-1 text-[11px] font-medium ${attiva ? "text-white" : "text-[#9FB0C8]"}`}>
              <Icon size={22} strokeWidth={attiva ? 2.2 : 1.8} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
