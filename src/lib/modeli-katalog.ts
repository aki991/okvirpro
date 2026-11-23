// Struktura modela: stablo podela. List je "polje" (fiks ili krilo).
export type Otvaranje =
  | "FIKS"
  | "ON_L" // okretno-nagibno, šarke levo
  | "ON_D" // okretno-nagibno, šarke desno
  | "O_L" // samo okretno (štulp pomoćno krilo), šarke levo
  | "O_D"
  | "KIP"
  | "PSK_L" // klizi ulevo
  | "PSK_D"
  | "HST_L"
  | "HST_D"
  | "VRATA_L"
  | "VRATA_D";

export type Polje = { tip: "polje"; otvaranje: Otvaranje };
export type Podela = {
  tip: "podela";
  smer: "V" | "H"; // V = delovi jedan pored drugog, H = jedan iznad drugog
  stulp?: boolean; // dva krila bez stuba
  delovi: { udeo: number; sadrzaj: Cvor }[];
};
export type Cvor = Polje | Podela;

const p = (otvaranje: Otvaranje): Polje => ({ tip: "polje", otvaranje });
const v = (...delovi: [number, Cvor][]): Podela => ({
  tip: "podela",
  smer: "V",
  delovi: delovi.map(([udeo, sadrzaj]) => ({ udeo, sadrzaj })),
});
const h = (...delovi: [number, Cvor][]): Podela => ({
  tip: "podela",
  smer: "H",
  delovi: delovi.map(([udeo, sadrzaj]) => ({ udeo, sadrzaj })),
});
const stulp = (levo: Otvaranje, desno: Otvaranje): Podela => ({
  ...v([1, p(levo)], [1, p(desno)]),
  stulp: true,
});

export type KatalogModel = {
  sifra: string;
  naziv: string;
  kategorija: "PROZOR" | "VRATA";
  definicija: Cvor;
};

export const MODELI: KatalogModel[] = [
  { sifra: "P-FIX", naziv: "Fiksni prozor", kategorija: "PROZOR", definicija: p("FIKS") },
  { sifra: "P-FIX-V", naziv: "Fiksni prozor, vertikalna podela", kategorija: "PROZOR", definicija: v([1, p("FIKS")], [1, p("FIKS")]) },
  // levo polovina, desna polovina podeljena na dva (potvrđeno na radnom nalogu: 1418 / 689 / 689)
  { sifra: "P-FIX-V2", naziv: "Fiksni prozor, dve vertikalne podele", kategorija: "PROZOR", definicija: v([1, p("FIKS")], [1, v([1, p("FIKS")], [1, p("FIKS")])]) },
  { sifra: "P-FIX-H", naziv: "Fiksni prozor, horizontalna podela", kategorija: "PROZOR", definicija: h([1, p("FIKS")], [1, p("FIKS")]) },
  { sifra: "P-FIX-H2", naziv: "Fiksni prozor, dve horizontalne podele", kategorija: "PROZOR", definicija: h([1, p("FIKS")], [1, h([1, p("FIKS")], [1, p("FIKS")])]) },
  { sifra: "P-JK-L", naziv: "Jednokrilni prozor, levi, okretno-nagibni", kategorija: "PROZOR", definicija: p("ON_L") },
  { sifra: "P-JK-R", naziv: "Jednokrilni prozor, desni, okretno-nagibni", kategorija: "PROZOR", definicija: p("ON_D") },
  { sifra: "P-JK-KIP", naziv: "Samo kip prozor", kategorija: "PROZOR", definicija: p("KIP") },
  { sifra: "P-JK-L-FIX-R", naziv: "Levo krilo, desno fiksno", kategorija: "PROZOR", definicija: v([1, p("ON_L")], [1, p("FIKS")]) },
  { sifra: "P-FIX-L-JK-R", naziv: "Levo fiksno, desno krilo", kategorija: "PROZOR", definicija: v([1, p("FIKS")], [1, p("ON_D")]) },
  { sifra: "P-PSK-L", naziv: "PSK klizni prozor, levi", kategorija: "PROZOR", definicija: v([1, p("PSK_L")], [1, p("FIKS")]) },
  { sifra: "P-PSK-R", naziv: "PSK klizni prozor, desni", kategorija: "PROZOR", definicija: v([1, p("FIKS")], [1, p("PSK_D")]) },
  { sifra: "P-HST-L", naziv: "HST podizno-klizni (L)", kategorija: "PROZOR", definicija: v([1, p("HST_L")], [1, p("FIKS")]) },
  { sifra: "P-HST-R", naziv: "HST podizno-klizni (D)", kategorija: "PROZOR", definicija: v([1, p("FIKS")], [1, p("HST_D")]) },
  { sifra: "P-JK-L-S", naziv: "Jednokrilni levi sa nadsvetlom", kategorija: "PROZOR", definicija: h([1, p("FIKS")], [3, p("ON_L")]) },
  { sifra: "P-JK-R-S", naziv: "Jednokrilni desni sa nadsvetlom", kategorija: "PROZOR", definicija: h([1, p("FIKS")], [3, p("ON_D")]) },
  { sifra: "P-DK-STULP-L", naziv: "Dvokrilni štulp, levo glavno", kategorija: "PROZOR", definicija: stulp("ON_L", "O_D") },
  { sifra: "P-DK-STULP-R", naziv: "Dvokrilni štulp, desno glavno", kategorija: "PROZOR", definicija: stulp("O_L", "ON_D") },
  { sifra: "P-DK-FULL", naziv: "Dvokrilni, oba krila okretno-nagibna", kategorija: "PROZOR", definicija: v([1, p("ON_L")], [1, p("ON_D")]) },
  { sifra: "P-DK-L-FIX-R", naziv: "Dvokrilni levo, fiksno desno", kategorija: "PROZOR", definicija: v([2, stulp("ON_L", "O_D")], [1, p("FIKS")]) },
  { sifra: "P-FIX-L-DK-R", naziv: "Fiksno levo, dvokrilni desno", kategorija: "PROZOR", definicija: v([1, p("FIKS")], [2, stulp("O_L", "ON_D")]) },
  { sifra: "P-DK-STULP-L-S", naziv: "Dvokrilni štulp levi sa nadsvetlom", kategorija: "PROZOR", definicija: h([1, p("FIKS")], [3, stulp("ON_L", "O_D")]) },
  { sifra: "P-DK-STULP-R-S", naziv: "Dvokrilni štulp desni sa nadsvetlom", kategorija: "PROZOR", definicija: h([1, p("FIKS")], [3, stulp("O_L", "ON_D")]) },
  { sifra: "P-DK-FIX-S", naziv: "Dvokrilni sa stubom i podeljenim nadsvetlom", kategorija: "PROZOR", definicija: h([1, v([1, p("FIKS")], [1, p("FIKS")])], [3, v([1, p("ON_L")], [1, p("ON_D")])]) },
  { sifra: "P-TK-F-K-F", naziv: "Trokrilni, krilo u sredini, fiksno sa strana", kategorija: "PROZOR", definicija: v([1, p("FIKS")], [1, p("ON_L")], [1, p("FIKS")]) },
  { sifra: "P-TK-K-F-K", naziv: "Trokrilni, fiksno u sredini, krila sa strana", kategorija: "PROZOR", definicija: v([1, p("ON_L")], [1, p("FIKS")], [1, p("ON_D")]) },
  { sifra: "P-TK-3JK", naziv: "Trokrilni, sva tri krila", kategorija: "PROZOR", definicija: v([1, p("ON_L")], [1, p("ON_L")], [1, p("ON_D")]) },
  { sifra: "P-TK-DK-JK", naziv: "Trokrilni, dvokrilni + jednokrilni", kategorija: "PROZOR", definicija: v([2, stulp("ON_L", "O_D")], [1, p("ON_D")]) },
  { sifra: "P-TK-JK-DK", naziv: "Trokrilni, jednokrilni (L) + dvokrilni (D)", kategorija: "PROZOR", definicija: v([1, p("ON_L")], [2, stulp("O_L", "ON_D")]) },
  { sifra: "P-BV-JK", naziv: "Balkonska vrata, jednokrilna", kategorija: "PROZOR", definicija: p("ON_L") },
  { sifra: "P-BV-JK-R", naziv: "Balkonska vrata, jednokrilna, desna", kategorija: "PROZOR", definicija: p("ON_D") },
  { sifra: "P-BV-DK", naziv: "Balkonska vrata, dvokrilna", kategorija: "PROZOR", definicija: stulp("ON_L", "O_D") },
  { sifra: "P-BV-DK-R", naziv: "Balkonska vrata, dvokrilna, desno glavno", kategorija: "PROZOR", definicija: stulp("O_L", "ON_D") },
  // Ulazna vrata (isti skup kao u referentnoj aplikaciji)
  { sifra: "V-UL-JK", naziv: "Ulazna vrata, jednokrilna, leva", kategorija: "VRATA", definicija: p("VRATA_L") },
  { sifra: "V-UL-JK-R", naziv: "Ulazna vrata, jednokrilna, desna", kategorija: "VRATA", definicija: p("VRATA_D") },
  { sifra: "V-UL-DK", naziv: "Ulazna vrata, dvokrilna", kategorija: "VRATA", definicija: { ...v([2, p("VRATA_L")], [1, p("O_D")]), stulp: true } },
  { sifra: "V-UL-DK-R", naziv: "Ulazna vrata, dvokrilna, desno glavno", kategorija: "VRATA", definicija: { ...v([1, p("O_L")], [2, p("VRATA_D")]), stulp: true } },
  { sifra: "V-UL-L-FIX-R", naziv: "Ulazna vrata, leva, sa desnim fiksnim poljem", kategorija: "VRATA", definicija: v([2, p("VRATA_L")], [1, p("FIKS")]) },
  { sifra: "V-UL-R-FIX-L", naziv: "Ulazna vrata, desna, sa levim fiksnim poljem", kategorija: "VRATA", definicija: v([1, p("FIKS")], [2, p("VRATA_D")]) },
  { sifra: "V-UL-F2", naziv: "Ulazna vrata u sredini, fiksno sa obe strane", kategorija: "VRATA", definicija: v([1, p("FIKS")], [2, p("VRATA_L")], [1, p("FIKS")]) },
  { sifra: "V-UL-F2-R", naziv: "Ulazna vrata u sredini (desno krilo), fiksno sa obe strane", kategorija: "VRATA", definicija: v([1, p("FIKS")], [2, p("VRATA_D")], [1, p("FIKS")]) },
  { sifra: "V-UL-JK-S", naziv: "Ulazna vrata, jednokrilna, sa nadsvetlom", kategorija: "VRATA", definicija: h([1, p("FIKS")], [4, p("VRATA_L")]) },
  { sifra: "V-UL-JK-S-R", naziv: "Ulazna vrata, jednokrilna, desna, sa nadsvetlom", kategorija: "VRATA", definicija: h([1, p("FIKS")], [4, p("VRATA_D")]) },
  { sifra: "V-UL-DK-S", naziv: "Ulazna vrata, dvokrilna, sa nadsvetlom", kategorija: "VRATA", definicija: h([1, p("FIKS")], [4, { ...v([2, p("VRATA_L")], [1, p("O_D")]), stulp: true }]) },
  { sifra: "V-UL-DK-S-R", naziv: "Ulazna vrata, dvokrilna, desno glavno, sa nadsvetlom", kategorija: "VRATA", definicija: h([1, p("FIKS")], [4, { ...v([1, p("O_L")], [2, p("VRATA_D")]), stulp: true }]) },
  { sifra: "V-UL-FIX-S", naziv: "Vrata sa fiksnim poljima i nadsvetlom", kategorija: "VRATA", definicija: h([1, p("FIKS")], [4, v([1, p("FIKS")], [2, p("VRATA_L")], [1, p("FIKS")])]) },
  { sifra: "V-UL-FIX-S-R", naziv: "Vrata (desna) sa fiksnim poljima i nadsvetlom", kategorija: "VRATA", definicija: h([1, p("FIKS")], [4, v([1, p("FIKS")], [2, p("VRATA_D")], [1, p("FIKS")])]) },
];

/** Model koji se koristi kad u stavci nije izabran nijedan. */
export const PODRAZUMEVANI_MODEL = { PROZOR: "P-FIX", VRATA: "V-UL-JK" } as const;
