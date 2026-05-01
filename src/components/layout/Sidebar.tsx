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
} from "lucide-react";
import { cn } from "@/lib/utils";

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

  return (
    <aside className="sidebar flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-slate-700">
        <div className="text-white font-bold text-lg tracking-wider">DOUBLE U</div>
        <div className="text-slate-400 text-xs mt-0.5">HANDCRAFTED IN ITALY</div>
        <div className="flex gap-1 mt-2">
          {["#009246", "#ffffff", "#ce2b37"].map((c, i) => (
            <div key={i} className="h-1 flex-1 rounded-full" style={{ backgroundColor: c }} />
          ))}
        </div>
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

      {/* User */}
      <div className="p-4 border-t border-slate-700 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
          AD
        </div>
        <div>
          <div className="text-white text-sm font-medium">Admin</div>
          <div className="text-slate-400 text-xs">DOUBLEU</div>
        </div>
      </div>
    </aside>
  );
}
