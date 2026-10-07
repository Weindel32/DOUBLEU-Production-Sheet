/** Pallino del colore; senza colore assegnato è tratteggiato. */
export default function Pallino({ hex, size = 18 }: { hex: string | null; size?: number }) {
  return (
    <span aria-hidden className={`inline-block rounded-full flex-shrink-0 border ${hex ? "border-black/15" : "border-dashed border-[#9AA3B2]"}`}
      style={{ width: size, height: size, backgroundColor: hex ?? "transparent" }} />
  );
}
