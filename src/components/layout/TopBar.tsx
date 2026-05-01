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
    <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-4">
        {backHref && (
          <Link
            href={backHref}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={16} />
            {backLabel || "Torna alle schede"}
          </Link>
        )}
      </div>

      <div className="flex items-center gap-4">
        {savedAt && (
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <CheckCircle size={15} className="text-green-500" />
            Salvato {savedAt}
          </div>
        )}
        {actions}
      </div>
    </div>
  );
}
