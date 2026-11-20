/** Mostrata subito al tocco, mentre la pagina arriva dal server: l'app risponde anche con poca rete. */
export default function CaricamentoMobile() {
  return (
    <div role="status" aria-label="Caricamento" className="animate-pulse">
      <div className="px-4 pt-[calc(14px+env(safe-area-inset-top))] pb-3">
        <div className="h-3 w-20 rounded bg-[#E4E0D6]" />
        <div className="h-8 w-56 max-w-[70%] rounded-lg bg-[#E4E0D6] mt-2.5" />
      </div>
      <div className="px-4 space-y-3">
        <div className="h-12 rounded-xl bg-[#EEEBE3]" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white border border-[#E4E0D6] rounded-2xl p-4 space-y-3">
            <div className="h-4 w-2/5 rounded bg-[#E4E0D6]" />
            <div className="h-3 w-4/5 rounded bg-[#EEEBE3]" />
            <div className="h-3 w-3/5 rounded bg-[#EEEBE3]" />
          </div>
        ))}
      </div>
    </div>
  );
}
