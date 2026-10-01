"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Archive,
  BookOpen,
  Users,
  Image,
  Package,
  Settings,
  LogOut,
  BarChart2,
  Calculator,
} from "lucide-react";
import { cn } from "@/lib/utils";

const BUILD = 15;

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/articoli", label: "Articoli e costi", icon: Calculator },
  { href: "/schede", label: "Schede produzione", icon: FileText },
  { href: "/schede/nuova", label: "Nuova scheda", icon: PlusCircle },
  { href: "/archivio", label: "Archivio", icon: Archive },
  { href: "/modelli", label: "Modelli", icon: BookOpen },
  { href: "/clienti", label: "Clienti / Club", icon: Users },
  { href: "/loghi", label: "Loghi", icon: Image },
  { href: "/materiali", label: "Materiali", icon: Package },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/impostazioni", label: "Impostazioni", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  // Cancella il cookie di sessione. L'header Basic finto sostituisce eventuali credenziali del
  // vecchio popup salvate dal browser, che altrimenti farebbero rientrare senza password.
  const handleLogout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        headers: { Authorization: "Basic " + btoa("logout:logout") },
      });
    } catch {}
    window.location.href = "/login";
  };

  return (
    <aside className="sidebar flex flex-col">
      {/* Logo */}
      <div className="px-3 xl:px-5 py-5 border-b border-white/10 flex justify-center xl:block">
        <div className="xl:hidden w-11 h-11 rounded-xl bg-[#F6F4EF] text-[#0E1B2C] flex items-center justify-center font-display font-extrabold text-[17px]">DU</div>
        <div className="hidden xl:block font-display text-white font-extrabold text-lg tracking-[0.18em] uppercase leading-none">DOUBLEU</div>
        <div className="hidden xl:block text-[#9FB0C8] text-[9px] tracking-[0.22em] uppercase mt-1.5 font-medium">PRODUCTION SHEET</div>
      </div>

      {/* Nav */}
      <nav aria-label="Navigazione principale" className="flex-1 p-2 xl:p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          // Vince la voce più specifica: su /schede/nuova è attiva "Nuova scheda", non anche "Schede".
          const piuSpecifica = navItems.some((n) => n.href.length > href.length && n.href.startsWith(href) && pathname.startsWith(n.href));
          const isActive =
            href === "/dashboard"
              ? pathname === "/" || pathname === "/dashboard"
              : pathname.startsWith(href) && !piuSpecifica;

          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
              className={cn("sidebar-link", isActive && "active")}
            >
              <Icon size={18} className="flex-shrink-0" />
              <span className="sidebar-label">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="p-2 xl:p-4 border-t border-white/10">
        <div className="flex items-center justify-center xl:justify-start gap-3 mb-2">
          <div className="w-9 h-9 rounded-full bg-[#1F3A68] flex items-center justify-center text-white text-xs font-bold">
            AD
          </div>
          <div className="hidden xl:block flex-1 min-w-0">
            <div className="text-white text-sm font-medium">Admin</div>
            <div className="text-[#9FB0C8] text-xs">Build {BUILD}</div>
          </div>
        </div>
        <div className="xl:hidden text-center font-mono text-[10px] text-[#9FB0C8] mb-1">build {BUILD}</div>
        <button
          onClick={handleLogout}
          aria-label="Esci"
          className="w-full h-10 flex items-center justify-center xl:justify-start gap-2 text-[#9FB0C8] hover:text-white text-xs px-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <LogOut size={15} />
          <span className="hidden xl:inline">Esci</span>
        </button>
      </div>
    </aside>
  );
}
