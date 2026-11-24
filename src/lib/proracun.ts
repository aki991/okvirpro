// Motor proračuna: iz dimenzija, modela i sistema pravi
// listu sečenja profila, staklo, okov i nabavnu/prodajnu cenu stavke.
// Isti kod se koristi u formi ponude (uživo), pri čuvanju, u radnom nalogu i krojnoj listi.
//
// Pravila (potvrđena na referentnom primeru P-FIX 1200×1400, PVC):
//  - ram se seče na neto meru + 2×3 mm za varenje (PVC); ALU bez dodatka
//  - neto mera rama = mera − proširenja (levo/desno) − podštok (dole)
//  - čelično ojačanje = dužina profila − 120 mm
//  - svetli otvor rama = neto − 2 × unutrašnja visina rama
//  - fiks lajsna = svetli otvor polja; staklo = lajsna − 8 mm
//  - krilo = svetli otvor polja + 16 mm (preklop + varenje)
//  - svetli otvor krila = rez krila − 6 − 2 × unutrašnja visina krila

import { PODRAZUMEVANI_MODEL, type Cvor, type Otvaranje } from "./modeli-katalog";

export type Vrsta = "PROZOR" | "VRATA" | "ROLETNA" | "KOMARNIK" | "DASKA" | "OKAPNICA";

export const VRSTE: { k: Vrsta; n: string }[] = [
  { k: "PROZOR", n: "Prozor" },
  { k: "VRATA", n: "Vrata" },
  { k: "ROLETNA", n: "Roletna" },
  { k: "KOMARNIK", n: "Komarnik" },
  { k: "DASKA", n: "Daska" },
  { k: "OKAPNICA", n: "Okapnica" },
];

/** Podrazumevana (univerzalna) visina kutije roletne i dozvoljeni opseg, u mm. */
export const ROLETNA_VISINA = { podrazumevano: 180, min: 100, max: 400 } as const;
export const visinaRoletne = (v: number | null | undefined) =>
  v && v >= ROLETNA_VISINA.min && v <= ROLETNA_VISINA.max ? Math.round(v) : ROLETNA_VISINA.podrazumevano;

/** Koliko nadgradna kutija roletne viri ka sobi preko unutrašnjeg lica štoka (mm); 0 = bez prepusta. */
export const ROLETNA_PREPUST = { podrazumevano: 50, min: 0, max: 150 } as const;
export const prepustRoletne = (v: number | null | undefined) =>
  v != null && Number.isFinite(v) && v >= ROLETNA_PREPUST.min && v <= ROLETNA_PREPUST.max ? Math.round(v) : ROLETNA_PREPUST.podrazumevano;

/** Strana kaiša roletne gledano iznutra – sve osim "L" je desno. */
export const stranaKaisa = (v: string | null | undefined): "L" | "D" => (v === "L" ? "L" : "D");

/** Dodaci koji se mogu ugraditi uz prozor ili vrata. */
export const DODACI = [
  { polje: "roletna", kategorija: "ROLETNA", naziv: "Roletna", jedinica: "m²" },
  { polje: "komarnik", kategorija: "KOMARNIK", naziv: "Komarnik", jedinica: "m²" },
  { polje: "daska", kategorija: "DASKA", naziv: "Unutrašnja daska", jedinica: "m" },
  { polje: "okapnica", kategorija: "OKAPNICA", naziv: "Spoljna okapnica", jedinica: "m" },
] as const;

export const VRSTA_CENOVNIK: Partial<Record<Vrsta, string>> = {
  ROLETNA: "ROLETNA",
  KOMARNIK: "KOMARNIK",
  DASKA: "DASKA",
  OKAPNICA: "OKAPNICA",
};

// ───────────── Kontekst (cenovnici) ─────────────
export type KontekstProfil = {
  kljuc: string;
  naziv: string;
  duzinaSipke: number | null;
  unutrasnjaVisina: number | null;
  sirinaOdbitak: number | null;
  cena: number;
  poKomadu: boolean;
};
export type KontekstSistem = { id: number; naziv: string; tip: string; stavke: KontekstProfil[] };
export type Kontekst = {
  sistemi: KontekstSistem[];
  cenovnik: { kategorija: string; naziv: string; cena: number }[];
  okov: { kljuc: string; grupa: string; naziv: string; cena: number; poMetru: boolean }[];
  okovMetoda: string;
  okovPoM2: number;
  modeli: { sifra: string; naziv: string; kategorija: string; definicija: Cvor }[];
  paneli: { sifra: string; naziv: string; cena: number }[];
  /** boje profila; doplata = % na cenu profila */
  boje: { sifra: string; naziv: string; hex: string; doplata: number }[];
  pdvStopa: number;
  montazaPoM2: number;
  marza: number;
};

// ───────────── Ulaz stavke ─────────────
export type StavkaUlaz = {
  vrsta: Vrsta;
  sirina: number;
  visina: number;
  kolicina: number;
  sistemId: number | null;
  staklo: string | null;
  materijal: string | null;
  marza: number;
  rucnaCena: number | null;
  modelSifra: string | null;
  panelSifra: string | null;
  rukohvat: string | null;
  /** šifra boje profila; null/undefined = bela */
  boja?: string | null;
  /** dodaci uz prozor/vrata – naziv iz cenovnika, null = bez */
  roletna?: string | null;
  /** visina kutije roletne u mm; null = podrazumevana */
  roletnaVisina?: number | null;
  /** prepust kutije roletne ka sobi u mm; null = podrazumevano (50) */
  roletnaPrepust?: number | null;
  /** strana kaiša roletne gledano iznutra: "L" | "D"; null = desno */
  roletnaKais?: string | null;
  komarnik?: string | null;
  daska?: string | null;
  okapnica?: string | null;
  elektroPrihvatnik: boolean;
  automat: boolean;
  podstok: boolean;
  prosirenjeL: boolean;
  prosirenjeD: boolean;
  /** mere opcija u mm; null/undefined = podrazumevano iz profilnog sistema */
  podstokMm?: number | null;
  prosirenjeLMm?: number | null;
  prosirenjeDMm?: number | null;
  spojL: boolean;
  spojD: boolean;
  napomena: string;
};

// ───────────── Izlaz ─────────────
export type Rez = {
  kljuc: string; // ključ profila u sistemu (RAM, LAJSNA…)
  element: string; // opis za radni nalog
  oznaka: string; // H/V – za krojnu listu
  mera: number; // mm (kod 45° reza: mera po dužoj ivici)
  kom: number;
  ugao?: Ugao; // ugao sečenja na oba kraja
};

/** Ugao sečenja: "45" = kosi rez 45°/45° (spaja se na uglu), "90" = ravan rez. */
export type Ugao = "45" | "90";

// Ram, krila i lajsne se spajaju na uglovima (varenje/štancovanje) → 45°.
// Prečke, štulp, čelik, podštok, proširenja i prag se seku ravno → 90°.
const KOSI_REZ = new Set(["RAM", "KRILO_PROZORA", "KRILO_VRATA", "LAJSNA"]);
export const ugaoZa = (kljuc: string): Ugao => (KOSI_REZ.has(kljuc) ? "45" : "90");
export const ugaoOznaka = (u?: Ugao) => (u === "45" ? "45°/45°" : u === "90" ? "90°/90°" : "");

/** Podrazumevane mere opcija ako ih sistem nema. */
export const OPCIJE_MM = { prosirenje: 40, podstok: 30 } as const;

/** Stvarne mere opcija pozicije (unos u stavci ili podrazumevano iz sistema). */
export function mereOpcija(s: Pick<StavkaUlaz, "podstok" | "prosirenjeL" | "prosirenjeD" | "podstokMm" | "prosirenjeLMm" | "prosirenjeDMm">, sistem?: KontekstSistem) {
  const prPodr = sistem?.stavke.find((x) => x.kljuc === "PROSIRENJE")?.unutrasnjaVisina ?? OPCIJE_MM.prosirenje;
  const podPodr = sistem?.stavke.find((x) => x.kljuc === "PODSTOK")?.unutrasnjaVisina ?? OPCIJE_MM.podstok;
  const ili = (v: number | null | undefined, podr: number) => (v && v > 0 ? v : podr);
  return {
    podrazumevano: { prosirenje: prPodr, podstok: podPodr },
    prosirenjeL: s.prosirenjeL ? ili(s.prosirenjeLMm, prPodr) : 0,
    prosirenjeD: s.prosirenjeD ? ili(s.prosirenjeDMm, prPodr) : 0,
    podstok: s.podstok ? ili(s.podstokMm, podPodr) : 0,
  };
}
export type StakloRez = { opis: string; sirina: number; visina: number; kom: number };
export type OkovRez = { naziv: string; kolicina: number; jedinica: string; cena: number };
export type TrosakRed = { naziv: string; iznos: number };

export type Rezultat = {
  rezovi: Rez[];
  celik: Rez[];
  staklo: StakloRez[];
  okov: OkovRez[];
  komadi: { naziv: string; kom: number; cena: number }[];
  troskovi: TrosakRed[];
  trosakKom: number; // nabavna cena po komadu
  cenaKom: number; // prodajna bez PDV-a po komadu
  povrsina: number; // m² (za montažu)
  greska?: string;
};

const r2 = (n: number) => Math.round(n * 100) / 100;

function profil(s: KontekstSistem | undefined, kljuc: string) {
  return s?.stavke.find((x) => x.kljuc === kljuc);
}

// ───────────── Geometrija ─────────────
type Ctx = {
  sistem: KontekstSistem;
  pvc: boolean;
  vrata: boolean;
  rezovi: Rez[];
  celik: Rez[];
  staklo: StakloRez[];
  krila: { otvaranje: Otvaranje; sirina: number; visina: number }[];
  precke: number;
  stulpovi: number;
  brojPolja: number;
};

const VAR = 3; // dodatak za varenje po kraju (PVC)
// Krilo = svetli otvor + 22 mm (PVC: 16 mm preklop + 6 mm varenje). Potvrđeno na 6 radnih naloga.
// ALU nema varenje → pretpostavka 16 mm (nije potvrđeno primerom).
const KRILO_DODATAK_PVC = 22;
const KRILO_DODATAK_ALU = 16;
const STAKLO_ODBITAK = 8;
const CELIK_ODBITAK = 120; // čelik rama
const CELIK_KRILA_ODBITAK = 160; // čelik krila
// Čelik prečke ide celom dužinom prečke (potvrđeno referentnim nalogom): T-spojnica na kraju prečke
// se vijcima pričvršćuje u čelik, pa čelik mora da dođe do kraja.
const STULP_ODBITAK = 70; // lažna prečka štulpa = visina krila − 70 (ako sistem nema svoju vrednost)

const dodatakKrila = (c: Ctx) => (c.pvc ? KRILO_DODATAK_PVC : KRILO_DODATAK_ALU);

function dodaj(lista: Rez[], r: Rez) {
  const isti = lista.find((x) => x.kljuc === r.kljuc && x.element === r.element && x.mera === r.mera);
  if (isti) isti.kom += r.kom;
  // ugao po vrsti profila (čelik CELIK_* je uvek ravan rez)
  else lista.push({ ...r, ugao: r.ugao ?? ugaoZa(r.kljuc) });
}

function poljeFiks(c: Ctx, w: number, h: number, br: number) {
  dodaj(c.rezovi, { kljuc: "LAJSNA", element: "Fiks lajsna Š", oznaka: `P${br}H`, mera: Math.round(w), kom: 2 });
  dodaj(c.rezovi, { kljuc: "LAJSNA", element: "Fiks lajsna V", oznaka: `P${br}V`, mera: Math.round(h), kom: 2 });
  c.staklo.push({ opis: `Polje ${br} (fiks)`, sirina: Math.round(w - STAKLO_ODBITAK), visina: Math.round(h - STAKLO_ODBITAK), kom: 1 });
}

/** Krilo zadato spoljnim merama reza (ks × kv). */
function krilo(c: Ctx, ks: number, kv: number, br: number, o: Otvaranje, uloga?: "Glavno" | "Pomoćno") {
  const vrata = o === "VRATA_L" || o === "VRATA_D";
  const kKrilo = vrata ? "KRILO_VRATA" : "KRILO_PROZORA";
  const kCelik = vrata ? "CELIK_KRILA_VRATA" : "CELIK_KRILA";
  const ui = profil(c.sistem, kKrilo)?.unutrasnjaVisina ?? (vrata ? 88 : 56);
  ks = Math.round(ks);
  kv = Math.round(kv);
  const naziv = uloga ? `${uloga} krilo${vrata ? " vrata" : ""}` : vrata ? "Krilo vrata" : "Krilo";
  const celikNaziv = uloga ? `Čelik ${uloga.toLowerCase()} krilo` : vrata ? "Čelik krilo vrata" : "Čelik krilo";
  dodaj(c.rezovi, { kljuc: kKrilo, element: `${naziv} Š`, oznaka: `P${br}H`, mera: ks, kom: 2 });
  dodaj(c.rezovi, { kljuc: kKrilo, element: `${naziv} V`, oznaka: `P${br}V`, mera: kv, kom: 2 });
  if (c.pvc) {
    dodaj(c.celik, { kljuc: kCelik, element: `${celikNaziv} Š`, oznaka: `P${br}H`, mera: ks - CELIK_KRILA_ODBITAK, kom: 2 });
    dodaj(c.celik, { kljuc: kCelik, element: `${celikNaziv} V`, oznaka: `P${br}V`, mera: kv - CELIK_KRILA_ODBITAK, kom: 2 });
  }
  const sw = ks - (c.pvc ? 2 * VAR : 0) - 2 * ui;
  const sh = kv - (c.pvc ? 2 * VAR : 0) - 2 * ui;
  dodaj(c.rezovi, { kljuc: "LAJSNA", element: `${naziv} lajsna Š`, oznaka: `P${br}H`, mera: Math.round(sw), kom: 2 });
  dodaj(c.rezovi, { kljuc: "LAJSNA", element: `${naziv} lajsna V`, oznaka: `P${br}V`, mera: Math.round(sh), kom: 2 });
  c.staklo.push({ opis: `Polje ${br} (krilo)`, sirina: Math.round(sw - STAKLO_ODBITAK), visina: Math.round(sh - STAKLO_ODBITAK), kom: 1 });
  c.krila.push({ otvaranje: o, sirina: ks, visina: kv });
}

/** Štulp: dva krila bez stuba dele svetli otvor + dodatak na pola; između je lažna prečka. */
function stulp(c: Ctx, cvor: Extract<Cvor, { tip: "podela" }>, w: number, h: number): boolean {
  const [a, b] = cvor.delovi.map((d) => d.sadrzaj);
  if (cvor.smer !== "V" || cvor.delovi.length !== 2 || a.tip !== "polje" || b.tip !== "polje" || a.otvaranje === "FIKS" || b.otvaranje === "FIKS") return false;
  const d = dodatakKrila(c);
  const ukupno = cvor.delovi[0].udeo + cvor.delovi[1].udeo;
  const kv = h + d;
  const pomocno = (o: Otvaranje) => o === "O_L" || o === "O_D";
  for (const [i, p] of [a, b].entries()) {
    const ks = ((w + d) * cvor.delovi[i].udeo) / ukupno;
    krilo(c, ks, kv, ++c.brojPolja, p.otvaranje, pomocno(p.otvaranje) ? "Pomoćno" : "Glavno");
  }
  const odbitak = profil(c.sistem, "LAZNA_PRECKA")?.sirinaOdbitak ?? STULP_ODBITAK;
  dodaj(c.rezovi, { kljuc: "LAZNA_PRECKA", element: "Štulp (lažna prečka)", oznaka: "ST", mera: Math.round(kv - odbitak), kom: 1 });
  c.stulpovi += 1;
  return true;
}

function obidji(c: Ctx, cvor: Cvor, w: number, h: number) {
  if (cvor.tip === "polje") {
    const br = ++c.brojPolja;
    if (cvor.otvaranje === "FIKS") poljeFiks(c, w, h, br);
    else krilo(c, w + dodatakKrila(c), h + dodatakKrila(c), br, cvor.otvaranje);
    return;
  }
  if (cvor.stulp && stulp(c, cvor, w, h)) return;

  // Podela prečkama: osa prečke je na proporcionalnom mestu (po udelima),
  // a svako polje gubi pola širine prečke na strani gde se graniči sa prečkom.
  const sirinaPrecke = profil(c.sistem, "PRECKA")?.sirinaOdbitak ?? 42;
  const n = cvor.delovi.length;
  const duz = cvor.smer === "V" ? w : h;
  const ukupno = cvor.delovi.reduce((s, d) => s + d.udeo, 0);
  c.precke += n - 1;
  const meraPrecke = Math.round(cvor.smer === "V" ? h : w);
  dodaj(c.rezovi, {
    kljuc: "PRECKA",
    element: cvor.smer === "V" ? "Vertikalna prečka" : "Horizontalna prečka",
    oznaka: cvor.smer === "V" ? "PRV" : "PRH",
    mera: meraPrecke,
    kom: n - 1,
  });
  if (c.pvc) dodaj(c.celik, { kljuc: "CELIK_RAMA", element: "Čelik prečke", oznaka: "PR", mera: meraPrecke, kom: n - 1 });

  cvor.delovi.forEach((d, i) => {
    const granice = (i > 0 ? 1 : 0) + (i < n - 1 ? 1 : 0);
    const vel = (duz * d.udeo) / ukupno - (granice * sirinaPrecke) / 2;
    if (cvor.smer === "V") obidji(c, d.sadrzaj, vel, h);
    else obidji(c, d.sadrzaj, w, vel);
  });
}

// ───────────── Okov ─────────────
function izracunajOkov(k: Kontekst, krila: Ctx["krila"], stulpovi: number): OkovRez[] {
  const cena = (kljuc: string) => k.okov.find((o) => o.kljuc === kljuc);
  const out: OkovRez[] = [];
  const dodajO = (kljuc: string, kol: number) => {
    const o = cena(kljuc);
    if (!o || kol <= 0) return;
    // štulp okov je drugi artikal od okova običnog krila (npr. „Donja šarka“ postoji u obe grupe) –
    // zbraja se odvojeno da se u trebovanju ne pomeša
    const naziv = o.grupa === "STULP" ? `${o.naziv} (štulp)` : o.naziv;
    const postoji = out.find((x) => x.naziv === naziv);
    if (postoji) postoji.kolicina = r2(postoji.kolicina + kol);
    else out.push({ naziv, kolicina: r2(kol), jedinica: o.poMetru ? "m" : "kom", cena: o.cena });
  };

  for (const kr of krila) {
    const sm = kr.sirina / 1000;
    const vm = kr.visina / 1000;
    const o = kr.otvaranje;
    if (o === "PSK_L" || o === "PSK_D" || o === "HST_L" || o === "HST_D") {
      dodajO("PSK_KRILO", 1);
      continue;
    }
    if (o === "VRATA_L" || o === "VRATA_D") {
      dodajO("VRATNA_BRAVA", 1);
      dodajO("CILINDAR", 1);
      dodajO("KVAKE", 1);
      dodajO("SARKA_VRATA", 3);
      dodajO("PRIHVATNICI_BRAVE", 1);
      dodajO("PRIHVATNA_PLOCA", 1);
      continue;
    }
    if (k.okovMetoda === "PAUSALNO") {
      const postoji = out.find((x) => x.naziv === "Okov paušalno");
      const m2 = r2(sm * vm);
      if (postoji) postoji.kolicina = r2(postoji.kolicina + m2);
      else out.push({ naziv: "Okov paušalno", kolicina: m2, jedinica: "m²", cena: k.okovPoM2 });
      continue;
    }
    if (o === "O_L" || o === "O_D") {
      // pomoćno (štulp) krilo
      for (const kl of ["S_GORNJA_SARKA", "S_DONJA_SARKA", "RIGLA_GORE", "RIGLA_DOLE", "KLIN", "PRIHVATNICI_STULP", "NOSACI_SARKI_RAM", "PRIHVATNIK_KLINA", "PRIHVATNIK_RIGLE_GORE", "PRIHVATNIK_RIGLE_DOLE"]) dodajO(kl, 1);
      continue;
    }
    if (o === "KIP") {
      // samo kip (nadsvetlo, ventus): ručica i kremona gore po širini, ugaoni prenosnici u oba gornja
      // ugla, zatvarači gore i po jedan sa strane, dve bočne makaze i dve kip šarke dole
      dodajO("GORNJI_UGAO", 2);
      dodajO("BRAVA", sm);
      dodajO("RUCICA", 1);
      dodajO("PRIHVATNIK_ZATVARACA", Math.max(2, Math.ceil(sm / 0.6)) + 2);
      dodajO("MAKAZA", 2);
      dodajO("KIP_SARKA", 2);
      continue;
    }
    // okretno-nagibno: kremona po visini (strana ručice)
    dodajO("GORNJI_UGAO", 1);
    dodajO("DONJI_UGAO", 1);
    dodajO("BRAVA", vm);
    dodajO("RUCICA", 1);
    dodajO("PRIHVATNIK_ZATVARACA", Math.max(2, Math.ceil(vm / 0.6)));
    dodajO("NOSAC_MAKAZE", sm);
    dodajO("MAKAZA", 1);
    dodajO("LEDJNA_SINA", vm);
    dodajO("DONJA_SARKA", 1);
    dodajO("NOSAC_GORNJE_SARKE", 1);
    dodajO("NOSAC_DONJE_SARKE", 1);
    dodajO("KIP_PRIHVATNIK", 1);
  }
  void stulpovi;
  return out;
}

// ───────────── Glavna funkcija ─────────────
export function izracunaj(k: Kontekst, s: StavkaUlaz): Rezultat {
  const prazno: Rezultat = { rezovi: [], celik: [], staklo: [], okov: [], komadi: [], troskovi: [], trosakKom: 0, cenaKom: 0, povrsina: 0 };
  const W = s.sirina || 0;
  const H = s.visina || 0;
  const pdv = 1 + k.pdvStopa / 100;
  const marza = 1 + (s.marza || 0) / 100;

  // ── Ostale vrste: roletna, komarnik (m²), daska, okapnica (m¹)
  if (s.vrsta !== "PROZOR" && s.vrsta !== "VRATA") {
    const kat = VRSTA_CENOVNIK[s.vrsta]!;
    const mat = k.cenovnik.find((c) => c.kategorija === kat && c.naziv === s.materijal) ?? k.cenovnik.find((c) => c.kategorija === kat);
    const poM2 = s.vrsta === "ROLETNA" || s.vrsta === "KOMARNIK";
    const kolicina = poM2 ? (W * H) / 1e6 : W / 1000;
    const trosak = r2((mat?.cena ?? 0) * kolicina);
    const cena = s.rucnaCena ?? r2(trosak * marza);
    return {
      ...prazno,
      troskovi: [{ naziv: `${mat?.naziv ?? "Materijal"} (${r2(kolicina)} ${poM2 ? "m²" : "m"})`, iznos: trosak }],
      trosakKom: trosak,
      cenaKom: cena,
      povrsina: 0,
    };
  }

  const sistem = k.sistemi.find((x) => x.id === s.sistemId) ?? k.sistemi[0];
  if (!sistem) return { ...prazno, greska: "Nema unetih profilnih sistema." };
  if (W < 300 || H < 300) return { ...prazno, greska: "Dimenzije moraju biti najmanje 300 × 300 mm." };

  const pvc = sistem.tip === "PVC";
  const vrataVrsta = s.vrsta === "VRATA";
  const model =
    k.modeli.find((m) => m.sifra === s.modelSifra) ??
    k.modeli.find((m) => m.sifra === PODRAZUMEVANI_MODEL[vrataVrsta ? "VRATA" : "PROZOR"]);
  const definicija: Cvor = model?.definicija ?? { tip: "polje", otvaranje: "FIKS" };

  const c: Ctx = { sistem, pvc, vrata: vrataVrsta, rezovi: [], celik: [], staklo: [], krila: [], precke: 0, stulpovi: 0, brojPolja: 0 };

  const mo = mereOpcija(s, sistem);
  const pRam = profil(sistem, "RAM")?.unutrasnjaVisina ?? 45;
  const pPrag = profil(sistem, "PRAG");

  const Wn = W - mo.prosirenjeL - mo.prosirenjeD;
  const Hn = H - mo.podstok;
  const v = pvc ? 2 * VAR : 0;

  // Ram (kod vrata donja strana je prag ako postoji u sistemu)
  const saPragom = vrataVrsta && !!pPrag;
  dodaj(c.rezovi, { kljuc: "RAM", element: saPragom ? "Širina rama (gore)" : "Širina rama (gore/dole)", oznaka: "RH", mera: Math.round(Wn + v), kom: saPragom ? 1 : 2 });
  dodaj(c.rezovi, { kljuc: "RAM", element: "Visina rama", oznaka: "RV", mera: Math.round(Hn + v), kom: 2 });
  if (saPragom) dodaj(c.rezovi, { kljuc: "PRAG", element: "Prag", oznaka: "PG", mera: Math.round(Wn), kom: 1 });
  if (pvc) {
    dodaj(c.celik, { kljuc: "CELIK_RAMA", element: "Čelik rama Š", oznaka: "RH", mera: Math.round(Wn + v - CELIK_ODBITAK), kom: saPragom ? 1 : 2 });
    dodaj(c.celik, { kljuc: "CELIK_RAMA", element: "Čelik rama V", oznaka: "RV", mera: Math.round(Hn + v - CELIK_ODBITAK), kom: 2 });
  }
  if (s.prosirenjeL) dodaj(c.rezovi, { kljuc: "PROSIRENJE", element: `Proširenje levo (${mo.prosirenjeL} mm)`, oznaka: "PL", mera: Math.round(Hn), kom: 1 });
  if (s.prosirenjeD) dodaj(c.rezovi, { kljuc: "PROSIRENJE", element: `Proširenje desno (${mo.prosirenjeD} mm)`, oznaka: "PD", mera: Math.round(Hn), kom: 1 });
  if (s.podstok) dodaj(c.rezovi, { kljuc: "PODSTOK", element: `Podštok (${mo.podstok} mm)`, oznaka: "PS", mera: Math.round(W), kom: 1 });

  // Svetli otvor rama → polja
  const dno = saPragom ? pPrag!.unutrasnjaVisina ?? pRam : pRam;
  obidji(c, definicija, Wn - 2 * pRam, Hn - pRam - dno);

  // ── Troškovi
  const troskovi: TrosakRed[] = [];
  const poProfilu = new Map<string, number>();
  for (const r of [...c.rezovi, ...c.celik]) poProfilu.set(r.kljuc, (poProfilu.get(r.kljuc) ?? 0) + (r.mera * r.kom) / 1000);
  let profiliCena = 0; // bez čelika – čelik se ne boji
  for (const [kljuc, metara] of poProfilu) {
    const p = profil(sistem, kljuc);
    if (!p) continue;
    const iznos = metara * p.cena;
    troskovi.push({ naziv: `${p.naziv} (${r2(metara)} m)`, iznos });
    if (!kljuc.startsWith("CELIK")) profiliCena += iznos;
  }
  // Doplata za boju (dekor/folija) – procenat na cenu profila
  const boja = k.boje.find((b) => b.sifra === s.boja);
  if (boja && boja.doplata > 0 && profiliCena > 0) {
    troskovi.push({ naziv: `Doplata za boju: ${boja.naziv} (+${boja.doplata}% na profile)`, iznos: (profiliCena * boja.doplata) / 100 });
  }

  const komadi: Rezultat["komadi"] = [];
  const spojnica = profil(sistem, "SPOJNICA_PRECKE");
  if (c.precke > 0 && spojnica) komadi.push({ naziv: spojnica.naziv, kom: c.precke * 2, cena: spojnica.cena });
  const poklopac = profil(sistem, "POKLOPAC_STULPA");
  if (c.stulpovi > 0 && poklopac) komadi.push({ naziv: poklopac.naziv, kom: c.stulpovi * 2, cena: poklopac.cena });
  for (const km of komadi) if (km.cena) troskovi.push({ naziv: `${km.naziv} (${km.kom} kom)`, iznos: km.kom * km.cena });

  // Kod vrata sa panelom ispuna krila vrata je panel, ne staklo
  const panelIzabran = vrataVrsta && !!s.panelSifra && k.paneli.some((p) => p.sifra === s.panelSifra);
  if (panelIzabran) {
    for (const g of c.staklo) if (g.opis.endsWith("(krilo)") && c.krila.some((kr) => kr.otvaranje.startsWith("VRATA"))) g.opis = g.opis.replace("(krilo)", "(panel)");
  }
  const staklo = k.cenovnik.find((x) => x.kategorija === "STAKLO" && x.naziv === s.staklo) ?? k.cenovnik.find((x) => x.kategorija === "STAKLO");
  const m2Stakla = c.staklo.filter((g) => !g.opis.endsWith("(panel)")).reduce((a, g) => a + (g.sirina * g.visina * g.kom) / 1e6, 0);
  if (staklo) troskovi.push({ naziv: `Staklo ${staklo.naziv} (${r2(m2Stakla)} m²)`, iznos: m2Stakla * staklo.cena });

  const okov = izracunajOkov(k, c.krila, c.stulpovi);
  const okovUkupno = okov.reduce((a, o) => a + o.kolicina * o.cena, 0);
  if (okovUkupno) troskovi.push({ naziv: "Okov", iznos: okovUkupno });

  if (vrataVrsta) {
    const ruk = k.cenovnik.find((x) => x.kategorija === "RUKOHVAT" && x.naziv === s.rukohvat);
    if (ruk) troskovi.push({ naziv: `Rukohvat ${ruk.naziv}`, iznos: ruk.cena });
    const dod = k.cenovnik.filter((x) => x.kategorija === "DODATAK_VRATA");
    if (s.elektroPrihvatnik && dod[0]) troskovi.push({ naziv: dod[0].naziv, iznos: dod[0].cena });
    if (s.automat && dod[1]) troskovi.push({ naziv: dod[1].naziv, iznos: dod[1].cena });
  }

  // Dodaci uz poziciju: komarnik po m² pozicije, roletna po m² pozicije + kutije
  // (ukupna visina zavese), daska i okapnica po m¹ širine
  for (const d of DODACI) {
    const naziv = s[d.polje];
    if (!naziv) continue;
    const mat = k.cenovnik.find((x) => x.kategorija === d.kategorija && x.naziv === naziv);
    if (!mat) continue;
    const visina = d.polje === "roletna" ? H + visinaRoletne(s.roletnaVisina) : H;
    const kol = d.jedinica === "m²" ? (W * visina) / 1e6 : W / 1000;
    troskovi.push({ naziv: `${d.naziv}: ${mat.naziv} (${r2(kol)} ${d.jedinica})`, iznos: kol * mat.cena });
  }

  const trosakKom = r2(troskovi.reduce((a, t) => a + t.iznos, 0));
  // Panel se zadaje kao cena sa PDV-om → dodaje se neto, bez marže
  const panel = vrataVrsta ? k.paneli.find((p) => p.sifra === s.panelSifra) : undefined;
  const panelNeto = panel ? panel.cena / pdv : 0;
  const cenaKom = s.rucnaCena ?? r2(trosakKom * marza + panelNeto);

  return {
    rezovi: c.rezovi,
    celik: c.celik,
    staklo: c.staklo,
    okov,
    komadi,
    troskovi: troskovi.map((t) => ({ ...t, iznos: r2(t.iznos) })).concat(panel ? [{ naziv: `Panel ${panel.naziv} (prodajna, neto)`, iznos: r2(panelNeto) }] : []),
    trosakKom: r2(trosakKom + panelNeto),
    cenaKom,
    povrsina: (W * H) / 1e6,
  };
}

// ───────────── Zbir ponude ─────────────
export type Opcije = { bezPdv: boolean; montazaUCenu: boolean; bezMontaze: boolean };
export type Zbir = {
  ukupnoBezPdv: number;
  pdv: number;
  ukupnoSaPdv: number;
  montaza: number;
  ukupnoZaNaplatu: number;
  trosakMaterijala: number;
  povrsina: number;
};

export function zbir(k: Kontekst, stavke: { r: Rezultat; kolicina: number }[], o: Opcije): Zbir {
  const povrsina = stavke.reduce((a, s) => a + s.r.povrsina * s.kolicina, 0);
  const montazaIznos = o.bezMontaze ? 0 : r2(povrsina * k.montazaPoM2);
  let ukupnoBezPdv = stavke.reduce((a, s) => a + s.r.cenaKom * s.kolicina, 0);
  if (o.montazaUCenu) ukupnoBezPdv += montazaIznos;
  ukupnoBezPdv = r2(ukupnoBezPdv);
  const pdv = o.bezPdv ? 0 : r2((ukupnoBezPdv * k.pdvStopa) / 100);
  const ukupnoSaPdv = r2(ukupnoBezPdv + pdv);
  const montaza = o.montazaUCenu ? 0 : montazaIznos;
  return {
    ukupnoBezPdv,
    pdv,
    ukupnoSaPdv,
    montaza,
    ukupnoZaNaplatu: r2(ukupnoSaPdv + montaza),
    trosakMaterijala: r2(stavke.reduce((a, s) => a + s.r.trosakKom * s.kolicina, 0)),
    povrsina: r2(povrsina),
  };
}

/** Kratak opis stavke za ponudu i račun. */
export function opisStavke(s: StavkaUlaz, k: Kontekst): { naslov: string; detalji: string } {
  const vrsta = VRSTE.find((v) => v.k === s.vrsta)?.n ?? s.vrsta;
  const naslov = `${vrsta} ${s.sirina}x${s.visina}mm`;
  if (s.vrsta !== "PROZOR" && s.vrsta !== "VRATA") return { naslov, detalji: s.materijal ?? "" };
  const sistem = k.sistemi.find((x) => x.id === s.sistemId);
  const d = [
    s.modelSifra && `Model: ${s.modelSifra}`,
    sistem && `Profil: ${sistem.naziv}`,
    s.staklo && `Staklo: ${s.staklo}`,
    s.boja && s.boja !== "BELA" && `Boja: ${k.boje.find((b) => b.sifra === s.boja)?.naziv ?? s.boja}`,
    s.panelSifra && `Panel: ${k.paneli.find((p) => p.sifra === s.panelSifra)?.naziv ?? s.panelSifra}`,
    s.rukohvat && `Rukohvat ${s.rukohvat}`,
    s.elektroPrihvatnik && "Elektro prihvatnik",
    s.automat && "Automat",
    s.podstok && `Podštok ${mereOpcija(s, sistem).podstok} mm`,
    (s.prosirenjeL || s.prosirenjeD) &&
      `Proširenje: ${[s.prosirenjeL && `levo ${mereOpcija(s, sistem).prosirenjeL} mm`, s.prosirenjeD && `desno ${mereOpcija(s, sistem).prosirenjeD} mm`].filter(Boolean).join(" i ")}`,
    (s.spojL || s.spojD) && `Spoj: ${[s.spojL && "levo", s.spojD && "desno"].filter(Boolean).join(" i ")}`,
    ...DODACI.map(
      (d) => s[d.polje] && `${d.naziv}: ${s[d.polje]}${d.polje === "roletna" ? ` (kutija ${visinaRoletne(s.roletnaVisina)} mm, kaiš ${stranaKaisa(s.roletnaKais) === "L" ? "levo" : "desno"})` : ""}`,
    ),
  ].filter(Boolean);
  return { naslov, detalji: d.join(", ") };
}
