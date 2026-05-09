"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

const BUILD = 3;

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/schede", label: "Schede", icon: FileText },
  { href: "/schede/nuova", label: "Nuova scheda", icon: PlusCircle },
  { href: "/archivio", label: "Archivio", icon: Archive },
  { href: "/modelli", label: "Modelli base", icon: BookOpen },
  { href: "/clienti", label: "Clienti / Club", icon: Users },
  { href: "/loghi", label: "Loghi", icon: Image },
  { href: "/materiali", label: "Materiali", icon: Package },
  { href: "/impostazioni", label: "Impostazioni", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", {
        headers: { Authorization: "Basic " + btoa("logout:logout") },
      });
    } catch {}
    router.refresh();
    window.location.href = "/";
  };

  return (
    <aside className="sidebar flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="text-white font-black text-lg tracking-[0.18em] uppercase leading-none">DOUBLEU</div>
        <div className="text-[#4e6585] text-[9px] tracking-[0.22em] uppercase mt-1.5 font-medium">PRODUCTION SHEET</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/" || pathname === "/dashboard"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn("sidebar-link", isActive && "active")}
            >
              <Icon size={16} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
            AD
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-medium">Admin</div>
            <div className="text-slate-400 text-xs">Build {BUILD}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 text-slate-400 hover:text-white text-xs px-2 py-1.5 rounded-lg hover:bg-slate-700 transition-colors"
        >
          <LogOut size={13} />
          Esci
        </button>
      </div>
    </aside>
  );
}
