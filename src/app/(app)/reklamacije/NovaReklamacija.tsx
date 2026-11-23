"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { novaReklamacija } from "@/app/actions/dokumenti";

export function NovaReklamacija({ ponude }: { ponude: { id: number; naziv: string }[] }) {
  const router = useRouter();
  const [otvoreno, setOtvoreno] = useState(false);
  const [ponudaId, setPonudaId] = useState<number | "">("");
  const [datum, setDatum] = useState(() => new Date().toISOString().slice(0, 10));
  const [opis, setOpis] = useState("");
  const [greska, setGreska] = useState("");
  const [radi, setRadi] = useState(false);

  const snimi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ponudaId) return setGreska("Izaberi ugovor (ponudu).");
    setRadi(true);
    setGreska("");
    try {
      const id = await novaReklamacija(ponudaId, opis, datum);
      router.push(`/reklamacije/${id}`);
    } catch (err) {
      setGreska(err instanceof Error ? err.message : "Čuvanje nije uspelo.");
      setRadi(false);
    }
  };

  return (
    <>
      <button type="button" className="btn-primary" onClick={() => setOtvoreno(true)}>
        <Plus size={16} /> Nova reklamacija
      </button>
      {otvoreno && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOtvoreno(false)}>
          <form onSubmit={snimi} className="card w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <h2 className="text-lg font-bold">Nova reklamacija</h2>
              <button type="button" onClick={() => setOtvoreno(false)} className="rounded p-1 hover:bg-background" aria-label="Zatvori">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4 p-6">
              {ponude.length === 0 ? (
                <p className="text-sm text-muted">Reklamacija se vezuje za potvrđenu ponudu, a trenutno ih nema.</p>
              ) : (
                <>
                  <div>
                    <label className="label">Ugovor (ponuda)</label>
                    <select className="input" value={ponudaId} onChange={(e) => setPonudaId(Number(e.target.value) || "")}>
                      <option value="">— izaberi —</option>
                      {ponude.map((p) => <option key={p.id} value={p.id}>{p.naziv}</option>)}
                    </select>
                  </div>
                  <div className="w-48">
                    <label className="label">Datum prijave</label>
                    <input type="date" className="input" value={datum} onChange={(e) => setDatum(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Opis reklamacije</label>
                    <textarea className="input min-h-28" placeholder="Šta je reklamirano, na kojoj poziciji, kako je primećeno…" value={opis} onChange={(e) => setOpis(e.target.value)} />
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-line px-6 py-4">
              {greska && <p className="mr-auto text-sm text-danger">{greska}</p>}
              <button type="button" className="btn-secondary" onClick={() => setOtvoreno(false)}>Otkaži</button>
              <button className="btn-primary" disabled={radi || ponude.length === 0}>Sačuvaj</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
