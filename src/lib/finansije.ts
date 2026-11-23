import type { Ponuda } from "@prisma/client";

type P = Pick<Ponuda, "ukupnoBezPdv" | "montaza" | "trosakMaterijala" | "ukupnoZaNaplatu" | "createdAt">;

/** Prihod bez PDV-a (sa montažom) – osnova za zaradu i maržu. */
export const prihodNeto = (p: P) => p.ukupnoBezPdv + p.montaza;
export const zarada = (p: P) => prihodNeto(p) - p.trosakMaterijala;

const MESECI = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "avg", "sep", "okt", "nov", "dec"];

export type MesecniPodatak = { kljuc: string; naziv: string; prihod: number; zarada: number; broj: number };

/** Zbir po mesecima za poslednjih n meseci (uključujući tekući). */
export function poMesecima(ponude: P[], n = 6, sad = new Date()): MesecniPodatak[] {
  const out: MesecniPodatak[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(sad.getFullYear(), sad.getMonth() - i, 1);
    out.push({ kljuc: `${d.getFullYear()}-${d.getMonth()}`, naziv: `${MESECI[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`, prihod: 0, zarada: 0, broj: 0 });
  }
  for (const p of ponude) {
    const d = new Date(p.createdAt);
    const m = out.find((x) => x.kljuc === `${d.getFullYear()}-${d.getMonth()}`);
    if (!m) continue;
    m.prihod += prihodNeto(p);
    m.zarada += zarada(p);
    m.broj += 1;
  }
  return out.map((m) => ({ ...m, prihod: Math.round(m.prihod), zarada: Math.round(m.zarada) }));
}
