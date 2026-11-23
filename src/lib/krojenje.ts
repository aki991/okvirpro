// Optimizacija sečenja šipki (1D bin-packing, "best fit decreasing").
//
// Pravila (potvrđena na referentnom primeru):
//  - nova šipka: 10 mm se odseca na početku (poravnanje kraja) + 4 mm rez po komadu
//  - ostatak iz magacina: samo 4 mm rez po komadu
//  - ostaci kraći od 400 mm se ne vraćaju u magacin (otpad)
//
// Algoritam: komadi se sortiraju od najdužeg. Svaki komad ide u već otvorenu šipku
// u koju najbolje staje (najmanje ostaje). Ako ne staje nigde, otvara se najkraći
// ostatak iz magacina u koji staje, a tek onda nova fabrička šipka.

export const POCETNI_ODSECAK = 10;
export const REZ = 4;
export const MIN_OSTATAK = 400;

/** mera = duža ivica komada; ugao "45" = kosi rez na oba kraja, "90" = ravno */
export type Komad = { oznaka: string; mera: number; ugao?: "45" | "90" };
export type Sipka = {
  izvor: "NOVA" | "OSTATAK";
  ostatakId?: number; // id iz magacina
  duzina: number; // početna dužina
  komadi: Komad[];
  ostatak: number; // preostalo posle sečenja
};
export type PlanProfila = {
  profilStavkaId: number;
  sistem: string;
  profil: string;
  duzinaSipke: number;
  sipke: Sipka[];
  punihSipki: number;
  iskoriscenihOstataka: number;
  metara: number; // ukupno potrebnih metara
  otpad: number; // mm otpada (ostaci < 400 + rezovi)
  greska?: string;
};

export function optimizuj(
  komadi: Komad[],
  duzinaSipke: number,
  ostaci: { id: number; duzina: number }[],
): { sipke: Sipka[]; greska?: string } {
  const sortirani = [...komadi].sort((a, b) => b.mera - a.mera);
  const slobodniOstaci = [...ostaci].sort((a, b) => a.duzina - b.duzina);
  const sipke: Sipka[] = [];
  let greska: string | undefined;

  for (const k of sortirani) {
    const potrebno = k.mera + REZ;
    // 1) najbolje uklapanje u otvorene šipke
    let najbolja: Sipka | undefined;
    for (const s of sipke) if (s.ostatak >= potrebno && (!najbolja || s.ostatak < najbolja.ostatak)) najbolja = s;
    // 2) najkraći ostatak iz magacina u koji staje
    if (!najbolja) {
      const i = slobodniOstaci.findIndex((o) => o.duzina >= potrebno);
      if (i >= 0) {
        const o = slobodniOstaci.splice(i, 1)[0];
        najbolja = { izvor: "OSTATAK", ostatakId: o.id, duzina: o.duzina, komadi: [], ostatak: o.duzina };
        sipke.push(najbolja);
      }
    }
    // 3) nova šipka
    if (!najbolja) {
      if (potrebno + POCETNI_ODSECAK > duzinaSipke) {
        greska = `Komad ${k.mera} mm je duži od šipke (${duzinaSipke} mm).`;
        continue;
      }
      najbolja = { izvor: "NOVA", duzina: duzinaSipke, komadi: [], ostatak: duzinaSipke - POCETNI_ODSECAK };
      sipke.push(najbolja);
    }
    najbolja.komadi.push(k);
    najbolja.ostatak -= potrebno;
  }

  // ostaci iz magacina prvo, pa nove šipke
  sipke.sort((a, b) => (a.izvor === b.izvor ? 0 : a.izvor === "OSTATAK" ? -1 : 1));
  return { sipke, greska };
}
