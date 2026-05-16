"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Menu,
  X,
  FileText,
  PlusCircle,
  Users,
  Image,
  Package,
  BarChart2,
  Monitor,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const BUILD = 3;

const drawerNavItems = [
  { href: "/t/schede",       label: "Schede",        icon: FileText,   tablet: true },
  { href: "/t/schede/nuova", label: "Nuova scheda",  icon: PlusCircle, tablet: true },
  { href: "/clienti",        label: "Clienti / Club", icon: Users,      tablet: false },
  { href: "/loghi",          label: "Loghi",          icon: Image,      tablet: false },
  { href: "/materiali",      label: "Materiali",      icon: Package,    tablet: false },
  { href: "/analytics",      label: "Analytics",      icon: BarChart2,  tablet: false },
];

export default function TabletTopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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
    <>
      {/* Fixed top bar */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-[#0a1628] border-b border-white/7 flex items-center justify-between px-4 z-40">
        {/* Hamburger */}
        <button
          onClick={() => setOpen(true)}
          className="flex items-center justify-center w-10 h-10 rounded-lg text-[#8ba3c7] hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Apri menu"
        >
          <Menu size={22} />
        </button>

        {/* Branding (center) */}
        <div className="absolute left-1/2 -translate-x-1/2 text-center">
          <div className="text-white font-black text-sm tracking-[0.18em] uppercase leading-none">DOUBLEU</div>
          <div className="text-[#4e6585] text-[8px] tracking-[0.22em] uppercase font-medium">PRODUCTION SHEET</div>
        </div>

        {/* Right placeholder for balance */}
        <div className="w-10" />
      </header>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-in drawer */}
      <aside
        className="fixed top-0 left-0 h-full w-72 bg-[#0a1628] border-r border-white/7 z-50 flex flex-col transition-transform duration-200"
        style={{ transform: open ? "translateX(0)" : "translateX(-100%)" }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/5">
          <div>
            <div className="text-white font-black text-lg tracking-[0.18em] uppercase leading-none">DOUBLEU</div>
            <div className="text-[#4e6585] text-[9px] tracking-[0.22em] uppercase mt-1.5 font-medium">PRODUCTION SHEET</div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-[#8ba3c7] hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Chiudi menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {drawerNavItems.map(({ href, label, icon: Icon, tablet: isTablet }) => {
            const isActive = isTablet
              ? pathname.startsWith(href)
              : false;
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

          {/* Separator + Desktop link */}
          <div className="pt-2 mt-2 border-t border-white/7">
            <Link
              href="/schede"
              className="sidebar-link"
            >
              <Monitor size={16} />
              <span>Vista Desktop →</span>
            </Link>
          </div>
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
    </>
  );
}
