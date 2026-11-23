"use client";

import { useState } from "react";
import { Plus, Trash2, Upload, X } from "lucide-react";
import type { BojaProfila, CenovnikStavka, Firma } from "@prisma/client";
import { PageHeader } from "@/components/PageHeader";
import { SaveButton, sacuvaj, type SaveState } from "@/components/SaveBar";
import { sacuvajPodesavanja } from "@/app/actions/sifarnici";
import { broj } from "@/lib/format";
import { JavniKalkulator } from "./JavniKalkulator";

type Red = { id?: number; kategorija: string; naziv: string; cena: string; kljuc: string };

const GRUPE: { kategorija: string; naslov: string; opis?: string; jedinica: string; nazivLabel: string }[] = [
  { kategorija: "STAKLO", naslov: "Cenovnik stakla", jedinica: "€/m²", nazivLabel: "Vrsta stakla" },
  { kategorija: "ROLETNA", naslov: "Roletne", jedinica: "€/m²", nazivLabel: "Naziv" },
  { kategorija: "KOMARNIK", naslov: "Komarnici", jedinica: "€/m²", nazivLabel: "Naziv" },
  { kategorija: "DASKA", naslov: "Unutrašnje daske", jedinica: "€/m¹", nazivLabel: "Naziv" },
  { kategorija: "OKAPNICA", naslov: "Spoljašnje okapnice", jedinica: "€/m¹", nazivLabel: "Naziv" },
  { kategorija: "RUKOHVAT", naslov: "Rukohvati za ulazna vrata", opis: "Cena po komadu, po dužini rukohvata.", jedinica: "€/kom", nazivLabel: "Dužina" },
  { kategorija: "DODATAK_VRATA", naslov: "Dodaci za ulazna vrata", opis: "Osnovni okov vrata podešava se na strani Okov.", jedinica: "€/kom", nazivLabel: "Naziv" },
];

let brojac = 0;
const noviKljuc = () => `n${++brojac}`;

export function PodesavanjaForma({ firma, cenovnik, boje }: { firma: Firma; cenovnik: CenovnikStavka[]; boje: BojaProfila[] }) {
  const [bojeForma, setBojeForma] = useState(boje.map((b) => ({ id: b.id, sifra: b.sifra, naziv: b.naziv, hex: b.hex, doplata: String(b.doplata) })));
  const [f, setF] = useState({
    ...firma,
    marza: String(firma.marza),
    montazaPoM2: String(firma.montazaPoM2),
    pdvStopa: String(firma.pdvStopa),
    kursEur: String(firma.kursEur),
  });
  const [redovi, setRedovi] = useState<Red[]>(
    cenovnik.map((c) => ({ id: c.id, kategorija: c.kategorija, naziv: c.naziv, cena: String(c.cena), kljuc: `c${c.id}` })),
  );
  const [stanje, setStanje] = useState<SaveState>("idle");

  const polje = (k: keyof typeof f) => ({
    value: (f[k] as string) ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value }),
  });

  const izmeniRed = (kljuc: string, izmena: Partial<Red>) =>
    setRedovi((r) => r.map((x) => (x.kljuc === kljuc ? { ...x, ...izmena } : x)));

  const ucitajLogo = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setF((s) => ({ ...s, logo: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const snimi = () =>
    sacuvaj(setStanje, () =>
      sacuvajPodesavanja(
        {
          naziv: f.naziv, adresa: f.adresa, mesto: f.mesto, pib: f.pib, maticniBroj: f.maticniBroj, email: f.email,
          telefon: f.telefon, web: f.web, tekuciRacun: f.tekuciRacun, zastupnik: f.zastupnik, logo: f.logo,
          marza: broj(f.marza) ?? 0, montazaPoM2: broj(f.montazaPoM2) ?? 0, pdvStopa: broj(f.pdvStopa) ?? 20,
          kursEur: broj(f.kursEur) ?? 117.5, garancija: f.garancija, uslovi: f.uslovi,
          kalkulatorAktivan: f.kalkulatorAktivan, kalkulatorPoruka: f.kalkulatorPoruka,
        },
        redovi
          .filter((r) => r.naziv.trim())
          .map((r) => ({ id: r.id, kategorija: r.kategorija, naziv: r.naziv, cena: broj(r.cena) ?? 0 })),
        bojeForma.map((b) => ({ id: b.id, naziv: b.naziv, hex: b.hex, doplata: broj(b.doplata) ?? 0 })),
      ),
    );

  return (
    <>
      <PageHeader naslov="Podešavanja" opis="Podaci firme, obračun i cenovnici" akcije={<SaveButton state={stanje} onClick={snimi} />} />

      <div className="grid gap-6 p-4 sm:p-6 lg:p-8 xl:grid-cols-2">
        {/* Firma */}
        <section className="card p-6 xl:col-span-2">
          <h2 className="font-bold">Podaci firme</h2>
          <p className="mb-4 text-sm text-muted">Prikazuju se u zaglavlju ponuda, ugovora i računa.</p>
          <div className="grid gap-6 lg:grid-cols-[180px_1fr]">
            <div>
              <span className="label">Logo</span>
              <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-dashed border-line bg-background">
                {f.logo ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.logo} alt="Logo firme" className="max-h-full max-w-full object-contain p-2" />
                    <button
                      type="button"
                      onClick={() => setF({ ...f, logo: null })}
                      className="absolute right-1 top-1 rounded-full bg-white p-1 shadow"
                      aria-label="Ukloni logo"
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center gap-1 text-xs text-muted">
                    <Upload size={20} />
                    Otpremi logo
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => ucitajLogo(e.target.files?.[0])} />
                  </label>
                )}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(
                [
                  ["naziv", "Naziv firme"], ["adresa", "Adresa"], ["mesto", "Mesto (poštanski broj i grad)"],
                  ["pib", "PIB"], ["maticniBroj", "Matični broj"], ["tekuciRacun", "Tekući račun"],
                  ["email", "Email"], ["telefon", "Telefon"], ["web", "Web sajt"], ["zastupnik", "Zastupnik (potpisnik)"],
                ] as const
              ).map(([k, l]) => (
                <div key={k}>
                  <label className="label">{l}</label>
                  <input className="input" {...polje(k)} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Obračun */}
        <section className="card p-6">
          <h2 className="mb-4 font-bold">Obračun</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Podrazumevana marža (%)</label>
              <input className="input" inputMode="decimal" {...polje("marza")} />
            </div>
            <div>
              <label className="label">Cena montaže po m² (€)</label>
              <input className="input" inputMode="decimal" {...polje("montazaPoM2")} />
            </div>
            <div>
              <label className="label">PDV stopa (%)</label>
              <input className="input" inputMode="decimal" {...polje("pdvStopa")} />
            </div>
            <div>
              <label className="label">Kurs EUR → RSD</label>
              <input className="input" inputMode="decimal" {...polje("kursEur")} />
              <p className="mt-1 text-xs text-muted">Srednji kurs NBS. Automatsko preuzimanje dolazi kasnije.</p>
            </div>
          </div>
        </section>

        {/* Uslovi */}
        <section className="card p-6">
          <h2 className="mb-4 font-bold">Garancija i uslovi</h2>
          <label className="label">Tekst garancije</label>
          <textarea className="input min-h-24" {...polje("garancija")} />
          <label className="label mt-4">Uslovi ponude (jedan uslov po redu)</label>
          <textarea className="input min-h-24" {...polje("uslovi")} />
        </section>

        {/* Boje profila */}
        <section className="card p-6 xl:col-span-2">
          <h2 className="font-bold">Boje profila (Salamander)</h2>
          <p className="mb-4 text-sm text-muted">
            5 najčešćih boja koje se biraju u stavci ponude. Doplata je procenat na nabavnu cenu profila (čelik se ne računa) i ulazi u cenu sa maržom. Nijansa se
            koristi na crtežu i u 3D prikazu.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {bojeForma.map((b) => (
              <div key={b.id} className="rounded-lg border border-line p-3">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={b.hex}
                    onChange={(e) => setBojeForma((l) => l.map((x) => (x.id === b.id ? { ...x, hex: e.target.value } : x)))}
                    className="h-9 w-9 shrink-0 cursor-pointer rounded-full border border-line bg-transparent p-0.5"
                    aria-label={`Nijansa: ${b.naziv}`}
                  />
                  <input
                    className="input !py-1.5 font-semibold"
                    value={b.naziv}
                    onChange={(e) => setBojeForma((l) => l.map((x) => (x.id === b.id ? { ...x, naziv: e.target.value } : x)))}
                  />
                </div>
                <label className="label mt-3">Doplata na profile (%)</label>
                <input
                  className="input text-right font-semibold"
                  inputMode="decimal"
                  disabled={b.sifra === "BELA"}
                  value={b.doplata}
                  onChange={(e) => setBojeForma((l) => l.map((x) => (x.id === b.id ? { ...x, doplata: e.target.value } : x)))}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Javni kalkulator */}
        <JavniKalkulator
          aktivan={f.kalkulatorAktivan}
          poruka={f.kalkulatorPoruka}
          set={(iz) => setF((s) => ({ ...s, ...iz }))}
        />

        {/* Cenovnici */}
        {GRUPE.map((g) => {
          const lista = redovi.filter((r) => r.kategorija === g.kategorija);
          return (
            <section key={g.kategorija} className="card p-6">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-bold">{g.naslov}</h2>
                  {g.opis && <p className="text-sm text-muted">{g.opis}</p>}
                </div>
                <button
                  type="button"
                  className="btn-secondary !px-3 !py-1.5"
                  onClick={() => setRedovi((r) => [...r, { kategorija: g.kategorija, naziv: "", cena: "", kljuc: noviKljuc() }])}
                >
                  <Plus size={15} /> Dodaj
                </button>
              </div>
              <div className="grid grid-cols-[1fr_120px_36px] gap-2 border-b border-line pb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                <span>{g.nazivLabel}</span>
                <span>Cena ({g.jedinica})</span>
                <span />
              </div>
              <div className="mt-2 space-y-2">
                {lista.length === 0 && <p className="py-2 text-sm text-muted">Nema stavki.</p>}
                {lista.map((r) => (
                  <div key={r.kljuc} className="grid grid-cols-[1fr_120px_36px] items-center gap-2">
                    <input className="input" value={r.naziv} onChange={(e) => izmeniRed(r.kljuc, { naziv: e.target.value })} />
                    <input
                      className="input text-right"
                      inputMode="decimal"
                      value={r.cena}
                      onChange={(e) => izmeniRed(r.kljuc, { cena: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setRedovi((x) => x.filter((y) => y.kljuc !== r.kljuc))}
                      className="flex h-9 items-center justify-center rounded-lg text-muted hover:bg-background hover:text-danger"
                      aria-label="Obriši stavku"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
