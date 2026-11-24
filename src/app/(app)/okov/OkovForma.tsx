"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Plus, Trash2 } from "lucide-react";
import type { OkovSistem, OkovStavka } from "@prisma/client";
import { PageHeader } from "@/components/PageHeader";
import { SaveButton, sacuvaj, type SaveState } from "@/components/SaveBar";
import { dodajOkovSistem, obrisiOkovSistem, sacuvajOkovSistem } from "@/app/actions/sifarnici";
import { broj } from "@/lib/format";

const GRUPE = [
  { grupa: "PROZOR", naslov: "Prozorski okov (okretno-nagibni)", opis: "Elementi za standardno krilo. Stavke „po m“ množe se obimom ili visinom krila.", samoDetaljno: true },
  { grupa: "KIP", naslov: "Kip krilo (nadsvetlo)", opis: "Dodatni elementi za krilo koje se otvara samo na kip (ostalo se uzima iz prozorskog okova).", samoDetaljno: true },
  { grupa: "STULP", naslov: "Pomoćno krilo (štulp)", opis: "Dodatni elementi za dvokrilne prozore bez stuba.", samoDetaljno: true },
  { grupa: "PSK", naslov: "PSK klizni sistemi", opis: "Cena kompletnog PSK mehanizma za jedno klizno krilo.", samoDetaljno: false },
  { grupa: "VRATA", naslov: "Okov za vrata (glavno krilo)", opis: "Bravarija za ulazna i balkonska vrata.", samoDetaljno: false },
];

type Sistem = OkovSistem & { stavke: OkovStavka[]; profilSistemi: { naziv: string; tip: string }[] };

export function OkovForma({ sistemi }: { sistemi: Sistem[] }) {
  const router = useRouter();
  const [izabran, setIzabran] = useState(sistemi[0]?.id ?? 0);
  const [radi, start] = useTransition();
  const sistem = sistemi.find((s) => s.id === izabran) ?? sistemi[0];

  const novi = (kopija: boolean) => {
    const naziv = prompt(kopija ? `Naziv kopije sistema „${sistem?.naziv}“:` : "Naziv novog okovnog sistema (npr. „Maco PVC osa 13“):", kopija ? `${sistem?.naziv} (kopija)` : "");
    if (naziv === null) return;
    start(async () => {
      const id = await dodajOkovSistem(naziv, kopija ? sistem?.id ?? null : null);
      setIzabran(id);
      router.refresh();
    });
  };

  return (
    <>
      <PageHeader
        naslov="Okov"
        opis="Okovni sistemi, nabavne cene i način obračuna"
        akcije={
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" disabled={radi || !sistem} onClick={() => novi(true)}>
              <Copy size={15} /> Kopiraj
            </button>
            <button type="button" className="btn-secondary" disabled={radi} onClick={() => novi(false)}>
              <Plus size={15} /> Novi okovni sistem
            </button>
          </div>
        }
      />
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <section className="card p-4">
          <div className="flex flex-wrap gap-2">
            {sistemi.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setIzabran(s.id)}
                className={`rounded-lg border px-4 py-2 text-left text-sm transition ${s.id === sistem?.id ? "border-brand bg-brand-soft/50 ring-2 ring-brand/15" : "border-line hover:bg-background"}`}
              >
                <span className="block font-semibold">{s.naziv}</span>
                <span className="block text-xs text-muted">
                  {s.profilSistemi.length ? s.profilSistemi.map((p) => p.naziv).join(", ") : "Ne koristi ga nijedan profil"}
                </span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">
            Okovni sistem je komplet okova jednog proizvođača ili varijante (npr. PVC okov osa 13, ALU okov). Svakom profilnom sistemu se na stranici
            Profili bira koji okov koristi, pa više profila može deliti isti okov.
          </p>
        </section>

        {sistem && <SistemOkova key={sistem.id} sistem={sistem} jedini={sistemi.length === 1} onObrisan={() => setIzabran(sistemi.find((s) => s.id !== sistem.id)?.id ?? 0)} />}
      </div>
    </>
  );
}

function SistemOkova({ sistem, jedini, onObrisan }: { sistem: Sistem; jedini: boolean; onObrisan: () => void }) {
  const [naziv, setNaziv] = useState(sistem.naziv);
  const [metoda, setMetoda] = useState(sistem.metoda);
  const [poM2, setPoM2] = useState(String(sistem.poM2));
  const [stavke, setStavke] = useState<Record<number, { naziv: string; cena: string }>>(
    Object.fromEntries(sistem.stavke.map((s) => [s.id, { naziv: s.naziv, cena: String(s.cena) }])),
  );
  const [stanje, setStanje] = useState<SaveState>("idle");
  const [radi, start] = useTransition();

  const snimi = () =>
    sacuvaj(setStanje, () =>
      sacuvajOkovSistem(
        sistem.id,
        { naziv, metoda, poM2: broj(poM2) ?? 0 },
        sistem.stavke.map((s) => ({ id: s.id, naziv: stavke[s.id].naziv, cena: broj(stavke[s.id].cena) ?? 0 })),
      ),
    );

  const obrisi = () => {
    if (!confirm(`Obrisati okovni sistem „${sistem.naziv}“? Profili koji ga koriste prelaze na prvi okovni sistem.`)) return;
    start(async () => {
      try {
        await obrisiOkovSistem(sistem.id);
        onObrisan();
      } catch (e) {
        alert(e instanceof Error ? e.message : "Brisanje nije uspelo.");
      }
    });
  };

  const izmeni = (id: number, polje: "naziv" | "cena", v: string) => setStavke((x) => ({ ...x, [id]: { ...x[id], [polje]: v } }));

  return (
    <>
      <section className="card p-6">
        <div className="mb-5 flex flex-wrap items-end gap-3">
          <div className="w-full sm:w-80">
            <label className="label">Naziv okovnog sistema</label>
            <input className="input" value={naziv} onChange={(e) => setNaziv(e.target.value)} />
          </div>
          <div className="flex-1" />
          <button type="button" onClick={obrisi} className="btn-secondary text-danger" disabled={radi || jedini} title={jedini ? "Mora postojati bar jedan okovni sistem" : undefined}>
            <Trash2 size={15} /> Obriši
          </button>
          <SaveButton state={stanje} onClick={snimi} />
        </div>

        <h2 className="font-bold">Metoda obračuna za prozore</h2>
        <p className="mb-4 text-sm text-muted">Izaberi kako se računa cena okova za prozorska krila ovog sistema.</p>
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
                <input type="radio" name={`metoda-${sistem.id}`} checked={metoda === x.k} onChange={() => setMetoda(x.k)} className="accent-[var(--brand)]" />
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
          const lista = sistem.stavke.filter((s) => s.grupa === g.grupa);
          if (!lista.length) return null;
          return (
            <section key={g.grupa} className={`card p-6 ${neaktivno ? "opacity-50" : ""}`}>
              <h2 className="font-bold">{g.naslov}</h2>
              <p className="mb-4 text-sm text-muted">
                {g.opis}
                {neaktivno && " Ne koristi se uz paušalnu metodu."}
              </p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                    <th className="py-2 pr-3 text-left font-semibold">Naziv artikla</th>
                    <th className="w-36 px-2 py-2 font-semibold">Cena</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((s) => (
                    <tr key={s.id} className="border-b border-line/60 last:border-0">
                      <td className="py-1.5 pr-3">
                        <input className="input !py-1.5" value={stavke[s.id].naziv} onChange={(e) => izmeni(s.id, "naziv", e.target.value)} />
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <input className="input !py-1.5 text-center font-semibold" inputMode="decimal" value={stavke[s.id].cena} onChange={(e) => izmeni(s.id, "cena", e.target.value)} />
                          <span className="whitespace-nowrap text-xs text-muted">{s.poMetru ? "€/m" : "€/kom"}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          );
        })}
      </div>
    </>
  );
}
