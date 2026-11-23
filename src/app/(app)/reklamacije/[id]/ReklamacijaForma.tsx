"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { SaveButton, sacuvaj, type SaveState } from "@/components/SaveBar";
import { azurirajReklamaciju, obrisiReklamaciju } from "@/app/actions/dokumenti";

export function ReklamacijaForma({ id, opis: o0, status: s0, resenje: r0 }: { id: number; opis: string; status: string; resenje: string }) {
  const router = useRouter();
  const [opis, setOpis] = useState(o0);
  const [status, setStatus] = useState(s0);
  const [resenje, setResenje] = useState(r0);
  const [stanje, setStanje] = useState<SaveState>("idle");
  const [, start] = useTransition();

  return (
    <div className="no-print card mx-auto mb-6 max-w-4xl space-y-4 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <p className="mr-auto font-bold">Obrada reklamacije</p>
        <div className="inline-flex rounded-lg border border-line p-1">
          {[
            ["OTVORENO", "Otvoreno"],
            ["RESENO", "Rešeno"],
          ].map(([v, n]) => (
            <button
              key={v}
              type="button"
              onClick={() => setStatus(v)}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold ${status === v ? (v === "RESENO" ? "bg-success text-white" : "bg-accent text-white") : "text-muted"}`}
            >
              {n}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn-secondary text-danger"
          onClick={() => {
            if (!confirm("Obrisati reklamaciju?")) return;
            start(async () => {
              await obrisiReklamaciju(id);
              router.push("/reklamacije");
            });
          }}
        >
          <Trash2 size={15} /> Obriši
        </button>
        <SaveButton state={stanje} onClick={() => sacuvaj(setStanje, () => azurirajReklamaciju(id, { opis, status, resenje }))} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="label">Opis reklamacije</label>
          <textarea className="input min-h-28" value={opis} onChange={(e) => setOpis(e.target.value)} />
        </div>
        <div>
          <label className="label">Nalaz i rešenje</label>
          <textarea className="input min-h-28" placeholder="Utvrđeno stanje, preduzete mere, rok otklanjanja…" value={resenje} onChange={(e) => setResenje(e.target.value)} />
        </div>
      </div>
    </div>
  );
}
