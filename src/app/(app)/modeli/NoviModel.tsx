"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import type { Cvor, Otvaranje } from "@/lib/modeli-katalog";
import { ModelCrtez } from "@/components/ModelCrtez";
import { sacuvajModel } from "@/app/actions/sifarnici";

export type ModelZaIzmenu = { sifra: string; naziv: string; kategorija: string; definicija: Cvor };

const OTVARANJA: { k: Otvaranje; n: string; vrata?: boolean }[] = [
  { k: "FIKS", n: "Fiksno" },
  { k: "ON_L", n: "Okretno-nagibno, šarke levo" },
  { k: "ON_D", n: "Okretno-nagibno, šarke desno" },
  { k: "O_L", n: "Samo okretno, šarke levo" },
  { k: "O_D", n: "Samo okretno, šarke desno" },
  { k: "KIP", n: "Samo kip" },
  { k: "PSK_L", n: "PSK klizno ulevo" },
  { k: "PSK_D", n: "PSK klizno udesno" },
  { k: "HST_L", n: "HST podizno-klizno ulevo" },
  { k: "HST_D", n: "HST podizno-klizno udesno" },
  { k: "VRATA_L", n: "Vrata, šarke levo", vrata: true },
  { k: "VRATA_D", n: "Vrata, šarke desno", vrata: true },
];

type Kolona = { otvaranje: Otvaranje; udeo: number };
type Konfig = {
  kolone: Kolona[];
  stulp: boolean; // važi kad su tačno 2 kolone
  nadsvetlo: "NEMA" | "GORE";
  nadsvetloDelova: number;
  nadsvetloUdeo: number; // udeo nadsvetla u odnosu na donji deo (1 : n)
};

/** Gradi stablo modela iz jednostavne konfiguracije. */
function izgradi(k: Konfig): Cvor {
  const polje = (o: Otvaranje): Cvor => ({ tip: "polje", otvaranje: o });
  const donji: Cvor =
    k.kolone.length === 1
      ? polje(k.kolone[0].otvaranje)
      : {
          tip: "podela",
          smer: "V",
          stulp: k.stulp && k.kolone.length === 2 ? true : undefined,
          delovi: k.kolone.map((c) => ({ udeo: c.udeo, sadrzaj: polje(c.otvaranje) })),
        };
  if (k.nadsvetlo === "NEMA") return donji;
  const gornji: Cvor =
    k.nadsvetloDelova <= 1
      ? polje("FIKS")
      : { tip: "podela", smer: "V", delovi: Array.from({ length: k.nadsvetloDelova }, () => ({ udeo: 1, sadrzaj: polje("FIKS") })) };
  return { tip: "podela", smer: "H", delovi: [{ udeo: 1, sadrzaj: gornji }, { udeo: k.nadsvetloUdeo, sadrzaj: donji }] };
}

/** Pokušava da vrati konfiguraciju iz postojećeg stabla (za izmenu). */
function rastavi(c: Cvor): Konfig | null {
  const kolone = (x: Cvor): { kolone: Kolona[]; stulp: boolean } | null => {
    if (x.tip === "polje") return { kolone: [{ otvaranje: x.otvaranje, udeo: 1 }], stulp: false };
    if (x.smer !== "V" || x.delovi.some((d) => d.sadrzaj.tip !== "polje")) return null;
    return {
      kolone: x.delovi.map((d) => ({ otvaranje: (d.sadrzaj as { otvaranje: Otvaranje }).otvaranje, udeo: d.udeo })),
      stulp: !!x.stulp,
    };
  };
  const bez = kolone(c);
  if (bez) return { ...bez, nadsvetlo: "NEMA", nadsvetloDelova: 1, nadsvetloUdeo: 3 };
  if (c.tip === "podela" && c.smer === "H" && c.delovi.length === 2) {
    const g = c.delovi[0].sadrzaj;
    const d = kolone(c.delovi[1].sadrzaj);
    const delova = g.tip === "polje" ? 1 : g.smer === "V" ? g.delovi.length : 0;
    if (d && delova) return { ...d, nadsvetlo: "GORE", nadsvetloDelova: delova, nadsvetloUdeo: c.delovi[1].udeo };
  }
  return null;
}

export function NoviModel({ pocetni, onZatvori }: { pocetni: ModelZaIzmenu | null; onZatvori: (sacuvano: boolean) => void }) {
  const [sifra, setSifra] = useState(pocetni?.sifra ?? "");
  const [naziv, setNaziv] = useState(pocetni?.naziv ?? "");
  const [kategorija, setKategorija] = useState(pocetni?.kategorija ?? "PROZOR");
  const [k, setK] = useState<Konfig>(
    () =>
      (pocetni && rastavi(pocetni.definicija)) ?? {
        kolone: [{ otvaranje: "ON_L", udeo: 1 }],
        stulp: false,
        nadsvetlo: "NEMA",
        nadsvetloDelova: 1,
        nadsvetloUdeo: 3,
      },
  );
  const [greska, setGreska] = useState("");
  const [radi, setRadi] = useState(false);

  const definicija = useMemo(() => izgradi(k), [k]);
  const vrata = kategorija === "VRATA";

  const kolona = (i: number, iz: Partial<Kolona>) => setK((s) => ({ ...s, kolone: s.kolone.map((c, j) => (j === i ? { ...c, ...iz } : c)) }));

  const snimi = async () => {
    setGreska("");
    setRadi(true);
    try {
      await sacuvajModel({ sifra, naziv, kategorija, definicija });
      onZatvori(true);
    } catch (e) {
      setGreska(e instanceof Error ? e.message : "Čuvanje nije uspelo.");
      setRadi(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => onZatvori(false)}>
      <div className="card flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-lg font-bold">{pocetni ? "Izmena modela" : "Novi model"}</h2>
          <button type="button" onClick={() => onZatvori(false)} className="rounded p-1 hover:bg-background" aria-label="Zatvori">
            <X size={18} />
          </button>
        </div>

        <div className="grid flex-1 gap-6 overflow-y-auto p-6 md:grid-cols-[1fr_260px]">
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="label">Šifra</label>
                <input className="input font-mono uppercase" placeholder="npr. M-DK-01" value={sifra} disabled={!!pocetni} onChange={(e) => setSifra(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Naziv</label>
                <input className="input" placeholder="npr. Dvokrilni sa kipom" value={naziv} onChange={(e) => setNaziv(e.target.value)} />
              </div>
              <div>
                <label className="label">Kategorija</label>
                <select className="input" value={kategorija} onChange={(e) => setKategorija(e.target.value)}>
                  <option value="PROZOR">Prozor</option>
                  <option value="VRATA">Vrata</option>
                </select>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="label !mb-0">Polja s leva na desno</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="btn-secondary !px-2 !py-1"
                    disabled={k.kolone.length <= 1}
                    onClick={() => setK((s) => ({ ...s, kolone: s.kolone.slice(0, -1) }))}
                    aria-label="Ukloni polje"
                  >
                    <Minus size={14} />
                  </button>
                  <button
                    type="button"
                    className="btn-secondary !px-2 !py-1"
                    disabled={k.kolone.length >= 6}
                    onClick={() => setK((s) => ({ ...s, kolone: [...s.kolone, { otvaranje: "FIKS", udeo: 1 }] }))}
                    aria-label="Dodaj polje"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {k.kolone.map((c, i) => (
                  <div key={i} className="grid grid-cols-[28px_1fr_90px] items-center gap-2">
                    <span className="text-center text-sm font-bold text-muted">{i + 1}</span>
                    <select className="input" value={c.otvaranje} onChange={(e) => kolona(i, { otvaranje: e.target.value as Otvaranje })}>
                      {OTVARANJA.filter((o) => vrata || !o.vrata).map((o) => (
                        <option key={o.k} value={o.k}>{o.n}</option>
                      ))}
                    </select>
                    <input
                      className="input text-center"
                      type="number"
                      min={1}
                      max={9}
                      title="Udeo širine"
                      value={c.udeo}
                      onChange={(e) => kolona(i, { udeo: Math.max(1, Number(e.target.value) || 1) })}
                    />
                  </div>
                ))}
              </div>
              <p className="mt-1 text-xs text-muted">Broj desno je udeo u širini (npr. 2 i 1 = prvo polje je duplo šire).</p>
              {k.kolone.length === 2 && (
                <label className="mt-3 flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={k.stulp} onChange={(e) => setK((s) => ({ ...s, stulp: e.target.checked }))} className="accent-[var(--brand)]" />
                  Štulp (dva krila bez stuba između)
                </label>
              )}
            </div>

            <div>
              <span className="label">Nadsvetlo</span>
              <div className="grid gap-3 sm:grid-cols-3">
                <select className="input" value={k.nadsvetlo} onChange={(e) => setK((s) => ({ ...s, nadsvetlo: e.target.value as Konfig["nadsvetlo"] }))}>
                  <option value="NEMA">Bez nadsvetla</option>
                  <option value="GORE">Fiksno nadsvetlo gore</option>
                </select>
                {k.nadsvetlo === "GORE" && (
                  <>
                    <label className="flex items-center gap-2 text-sm">
                      Delova
                      <input className="input" type="number" min={1} max={4} value={k.nadsvetloDelova} onChange={(e) => setK((s) => ({ ...s, nadsvetloDelova: Math.min(4, Math.max(1, Number(e.target.value) || 1)) }))} />
                    </label>
                    <label className="flex items-center gap-2 whitespace-nowrap text-sm">
                      Odnos 1 :
                      <input className="input" type="number" min={1} max={8} value={k.nadsvetloUdeo} onChange={(e) => setK((s) => ({ ...s, nadsvetloUdeo: Math.max(1, Number(e.target.value) || 1) }))} />
                    </label>
                  </>
                )}
              </div>
            </div>
          </div>

          <div>
            <span className="label">Pregled</span>
            <div className="flex aspect-[3/4] items-center justify-center rounded-lg bg-background p-5">
              <ModelCrtez definicija={definicija} sirina={vrata ? 1000 : 1200} visina={vrata ? 2100 : 1400} className="max-h-full max-w-full" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line px-6 py-4">
          {greska && <p className="mr-auto text-sm text-danger">{greska}</p>}
          <button type="button" className="btn-secondary" onClick={() => onZatvori(false)}>Otkaži</button>
          <button type="button" className="btn-primary" disabled={radi} onClick={snimi}>Sačuvaj model</button>
        </div>
      </div>
    </div>
  );
}
