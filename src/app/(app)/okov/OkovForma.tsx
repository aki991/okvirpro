"use client";

import { useState } from "react";
import type { OkovStavka } from "@prisma/client";
import { PageHeader } from "@/components/PageHeader";
import { SaveButton, sacuvaj, type SaveState } from "@/components/SaveBar";
import { sacuvajOkov } from "@/app/actions/sifarnici";
import { broj } from "@/lib/format";

const GRUPE = [
  { grupa: "PROZOR", naslov: "Prozorski okov (okretno-nagibni)", opis: "Elementi za standardno krilo. Stavke „po m“ množe se obimom ili visinom krila.", samoDetaljno: true },
  { grupa: "STULP", naslov: "Pomoćno krilo (štulp)", opis: "Dodatni elementi za dvokrilne prozore bez stuba.", samoDetaljno: true },
  { grupa: "PSK", naslov: "PSK klizni sistemi", opis: "Cena kompletnog PSK mehanizma za jedno klizno krilo.", samoDetaljno: false },
  { grupa: "VRATA", naslov: "Okov za vrata (glavno krilo)", opis: "Bravarija za ulazna i balkonska vrata.", samoDetaljno: false },
];

export function OkovForma({ metoda: m0, poM2: p0, stavke }: { metoda: string; poM2: number; stavke: OkovStavka[] }) {
  const [metoda, setMetoda] = useState(m0);
  const [poM2, setPoM2] = useState(String(p0));
  const [cene, setCene] = useState<Record<number, string>>(Object.fromEntries(stavke.map((s) => [s.id, String(s.cena)])));
  const [stanje, setStanje] = useState<SaveState>("idle");

  const snimi = () =>
    sacuvaj(setStanje, () =>
      sacuvajOkov(metoda, broj(poM2) ?? 0, stavke.map((s) => ({ id: s.id, cena: broj(cene[s.id]) ?? 0 }))),
    );

  return (
    <>
      <PageHeader naslov="Okov" opis="Nabavne cene okova i način obračuna" akcije={<SaveButton state={stanje} onClick={snimi} />} />
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <section className="card p-6">
          <h2 className="font-bold">Metoda obračuna za prozore</h2>
          <p className="mb-4 text-sm text-muted">Izaberi kako se računa cena okova za prozorske pozicije.</p>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { k: "DETALJNO", n: "Detaljno (po elementu)", o: "Zbir svih elemenata: uglovi, šarke, makaze, brava po metru… Najprecizniji obračun, posebno za vanstandardne visine." },
              { k: "PAUSALNO", n: "Paušalno (po m²)", o: "Jedna cena po m² krila. Brži unos ako okov dobijaš kao gotov set ili imaš paušalnu cenu dobavljača." },
            ].map((x) => (
              <label
                key={x.k}
                className={`cursor-pointer rounded-lg border p-4 transition ${metoda === x.k ? "border-brand bg-brand-soft/50 ring-2 ring-brand/15" : "border-line hover:bg-background"}`}
              >
                <span className="flex items-center gap-2 font-semibold">
                  <input type="radio" name="metoda" checked={metoda === x.k} onChange={() => setMetoda(x.k)} className="accent-[var(--brand)]" />
                  {x.n}
                </span>
                <span className="mt-1 block text-sm text-muted">{x.o}</span>
              </label>
            ))}
          </div>
          {metoda === "PAUSALNO" && (
            <div className="mt-4 w-64">
              <label className="label">Cena okova po m² krila (€)</label>
              <input className="input" inputMode="decimal" value={poM2} onChange={(e) => setPoM2(e.target.value)} />
            </div>
          )}
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          {GRUPE.map((g) => {
            const neaktivno = g.samoDetaljno && metoda === "PAUSALNO";
            return (
              <section key={g.grupa} className={`card p-6 ${neaktivno ? "opacity-50" : ""}`}>
                <h2 className="font-bold">{g.naslov}</h2>
                <p className="mb-4 text-sm text-muted">
                  {g.opis}
                  {neaktivno && " Ne koristi se uz paušalnu metodu."}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {stavke
                    .filter((s) => s.grupa === g.grupa)
                    .map((s) => (
                      <div key={s.id}>
                        <label className="label normal-case tracking-normal">
                          {s.naziv} <span className="text-muted/70">({s.poMetru ? "€/m" : "€/kom"})</span>
                        </label>
                        <input
                          className="input text-right"
                          inputMode="decimal"
                          value={cene[s.id]}
                          onChange={(e) => setCene((c) => ({ ...c, [s.id]: e.target.value }))}
                        />
                      </div>
                    ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
