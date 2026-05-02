"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";

export default function MaterialiActions({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    await fetch(`/api/materiali/${id}`, { method: "DELETE" });
    router.refresh();
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-2 justify-end">
        <span className="text-xs text-gray-500">Eliminare?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs text-white bg-red-600 hover:bg-red-700 px-2 py-1 rounded transition-colors disabled:opacity-50"
        >
          {loading ? "..." : "Sì"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 justify-end">
      <Link
        href={`/materiali/${id}/modifica`}
        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
        title="Modifica"
      >
        <Pencil size={14} />
      </Link>
      <button
        onClick={() => setConfirming(true)}
        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
        title="Elimina"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
