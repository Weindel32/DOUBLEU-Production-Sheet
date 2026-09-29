"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { inputCls } from "@/components/ui/Form";

export default function LoginForm({ next }: { next: string }) {
  const [utente, setUtente] = useState("");
  const [password, setPassword] = useState("");
  const [mostra, setMostra] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [invio, setInvio] = useState(false);

  const accedi = async (e: React.FormEvent) => {
    e.preventDefault();
    setInvio(true);
    setErrore(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ utente, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrore(body.error || "Accesso non riuscito");
        setInvio(false);
        return;
      }
      // Navigazione completa: la pagina successiva parte già con il cookie di sessione.
      window.location.href = next;
    } catch {
      setErrore("Connessione non riuscita. Riprova.");
      setInvio(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F6F4EF] flex items-center justify-center p-6">
      <div className="w-full max-w-[420px]">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#0E1B2C] text-[#F6F4EF] flex items-center justify-center font-display font-extrabold text-2xl mb-5">DU</div>
          <h1 className="font-display text-[28px] font-extrabold tracking-[0.14em] uppercase text-[#0E1B2C] leading-none">Doubleu</h1>
          <p className="text-[11px] tracking-[0.28em] uppercase text-[#5F6878] mt-2">Production Sheet</p>
        </div>

        <form onSubmit={accedi} className="bg-white border border-[#E4E0D6] rounded-2xl p-7 space-y-5 shadow-[0_12px_40px_rgba(14,27,44,0.08)]">
          <div>
            <h2 className="font-display text-xl font-bold text-[#0E1B2C]">Accedi</h2>
            <p className="text-sm text-[#5F6878] mt-1">Resti connesso su questo dispositivo per 30 giorni.</p>
          </div>

          <label className="flex flex-col gap-1.5 text-[13px] text-[#4A5566]">
            Utente
            <input type="text" name="username" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false}
              required autoFocus value={utente} onChange={(e) => setUtente(e.target.value)} className={`${inputCls} h-12`} />
          </label>

          <div className="flex flex-col gap-1.5 text-[13px] text-[#4A5566]">
            <label htmlFor="password">Password</label>
            <span className="relative">
              <input id="password" type={mostra ? "text" : "password"} name="password" autoComplete="current-password" required
                value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputCls} h-12 pr-12`} />
              <button type="button" onClick={() => setMostra((m) => !m)} aria-label={mostra ? "Nascondi password" : "Mostra password"}
                className="absolute right-1 top-1 w-10 h-10 rounded-lg text-[#5F6878] hover:text-[#0E1B2C] flex items-center justify-center">
                {mostra ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </div>

          {errore && (
            <p role="alert" className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-[10px] px-3 py-2">{errore}</p>
          )}

          <button type="submit" disabled={invio || !utente || !password}
            className="w-full h-12 rounded-xl bg-[#0E1B2C] hover:bg-[#1F3A68] text-white text-[15px] font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
            {invio ? <Loader2 size={18} className="animate-spin" /> : <>Entra <ArrowRight size={18} /></>}
          </button>
        </form>

        <p className="text-center text-xs text-[#5F6878] mt-6">Double U · Handcrafted in Italy</p>
      </div>
    </main>
  );
}
