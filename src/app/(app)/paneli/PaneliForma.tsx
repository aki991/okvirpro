"use client";

import { useState } from "react";
import { ImagePlus, Plus, Trash2 } from "lucide-react";
import type { Panel } from "@prisma/client";
import { PageHeader } from "@/components/PageHeader";
import { SaveButton, sacuvaj, type SaveState } from "@/components/SaveBar";
import { sacuvajPanele } from "@/app/actions/sifarnici";
import { broj } from "@/lib/format";

type Red = { kljuc: string; id?: number; sifra: string; naziv: string; cena: string; slika: string | null };

let brojac = 0;

/** Jednostavna ilustracija panela kad nema slike. */
function PanelSkica({ seme }: { seme: string }) {
  const h = [...seme].reduce((a, c) => a + c.charCodeAt(0), 0);
  const varijanta = h % 3;
  return (
    <svg viewBox="0 0 60 120" className="h-full">
      <rect x="2" y="2" width="56" height="116" rx="2" fill="#3a4644" />
      {varijanta === 0 && [30, 48, 66, 84].map((y) => <rect key={y} x="14" y={y} width="32" height="10" rx="1" fill="#cfe4ea" />)}
      {varijanta === 1 && <rect x="26" y="20" width="8" height="80" rx="2" fill="#cfe4ea" />}
      {varijanta === 2 && <path d="M14 96 V40 a16 16 0 0 1 32 0 V96 Z" fill="#cfe4ea" />}
      <rect x="44" y="50" width="3" height="22" rx="1.5" fill="#c98a2b" />
    </svg>
  );
}

export function PaneliForma({ paneli }: { paneli: Panel[] }) {
  const [redovi, setRedovi] = useState<Red[]>(
    paneli.map((p) => ({ kljuc: `p${p.id}`, id: p.id, sifra: p.sifra, naziv: p.naziv, cena: String(p.cena), slika: p.slika })),
  );
  const [stanje, setStanje] = useState<SaveState>("idle");
  const [greska, setGreska] = useState("");

  const izmeni = (kljuc: string, iz: Partial<Red>) => setRedovi((r) => r.map((x) => (x.kljuc === kljuc ? { ...x, ...iz } : x)));

  const slika = (kljuc: string, file?: File) => {
    if (!file) return;
    const rd = new FileReader();
    rd.onload = () => izmeni(kljuc, { slika: rd.result as string });
    rd.readAsDataURL(file);
  };

  const snimi = () => {
    setGreska("");
    return sacuvaj(setStanje, async () => {
      try {
        await sacuvajPanele(redovi.map((r) => ({ id: r.id, sifra: r.sifra, naziv: r.naziv, cena: broj(r.cena) ?? 0, slika: r.slika })));
      } catch (e) {
        setGreska(e instanceof Error ? e.message : "Čuvanje nije uspelo.");
        throw e;
      }
    });
  };

  return (
    <>
      <PageHeader
        naslov="Paneli"
        opis="Dekorativni paneli za ulazna vrata – cene sa PDV-om"
        akcije={
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setRedovi((r) => [...r, { kljuc: `n${++brojac}`, sifra: "", naziv: "", cena: "", slika: null }])}
            >
              <Plus size={16} /> Dodaj panel
            </button>
            <SaveButton state={stanje} onClick={snimi} />
          </>
        }
      />
      <div className="p-4 sm:p-6 lg:p-8">
        {greska && <p className="mb-4 rounded-lg bg-danger/10 px-4 py-2 text-sm text-danger">{greska}</p>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {redovi.map((r) => (
            <div key={r.kljuc} className="card flex gap-4 p-4">
              <label className="group relative flex h-36 w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-background">
                {r.slika ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.slika} alt={r.naziv} className="h-full w-full object-contain" />
                ) : (
                  <PanelSkica seme={r.sifra || r.kljuc} />
                )}
                <span className="absolute inset-0 hidden items-center justify-center bg-black/40 text-white group-hover:flex">
                  <ImagePlus size={18} />
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => slika(r.kljuc, e.target.files?.[0])} />
              </label>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <input className="input !py-1.5 font-semibold" placeholder="Naziv" value={r.naziv} onChange={(e) => izmeni(r.kljuc, { naziv: e.target.value })} />
                <input className="input !py-1.5 font-mono text-xs uppercase" placeholder="Šifra" value={r.sifra} onChange={(e) => izmeni(r.kljuc, { sifra: e.target.value })} />
                <div className="mt-auto flex items-center gap-2">
                  <div className="relative flex-1">
                    <input className="input !py-1.5 pr-7 text-right font-semibold" inputMode="decimal" placeholder="0" value={r.cena} onChange={(e) => izmeni(r.kljuc, { cena: e.target.value })} />
                    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-muted">€</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRedovi((x) => x.filter((y) => y.kljuc !== r.kljuc))}
                    className="rounded-lg p-2 text-muted hover:bg-background hover:text-danger"
                    aria-label="Obriši panel"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
