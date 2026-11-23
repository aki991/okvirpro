"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Trash2 } from "lucide-react";
import type { ProfilSistem, ProfilStavka } from "@prisma/client";
import { SaveButton, sacuvaj, type SaveState } from "@/components/SaveBar";
import { obrisiSistem, pomeriSistem, sacuvajSistem } from "@/app/actions/sifarnici";
import { broj } from "@/lib/format";

type Polja = "duzinaSipke" | "unutrasnjaVisina" | "sirinaOdbitak" | "cena";
// Koje kolone ima smisla popunjavati za koju stavku
const KOLONE: Record<string, Polja[]> = {
  RAM: ["duzinaSipke", "unutrasnjaVisina", "cena"],
  KRILO_PROZORA: ["duzinaSipke", "unutrasnjaVisina", "cena"],
  KRILO_VRATA: ["duzinaSipke", "unutrasnjaVisina", "cena"],
  CELIK_RAMA: ["duzinaSipke", "cena"],
  CELIK_KRILA: ["duzinaSipke", "cena"],
  CELIK_KRILA_VRATA: ["duzinaSipke", "cena"],
  LAJSNA: ["duzinaSipke", "cena"],
  PRECKA: ["duzinaSipke", "sirinaOdbitak", "cena"],
  LAZNA_PRECKA: ["duzinaSipke", "sirinaOdbitak", "cena"],
  PRAG: ["duzinaSipke", "unutrasnjaVisina", "cena"],
  PROSIRENJE: ["duzinaSipke", "unutrasnjaVisina", "cena"],
  PODSTOK: ["duzinaSipke", "unutrasnjaVisina", "cena"],
  SPOJNICA_PRECKE: ["cena"],
  POKLOPAC_STULPA: ["cena"],
};

const str = (n: number | null) => (n === null || n === undefined ? "" : String(n));

export function SistemKartica({
  sistem,
  prvi,
  poslednji,
}: {
  sistem: ProfilSistem & { stavke: ProfilStavka[] };
  prvi: boolean;
  poslednji: boolean;
}) {
  const [otvoreno, setOtvoreno] = useState(false);
  const [naziv, setNaziv] = useState(sistem.naziv);
  const [vrednosti, setVrednosti] = useState(() =>
    Object.fromEntries(
      sistem.stavke.map((s) => [
        s.id,
        { duzinaSipke: str(s.duzinaSipke), unutrasnjaVisina: str(s.unutrasnjaVisina), sirinaOdbitak: str(s.sirinaOdbitak), cena: str(s.cena) },
      ]),
    ) as Record<number, Record<Polja, string>>,
  );
  const [stanje, setStanje] = useState<SaveState>("idle");
  const [radi, start] = useTransition();

  const snimi = () =>
    sacuvaj(setStanje, () =>
      sacuvajSistem(
        sistem.id,
        naziv,
        sistem.stavke.map((s) => ({
          id: s.id,
          duzinaSipke: broj(vrednosti[s.id].duzinaSipke),
          unutrasnjaVisina: broj(vrednosti[s.id].unutrasnjaVisina),
          sirinaOdbitak: broj(vrednosti[s.id].sirinaOdbitak),
          cena: broj(vrednosti[s.id].cena) ?? 0,
        })),
      ),
    );

  const obrisi = () => {
    if (!confirm(`Obrisati sistem „${sistem.naziv}“ sa svim stavkama i stanjem u magacinu?`)) return;
    start(async () => {
      try {
        await obrisiSistem(sistem.id);
      } catch (e) {
        alert(e instanceof Error ? e.message : "Brisanje nije uspelo.");
      }
    });
  };

  return (
    <div className="overflow-hidden rounded-lg border border-line">
      <div className="flex items-center gap-2 bg-background px-4 py-3">
        <button type="button" onClick={() => setOtvoreno((o) => !o)} className="flex flex-1 items-center gap-2 text-left font-semibold">
          <ChevronDown size={17} className={`transition ${otvoreno ? "rotate-180" : ""}`} />
          {sistem.naziv}
          <span className="rounded bg-brand-soft px-1.5 py-0.5 text-[10px] font-bold text-brand">{sistem.tip}</span>
        </button>
        <button type="button" disabled={prvi || radi} onClick={() => start(() => pomeriSistem(sistem.id, -1))} className="rounded p-1.5 text-muted hover:bg-white disabled:opacity-30" aria-label="Pomeri gore">
          <ArrowUp size={15} />
        </button>
        <button type="button" disabled={poslednji || radi} onClick={() => start(() => pomeriSistem(sistem.id, 1))} className="rounded p-1.5 text-muted hover:bg-white disabled:opacity-30" aria-label="Pomeri dole">
          <ArrowDown size={15} />
        </button>
      </div>

      {otvoreno && (
        <div className="p-4">
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div className="w-full sm:w-72">
              <label className="label">Naziv sistema</label>
              <input className="input" value={naziv} onChange={(e) => setNaziv(e.target.value)} />
            </div>
            <div className="flex-1" />
            <button type="button" onClick={obrisi} className="btn-secondary text-danger" disabled={radi}>
              <Trash2 size={15} /> Obriši sistem
            </button>
            <SaveButton state={stanje} onClick={snimi} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th className="py-2 pr-3 font-semibold">Stavka</th>
                  <th className="px-2 py-2 font-semibold">Dužina (mm)</th>
                  <th className="px-2 py-2 font-semibold">Unutrašnja v. (mm)</th>
                  <th className="px-2 py-2 font-semibold">Širina/odbitak (mm)</th>
                  <th className="px-2 py-2 text-right font-semibold">Cena (€/m ili kom)</th>
                </tr>
              </thead>
              <tbody>
                {sistem.stavke.map((s) => {
                  const dozvoljeno = KOLONE[s.kljuc] ?? ["duzinaSipke", "unutrasnjaVisina", "sirinaOdbitak", "cena"];
                  const celija = (p: Polja, desno = false) => (
                    <td className="px-2 py-1.5">
                      {dozvoljeno.includes(p) ? (
                        <input
                          className={`input !py-1.5 ${desno ? "text-right font-semibold" : ""}`}
                          inputMode="decimal"
                          value={vrednosti[s.id][p]}
                          onChange={(e) => setVrednosti((v) => ({ ...v, [s.id]: { ...v[s.id], [p]: e.target.value } }))}
                        />
                      ) : (
                        <span className="block text-center text-muted">–</span>
                      )}
                    </td>
                  );
                  return (
                    <tr key={s.id} className="border-b border-line/60 last:border-0">
                      <td className="py-1.5 pr-3 font-medium">
                        {s.naziv}
                        {s.poKomadu && <span className="ml-1 text-xs text-muted">(kom)</span>}
                      </td>
                      {celija("duzinaSipke")}
                      {celija("unutrasnjaVisina")}
                      {celija("sirinaOdbitak")}
                      {celija("cena", true)}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
