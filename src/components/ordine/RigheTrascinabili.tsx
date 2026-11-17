"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { GripVertical } from "lucide-react";
import {
  DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@/lib/dndAsse";

export interface RigaTrascinabile {
  id: string;
  /** Stato per il filtro dei chip (data-stato). */
  stato?: string;
  nome: string;
  /** Celle della riga rese dal server, senza la maniglia. */
  celle: ReactNode;
}

function Riga({ riga }: { riga: RigaTrascinabile }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: riga.id });
  return (
    <tr ref={setNodeRef} data-stato={riga.stato}
      style={{ transform: transform ? `translate3d(0, ${Math.round(transform.y)}px, 0)` : undefined, transition }}
      className={`border-b border-[#EFEBE2] last:border-0 ${isDragging ? "relative z-10 bg-white shadow-[0_8px_24px_rgba(14,27,44,0.16)]" : ""}`}>
      <td className="pl-1.5 py-2.5">
        <button type="button" ref={setActivatorNodeRef} {...attributes} {...listeners} aria-label={`Sposta ${riga.nome}`}
          title="Trascina per cambiare la priorità di produzione"
          className="w-7 h-11 rounded-md flex items-center justify-center text-[#B5AE9F] hover:text-[#0E1B2C] hover:bg-[#F6F4EF] cursor-grab active:cursor-grabbing touch-none">
          <GripVertical size={18} />
        </button>
      </td>
      {riga.celle}
    </tr>
  );
}

/**
 * Righe delle schede di un ordine, ordinabili trascinando la maniglia (mouse, tocco su iPad, tastiera).
 * L'ordine si salva subito ed è solo della Production Sheet: è la priorità di produzione, l'Order App non cambia.
 */
export default function RigheTrascinabili({ ordineId, righe }: { ordineId: string; righe: RigaTrascinabile[] }) {
  const router = useRouter();
  // Id stabile tra server e browser: senza, dnd-kit ne genera uno diverso e React segnala un errore di idratazione.
  const dndId = useId();
  const firma = righe.map((r) => r.id).join(",");
  const [ordine, setOrdine] = useState(() => righe.map((r) => r.id));
  const [errore, setErrore] = useState<string | null>(null);
  // Le istruzioni per i lettori di schermo di dnd-kit sono <div>: dentro una tabella sarebbero HTML non valido.
  // Si attiva dopo il caricamento e le mette in fondo alla pagina; prima le righe si vedono già, ferme.
  const [contenitore, setContenitore] = useState<HTMLElement | null>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setContenitore(document.body), []);
  // Dopo un salvataggio (o un cambio fatto altrove) il server rimanda le righe: si riparte da quelle.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setOrdine(firma ? firma.split(",") : []), [firma]);

  const sensori = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const fine = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const prima = ordine;
    const dopo = arrayMove(ordine, ordine.indexOf(String(active.id)), ordine.indexOf(String(over.id)));
    setOrdine(dopo);
    setErrore(null);
    const res = await fetch(`/api/ordini/${encodeURIComponent(ordineId)}/ordine-schede`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: dopo }),
    }).catch(() => null);
    if (!res?.ok) { setOrdine(prima); setErrore("Ordine non salvato: riprova"); return; }
    router.refresh();
  };

  const perId = new Map(righe.map((r) => [r.id, r]));
  const visibili = ordine.map((id) => perId.get(id)).filter((r): r is RigaTrascinabile => !!r);

  const corpo = (
    <tbody>
      {visibili.map((r) => <Riga key={r.id} riga={r} />)}
      {errore && (
        <tr><td colSpan={99} role="alert" className="px-5 py-2.5 text-sm text-red-700 bg-red-50">{errore}</td></tr>
      )}
    </tbody>
  );
  if (!contenitore) return <SortableContext items={visibili.map((r) => r.id)}>{corpo}</SortableContext>;
  return (
    <DndContext id={dndId} sensors={sensori} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragEnd={fine}
      accessibility={{ container: contenitore }}>
      <SortableContext items={visibili.map((r) => r.id)} strategy={verticalListSortingStrategy}>
        {corpo}
      </SortableContext>
    </DndContext>
  );
}
