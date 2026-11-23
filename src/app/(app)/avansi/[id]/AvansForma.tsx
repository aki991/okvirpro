"use client";

import { useState } from "react";
import { SaveButton, sacuvaj, type SaveState } from "@/components/SaveBar";
import { sacuvajAvans } from "@/app/actions/dokumenti";
import { broj, eur } from "@/lib/format";

export function AvansForma({ id, avans, datum, ukupno }: { id: number; avans: number | null; datum: string; ukupno: number }) {
  const [iznos, setIznos] = useState(avans === null ? "" : String(avans));
  const [d, setD] = useState(datum);
  const [stanje, setStanje] = useState<SaveState>("idle");
  const n = broj(iznos);
  const procenat = n && ukupno ? (n / ukupno) * 100 : 0;

  return (
    <div className="no-print card mx-auto mb-6 flex max-w-4xl flex-wrap items-end gap-4 p-5">
      <div>
        <p className="font-bold">Podešavanje avansa</p>
        <p className="text-sm text-muted">Unesi iznos kapare u EUR. Ukupna vrednost ugovora je {eur(ukupno)}.</p>
      </div>
      <div className="flex-1" />
      <div className="w-40">
        <label className="label">Iznos avansa (€)</label>
        <input className="input text-right font-semibold" inputMode="decimal" value={iznos} onChange={(e) => setIznos(e.target.value)} />
      </div>
      <div className="w-44">
        <label className="label">Datum ugovora</label>
        <input type="date" className="input" value={d} onChange={(e) => setD(e.target.value)} />
      </div>
      <div className="flex w-20 flex-col items-center pb-2 text-sm">
        <span className="text-xs text-muted">udeo</span>
        <b>{procenat.toFixed(0)}%</b>
      </div>
      <SaveButton state={stanje} onClick={() => sacuvaj(setStanje, () => sacuvajAvans(id, n, d))} />
    </div>
  );
}
