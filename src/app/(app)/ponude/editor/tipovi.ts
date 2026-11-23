import type { StavkaUlaz, Vrsta } from "@/lib/proracun";
import { broj } from "@/lib/format";

/** Stavka u formi: brojevi se drže kao tekst dok korisnik kuca. */
export type StavkaForma = Omit<StavkaUlaz, "sirina" | "visina" | "kolicina" | "marza" | "rucnaCena"> & {
  kljuc: string;
  sirina: string;
  visina: string;
  kolicina: string;
  marza: string;
  rucnaCena: string;
  rucno: boolean;
  otvorena: boolean;
};

let brojac = 0;
export const noviKljuc = () => `s${Date.now()}${++brojac}`;

export function novaStavka(p: { sistemId: number | null; staklo: string | null; marza: number; vrsta?: Vrsta }): StavkaForma {
  return {
    kljuc: noviKljuc(),
    vrsta: p.vrsta ?? "PROZOR",
    sirina: "1200",
    visina: "1400",
    kolicina: "1",
    sistemId: p.sistemId,
    staklo: p.staklo,
    materijal: null,
    marza: String(p.marza),
    rucnaCena: "",
    rucno: false,
    modelSifra: null,
    panelSifra: null,
    rukohvat: null,
    boja: null,
    roletna: null,
    roletnaVisina: null,
    roletnaPrepust: null,
    roletnaKais: null,
    komarnik: null,
    daska: null,
    okapnica: null,
    elektroPrihvatnik: false,
    automat: false,
    podstok: false,
    prosirenjeL: false,
    prosirenjeD: false,
    podstokMm: null,
    prosirenjeLMm: null,
    prosirenjeDMm: null,
    spojL: false,
    spojD: false,
    napomena: "",
    otvorena: true,
  };
}

export function uUlaz(s: StavkaForma): StavkaUlaz {
  const { kljuc: _k, rucno, otvorena: _o, ...ostalo } = s;
  return {
    ...ostalo,
    sirina: broj(s.sirina) ?? 0,
    visina: broj(s.visina) ?? 0,
    kolicina: Math.max(1, Math.round(broj(s.kolicina) ?? 1)),
    marza: broj(s.marza) ?? 0,
    rucnaCena: rucno ? broj(s.rucnaCena) ?? 0 : null,
  };
}
