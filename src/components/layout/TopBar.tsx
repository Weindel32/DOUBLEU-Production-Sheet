"use client";

import { ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";

interface TopBarProps {
  backHref?: string;
  backLabel?: string;
  savedAt?: string;
  actions?: React.ReactNode;
}

export default function TopBar({ backHref, backLabel, savedAt, actions }: TopBarProps) {
  return (
    <div className="h-14 bg-[#FBFAF7] border-b border-[#E4E0D6] flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-4">
        {backHref && (
          <Link
            href={backHref}
            className="flex items-center gap-2 text-sm text-[#5F6878] hover:text-[#0E1B2C] transition-colors"
          >
            <ArrowLeft size={16} />
            {backLabel || "Torna alle schede"}
          </Link>
        )}
      </div>

      <div className="flex items-center gap-4">
        {savedAt && (
          <div className="flex items-center gap-1.5 text-sm text-[#5F6878]">
            <CheckCircle size={15} className="text-[#1D6B4A]" />
            Salvato {savedAt}
          </div>
        )}
        {actions}
      </div>
    </div>
  );
}
