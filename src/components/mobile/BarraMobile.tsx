"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, Package, Calculator } from "lucide-react";

const VOCI = [
  { href: "/m", label: "Home", icon: Home },
  { href: "/m/materiali", label: "Materiali", icon: Package },
  { href: "/m/costi", label: "Costi", icon: Calculator },
  { href: "/m/schede", label: "Ordini", icon: FileText },
];

/** Lineetta sopra l'icona appena tocchi una voce, finché la pagina non cambia: il tocco è stato preso. */
function InArrivo() {
  const { pending } = useLinkStatus();
  return <span aria-hidden className={`absolute top-0 inset-x-6 h-[3px] rounded-b bg-white transition-opacity ${pending ? "opacity-100 animate-pulse" : "opacity-0"}`} />;
}

/** Barra in basso, a portata di pollice. */
export default function BarraMobile() {
  const pathname = usePathname();
  return (
    <nav aria-label="Navigazione" className="fixed bottom-0 inset-x-0 z-40 bg-[#0E1B2C] pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-xl mx-auto grid grid-cols-4">
        {VOCI.map(({ href, label, icon: Icon }) => {
          const attiva = href === "/m" ? pathname === "/m" : pathname.startsWith(href) || (href === "/m/schede" && pathname.startsWith("/m/acquisti"));
          return (
            <Link key={href} href={href} aria-current={attiva ? "page" : undefined}
              className={`relative h-[64px] flex flex-col active:bg-white/10 items-center justify-center gap-1 text-[11px] font-medium ${attiva ? "text-white" : "text-[#9FB0C8]"}`}>
              <Icon size={22} strokeWidth={attiva ? 2.2 : 1.8} />
              {label}
              <InArrivo />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
