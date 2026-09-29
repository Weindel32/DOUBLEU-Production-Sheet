import type { Metadata } from "next";
import BarraMobile from "@/components/mobile/BarraMobile";

// Icona separata sulla schermata Home: nome e pagina di partenza propri (/m).
export const metadata: Metadata = {
  title: "DU Mobile",
  manifest: "/manifest-m.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "DU Mobile" },
};

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F6F4EF] text-[#0E1B2C]">
      <div className="max-w-xl mx-auto pb-[calc(76px+env(safe-area-inset-bottom))]">{children}</div>
      <BarraMobile />
    </div>
  );
}
