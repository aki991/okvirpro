"use client";

import { useState } from "react";
import { SaveButton, sacuvaj, type SaveState } from "@/components/SaveBar";
import { sacuvajRacun } from "@/app/actions/dokumenti";

export function RacunForma({ id, bezPdv, datum, valutaDana }: { id: number; bezPdv: boolean; datum: string; valutaDana: number }) {
  const [b, setB] = useState(bezPdv);
  const [d, setD] = useState(datum);
  const [v, setV] = useState(String(valutaDana));
  const [stanje, setStanje] = useState<SaveState>("idle");

  return (
    <div className="no-print card mx-auto mb-6 flex max-w-4xl flex-wrap items-end gap-4 p-5">
      <div className="mr-auto">
        <p className="font-bold">Poreski status računa</p>
        <p className="text-sm text-muted">Izaberi da li je račun sa PDV-om ili je promet oslobođen PDV-a.</p>
        <div className="mt-2 inline-flex rounded-lg border border-line p-1">
          {[
            [false, "PDV"],
            [true, "Bez PDV-a (čl. 33)"],
          ].map(([val, n]) => (
            <button
              key={String(val)}
              type="button"
              onClick={() => setB(val as boolean)}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold ${b === val ? "bg-brand text-white" : "text-muted"}`}
            >
              {n as string}
            </button>
          ))}
        </div>
      </div>
      <div className="w-44">
        <label className="label">Datum izdavanja</label>
        <input type="date" className="input" value={d} onChange={(e) => setD(e.target.value)} />
      </div>
      <div className="w-32">
        <label className="label">Valuta (dana)</label>
        <input className="input" inputMode="numeric" value={v} onChange={(e) => setV(e.target.value)} />
      </div>
      <SaveButton state={stanje} onClick={() => sacuvaj(setStanje, () => sacuvajRacun(id, { bezPdv: b, datum: d, valutaDana: Number(v) || 0 }))} />
    </div>
  );
}
