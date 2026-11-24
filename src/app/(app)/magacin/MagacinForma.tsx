"use client";

import { useState } from "react";
import { AlertTriangle, Info, Plus, X } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { SaveButton, sacuvaj, type SaveState } from "@/components/SaveBar";
import { sacuvajMagacin } from "@/app/actions/magacin";
import { broj } from "@/lib/format";
import { MIN_OSTATAK } from "@/lib/krojenje";

type Stavka = { id: number; naziv: string; duzinaSipke: number; puneSipke: number; ostaci: { id?: number; duzina: number }[] };
type Sistem = { id: number; naziv: string; tip: string; stavke: Stavka[] };

export function MagacinForma({ sistemi }: { sistemi: Sistem[] }) {
  const [stanje, setStanje] = useState<Record<number, { pune: string; ostaci: { id?: number; duzina: number }[]; novi: string }>>(() =>
    Object.fromEntries(sistemi.flatMap((s) => s.stavke).map((p) => [p.id, { pune: String(p.puneSipke), ostaci: p.ostaci, novi: "" }])),
  );
  const [cuvanje, setCuvanje] = useState<SaveState>("idle");

  const izmeni = (id: number, iz: Partial<(typeof stanje)[number]>) => setStanje((s) => ({ ...s, [id]: { ...s[id], ...iz } }));

  const dodajOstatak = (id: number, duzinaSipke: number) => {
    const d = broj(stanje[id].novi);
    if (!d || d <= 0) return;
    if (d > duzinaSipke) return alert(`Ostatak ne može biti duži od šipke (${duzinaSipke} mm).`);
    izmeni(id, { ostaci: [...stanje[id].ostaci, { duzina: Math.round(d) }].sort((a, b) => b.duzina - a.duzina), novi: "" });
  };

  const snimi = () =>
    sacuvaj(setCuvanje, () =>
      sacuvajMagacin(
        Object.entries(stanje).map(([id, v]) => ({ profilStavkaId: Number(id), puneSipke: broj(v.pune) ?? 0, ostaci: v.ostaci })),
      ),
    );

  return (
    <>
      <PageHeader naslov="Magacin profila" opis="Stanje celih šipki i upotrebljivih ostataka" akcije={<SaveButton state={cuvanje} onClick={snimi} label="Sačuvaj stanje" />} />
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        {sistemi.map((s) => (
          <section key={s.id} className="card overflow-x-auto">
            <div className="flex items-center gap-2 border-b border-line bg-background px-5 py-3">
              <p className="font-bold">{s.naziv}</p>
              <span className="rounded bg-brand-soft px-1.5 py-0.5 text-[10px] font-bold text-brand">{s.tip}</span>
            </div>
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-2 text-left font-semibold">Profil</th>
                  <th className="px-3 py-2 font-semibold">Šipka</th>
                  <th className="w-32 px-3 py-2 font-semibold">Pune šipke</th>
                  <th className="px-3 py-2 font-semibold">Ostaci (&gt;{MIN_OSTATAK} mm)</th>
                </tr>
              </thead>
              <tbody>
                {s.stavke.map((p) => {
                  const v = stanje[p.id];
                  const negativno = (broj(v.pune) ?? 0) < 0;
                  return (
                    <tr key={p.id} className="border-b border-line/60 align-top last:border-0">
                      <td className="px-5 py-2.5 text-left font-medium">{p.naziv}</td>
                      <td className="px-3 py-2.5 tabular-nums text-muted">{p.duzinaSipke}</td>
                      <td className="px-3 py-2">
                        <input
                          className={`input !py-1.5 text-center font-semibold ${negativno ? "!border-danger text-danger" : ""}`}
                          inputMode="numeric"
                          value={v.pune}
                          onChange={(e) => izmeni(p.id, { pune: e.target.value })}
                        />
                        {negativno && (
                          <p className="mt-1 flex items-center gap-1 text-[11px] text-danger">
                            <AlertTriangle size={11} /> Nedostaje – poruči
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                          {v.ostaci.length === 0 && <span className="text-xs text-muted">Nema ostataka</span>}
                          {v.ostaci.map((o, i) => (
                            <span key={o.id ?? `n${i}`} className="inline-flex items-center gap-1 rounded-md bg-accent-soft px-2 py-0.5 font-mono text-xs font-semibold text-accent">
                              {o.duzina} mm
                              <button
                                type="button"
                                onClick={() => izmeni(p.id, { ostaci: v.ostaci.filter((_, j) => j !== i) })}
                                className="rounded hover:bg-white/60"
                                aria-label="Ukloni ostatak"
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                          <form
                            className="flex items-center gap-1"
                            onSubmit={(e) => {
                              e.preventDefault();
                              dodajOstatak(p.id, p.duzinaSipke);
                            }}
                          >
                            <input
                              className="input !w-24 !py-1 text-xs"
                              placeholder="mm"
                              inputMode="numeric"
                              value={v.novi}
                              onChange={(e) => izmeni(p.id, { novi: e.target.value })}
                            />
                            <button className="rounded-md border border-line p-1 text-muted hover:bg-background hover:text-brand" aria-label="Dodaj ostatak">
                              <Plus size={14} />
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        ))}

        <div className="card flex gap-3 bg-brand-soft/50 p-5 text-sm leading-relaxed">
          <Info size={18} className="mt-0.5 shrink-0 text-brand" />
          <div className="text-muted">
            <p><b className="text-foreground">Automatsko umanjenje:</b> kad proknjižiš krojnu listu, utrošene cele šipke i ostaci se skidaju iz magacina.</p>
            <p><b className="text-foreground">Upotreba ostataka:</b> optimizacija prvo koristi ostatke duže od {MIN_OSTATAK} mm, pa tek onda nove šipke.</p>
            <p><b className="text-foreground">Savet:</b> ažuriraj stanje šipki posle svakog prijema robe od dobavljača.</p>
          </div>
        </div>
      </div>
    </>
  );
}
