"use client";

// Primitive di form condivise. Vivono a livello di modulo (mai definite dentro un altro
// componente): un componente ridefinito a ogni render viene smontato e rimontato,
// e il campo perde il focus a ogni tasto.

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const inputCls =
  "w-full h-11 text-[15px] text-[#0E1B2C] bg-white border border-[#D6D1C4] rounded-[10px] px-3 outline-none transition-colors placeholder:text-[#8A8F98]";

export const textareaCls =
  "w-full text-[15px] text-[#0E1B2C] bg-white border border-[#D6D1C4] rounded-[10px] px-3 py-2.5 outline-none resize-none placeholder:text-[#8A8F98]";

/** Etichetta + controllo. `group` quando dentro ci sono più controlli (niente <label> che li inglobi). */
export function Field({ label, children, className, hint, group }: {
  label: string; children: ReactNode; className?: string; hint?: string; group?: boolean;
}) {
  const cls = cn("flex flex-col gap-1.5 text-[13px] text-[#4A5566]", className);
  const body = (
    <>
      <span>{label}</span>
      {children}
      {hint && <span className="text-xs text-[#5F6878]">{hint}</span>}
    </>
  );
  return group
    ? <div role="group" aria-label={label} className={cls}>{body}</div>
    : <label className={cls}>{body}</label>;
}

/** Scelta singola a chip: un tocco invece di aprire un menu. */
export function ChipGroup({ label, options, value, onChange, className }: {
  label: string; options: readonly string[]; value: string; onChange: (v: string) => void; className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <span className="text-[13px] text-[#4A5566]">{label}</span>
      <div role="group" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = o === value;
          return (
            <button
              key={o}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? "" : o)}
              className={cn(
                "h-11 px-4 rounded-full border text-sm transition-colors",
                on
                  ? "bg-[#0E1B2C] border-[#0E1B2C] text-white font-semibold"
                  : "bg-white border-[#D6D1C4] text-[#0E1B2C] hover:border-[#0E1B2C]/40",
              )}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Selettore segmentato per 2–4 opzioni brevi. */
export function Segmented({ label, options, value, onChange, className }: {
  label?: string; options: readonly { value: string; label: string }[]; value: string;
  onChange: (v: string) => void; className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && <span className="text-[13px] text-[#4A5566]">{label}</span>}
      <div role="group" aria-label={label} className="flex bg-[#EEEBE3] rounded-[10px] p-[3px]">
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(o.value)}
              className={cn(
                "flex-1 h-10 px-3 rounded-lg text-sm whitespace-nowrap transition-colors",
                on ? "bg-white text-[#0E1B2C] font-semibold shadow-[0_1px_2px_rgba(14,27,44,0.12)]" : "text-[#4A5566] hover:text-[#0E1B2C]",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SectionCard({ title, children, action, className }: {
  title: string; children: ReactNode; action?: ReactNode; className?: string;
}) {
  return (
    <section className={cn("bg-white border border-[#E4E0D6] rounded-2xl p-5", className)}>
      <div className="flex items-baseline justify-between gap-3 mb-4">
        <h3 className="font-display text-[17px] font-bold text-[#0E1B2C]">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}
