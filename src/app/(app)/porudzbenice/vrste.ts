// vrste = samostalne stavke te vrste; dodaci = dodaci uz prozor/vrata koji ulaze u istu porudžbenicu
export const PORUDZBENICE = {
  staklo: { naslov: "Staklo", dokument: "Specifikacija stakla", vrste: ["PROZOR", "VRATA"], dodaci: [] },
  roletne: { naslov: "Roletne", dokument: "Porudžbenica roletni", vrste: ["ROLETNA"], dodaci: ["roletna"] },
  komarnici: { naslov: "Komarnici", dokument: "Porudžbenica komarnika", vrste: ["KOMARNIK"], dodaci: ["komarnik"] },
  okov: { naslov: "Okov", dokument: "Porudžbenica okova", vrste: ["PROZOR", "VRATA"], dodaci: [] },
  profil: { naslov: "Profil", dokument: "Porudžbenica profila", vrste: ["PROZOR", "VRATA"], dodaci: [] },
  "daske-okapnice": { naslov: "Daske i okapnice", dokument: "Porudžbenica dasaka i okapnica", vrste: ["DASKA", "OKAPNICA"], dodaci: ["daska", "okapnica"] },
} as const;

export type VrstaPorudzbenice = keyof typeof PORUDZBENICE;

type StavkaZaFilter = { vrsta: string; roletna?: string | null; komarnik?: string | null; daska?: string | null; okapnica?: string | null };

/** Da li stavka ulazi u porudžbenicu (kao samostalna stavka ili kao dodatak uz prozor/vrata). */
export function uPorudzbenici(vrsta: VrstaPorudzbenice, s: StavkaZaFilter) {
  const def = PORUDZBENICE[vrsta];
  return (def.vrste as readonly string[]).includes(s.vrsta) || (def.dodaci as readonly string[]).some((d) => !!s[d as keyof StavkaZaFilter]);
}
