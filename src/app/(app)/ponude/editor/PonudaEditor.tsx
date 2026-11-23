"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus, Save } from "lucide-react";
import { izracunaj, zbir, type Kontekst, type Opcije } from "@/lib/proracun";
import { eur } from "@/lib/format";
import { sacuvajPonudu } from "@/app/actions/ponude";
import { KlijentPolja, prazanKlijent } from "@/app/(app)/klijenti/KlijentForma";
import type { KlijentUnos } from "@/app/actions/klijenti";
import { StavkaKartica } from "./StavkaKartica";
import { novaStavka, noviKljuc, uUlaz, type StavkaForma } from "./tipovi";

export type PonudaPocetno = {
  id: number | null;
  broj: string | null;
  klijentId: number | null;
  rokIsporuke: string;
  opcije: Opcije;
  stavke: StavkaForma[];
};

function Prekidac({ naziv, v, set }: { naziv: string; v: boolean; set: (v: boolean) => void }) {
  return (
    <label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-wide transition ${v ? "border-brand bg-brand text-white" : "border-line bg-white text-muted"}`}>
      <input type="checkbox" className="sr-only" checked={v} onChange={(e) => set(e.target.checked)} />
      {naziv}
    </label>
  );
}

export function PonudaEditor({
  k,
  klijenti,
  pocetno,
}: {
  k: Kontekst;
  klijenti: { id: number; naziv: string; adresa: string; telefon: string }[];
  pocetno: PonudaPocetno;
}) {
  const [nacinKupca, setNacinKupca] = useState<"novi" | "postojeci">(pocetno.klijentId ? "postojeci" : "novi");
  const [klijentId, setKlijentId] = useState<number | null>(pocetno.klijentId);
  const [noviKlijent, setNoviKlijent] = useState<KlijentUnos>(prazanKlijent);
  const [pretragaKupca, setPretragaKupca] = useState("");
  const [rok, setRok] = useState(pocetno.rokIsporuke);
  const [opcije, setOpcije] = useState<Opcije>(pocetno.opcije);
  const [stavke, setStavke] = useState<StavkaForma[]>(pocetno.stavke);
  const [greska, setGreska] = useState("");
  const [cuva, setCuva] = useState(false);

  const podrazumevano = () => ({
    sistemId: k.sistemi[0]?.id ?? null,
    staklo: k.cenovnik.find((c) => c.kategorija === "STAKLO")?.naziv ?? null,
    marza: k.marza,
  });

  const rezultati = useMemo(() => stavke.map((s) => izracunaj(k, uUlaz(s))), [stavke, k]);
  const z = useMemo(
    () => zbir(k, rezultati.map((r, i) => ({ r, kolicina: uUlaz(stavke[i]).kolicina })), opcije),
    [k, rezultati, stavke, opcije],
  );

  const izmeni = (kljuc: string, iz: Partial<StavkaForma>) => setStavke((l) => l.map((s) => (s.kljuc === kljuc ? { ...s, ...iz } : s)));
  const dodaj = () => setStavke((l) => [...l.map((s) => ({ ...s, otvorena: false })), novaStavka(podrazumevano())]);

  const filtriraniKlijenti = klijenti.filter((x) => !pretragaKupca || x.naziv.toLowerCase().includes(pretragaKupca.toLowerCase()));

  const snimi = async () => {
    setGreska("");
    if (nacinKupca === "postojeci" && !klijentId) return setGreska("Izaberi postojećeg kupca.");
    if (nacinKupca === "novi" && !noviKlijent.naziv.trim()) return setGreska("Unesi ime kupca.");
    const losa = rezultati.findIndex((r) => r.greska);
    if (losa >= 0) return setGreska(`Stavka ${losa + 1}: ${rezultati[losa].greska}`);
    setCuva(true);
    try {
      await sacuvajPonudu(pocetno.id, {
        klijentId: nacinKupca === "postojeci" ? klijentId : null,
        noviKlijent: nacinKupca === "novi" ? noviKlijent : null,
        rokIsporuke: rok || null,
        opcije,
        stavke: stavke.map(uUlaz),
      });
    } catch (e) {
      // redirect posle uspešnog čuvanja nije greška
      if (e && typeof e === "object" && "digest" in e && String((e as { digest: string }).digest).startsWith("NEXT_REDIRECT")) throw e;
      setGreska(e instanceof Error ? e.message : "Čuvanje nije uspelo.");
      setCuva(false);
    }
  };

  return (
    <div className="pb-56 sm:pb-36 lg:pb-28">
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Kupac */}
        <section className="card p-6">
          <h2 className="mb-4 text-lg font-bold">Kupac</h2>
          <div className="mb-4 flex gap-5">
            {(
              [
                ["novi", "Novi"],
                ["postojeci", "Postojeći"],
              ] as const
            ).map(([v, n]) => (
              <label key={v} className="flex items-center gap-2 text-sm font-medium">
                <input type="radio" checked={nacinKupca === v} onChange={() => setNacinKupca(v)} className="accent-[var(--brand)]" />
                {n}
              </label>
            ))}
          </div>

          {nacinKupca === "novi" ? (
            <KlijentPolja k={noviKlijent} set={setNoviKlijent} />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Pretraga</label>
                <input className="input" placeholder="Ime kupca…" value={pretragaKupca} onChange={(e) => setPretragaKupca(e.target.value)} />
              </div>
              <div>
                <label className="label">Kupac</label>
                <select className="input" value={klijentId ?? ""} onChange={(e) => setKlijentId(Number(e.target.value) || null)}>
                  <option value="">— izaberi —</option>
                  {filtriraniKlijenti.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.naziv}
                      {x.adresa ? ` · ${x.adresa}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="mt-4 w-56">
            <label className="label">Rok isporuke</label>
            <input type="date" className="input" value={rok} onChange={(e) => setRok(e.target.value)} />
          </div>
        </section>

        {/* Stavke */}
        <section className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">Stavke ponude</h2>
            <button type="button" className="btn-secondary" onClick={dodaj}>
              <Plus size={16} /> Dodaj stavku
            </button>
          </div>
          <div className="space-y-3">
            {stavke.length === 0 && <p className="py-6 text-center text-sm text-muted">Nema stavki. Klikni „Dodaj stavku“.</p>}
            {stavke.map((s, i) => (
              <StavkaKartica
                key={s.kljuc}
                s={s}
                rb={i + 1}
                r={rezultati[i]}
                k={k}
                izmeni={(iz) => izmeni(s.kljuc, iz)}
                ukloni={() => setStavke((l) => l.filter((x) => x.kljuc !== s.kljuc))}
                dupliraj={() =>
                  setStavke((l) => {
                    const j = l.findIndex((x) => x.kljuc === s.kljuc);
                    const kopija = { ...s, kljuc: noviKljuc(), otvorena: true };
                    return [...l.slice(0, j + 1).map((x) => ({ ...x, otvorena: false })), kopija, ...l.slice(j + 1)];
                  })
                }
              />
            ))}
          </div>
        </section>

        {/* Zbir */}
        <section className="card ml-auto max-w-md p-6 text-sm">
          <dl className="space-y-1.5">
            <div className="flex justify-between"><dt className="text-muted">Ukupno bez PDV-a</dt><dd>{eur(z.ukupnoBezPdv)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">PDV ({opcije.bezPdv ? 0 : k.pdvStopa}%)</dt><dd>{eur(z.pdv)}</dd></div>
            <div className="flex justify-between font-semibold"><dt>Ukupno sa PDV-om</dt><dd>{eur(z.ukupnoSaPdv)}</dd></div>
            <div className="flex justify-between">
              <dt className="text-muted">Montaža ({z.povrsina} m² × {k.montazaPoM2} €){opcije.montazaUCenu && " – uračunata u cenu"}</dt>
              <dd>{eur(z.montaza)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2 text-base font-extrabold text-brand"><dt>Za naplatu</dt><dd>{eur(z.ukupnoZaNaplatu)}</dd></div>
            <div className="flex justify-between pt-2 text-xs text-muted">
              <dt>Nabavna vrednost materijala</dt><dd>{eur(z.trosakMaterijala)}</dd>
            </div>
            <div className="flex justify-between text-xs text-muted">
              <dt>Zarada (bez PDV-a i montaže)</dt>
              <dd>{eur(z.ukupnoBezPdv - (opcije.montazaUCenu ? z.povrsina * k.montazaPoM2 : 0) - z.trosakMaterijala)}</dd>
            </div>
          </dl>
        </section>
      </div>

      {/* Donja traka */}
      <div className="no-print fixed bottom-0 left-0 right-0 z-30 border-t border-line bg-white/95 px-4 py-3 backdrop-blur lg:left-60 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <Prekidac naziv="Bez PDV-a" v={opcije.bezPdv} set={(v) => setOpcije((o) => ({ ...o, bezPdv: v }))} />
          <Prekidac naziv="Montaža u cenu" v={opcije.montazaUCenu} set={(v) => setOpcije((o) => ({ ...o, montazaUCenu: v, bezMontaze: v ? false : o.bezMontaze }))} />
          <Prekidac naziv="Bez montaže" v={opcije.bezMontaze} set={(v) => setOpcije((o) => ({ ...o, bezMontaze: v, montazaUCenu: v ? false : o.montazaUCenu }))} />
          <div className="flex-1" />
          {greska && <p className="text-sm text-danger">{greska}</p>}
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Ukupno</p>
            <p className="text-xl font-extrabold text-brand">{eur(z.ukupnoZaNaplatu)}</p>
          </div>
          <button type="button" className="btn-secondary hidden sm:inline-flex" onClick={dodaj}>
            <Plus size={16} /> Dodaj stavku
          </button>
          <button type="button" className="btn bg-success text-white hover:opacity-90" onClick={snimi} disabled={cuva}>
            {cuva ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {pocetno.id ? "Sačuvaj izmene" : "Sačuvaj ponudu"}
          </button>
        </div>
      </div>
    </div>
  );
}
