// Poprečni preseci profila za 3D modele – PVC Salamander bluEvolution 92.
// Koordinate u mm: x = dubina (0 = spoljna strana, raste ka unutra),
// y = visina (0 = strana prema zidu / ka štoku, raste ka sredini prozora).
//
// Izvor: cenovnik Lyctum „PVC profili za prozore i vrata“ (ver. 20261021), str. 35–37 –
// crteži sa kotama: štok 170820 (92×83, unutra 46), krilo 171820 (92×80, spolja 44, unutra 60),
// T prečka 172420 (92×116, telo 42), lajsna za staklo 48 mm 413821 (21,5×20),
// ojačanje štok/krilo 2823289.15 (U 35×28×1,5 sa kosinom 18°), ojačanje T prečke 40204020.20 (40×20×2)
// i sklop štok + krilo. Spoljne kote su iz PDF-a; unutrašnje komore su očitane sa crteža (±1 mm).

export type Tacka = [x: number, y: number, r?: number]; // r = radijus zaobljenja ugla
export type Kontura = Tacka[];

export type Presek = {
  naziv: string;
  sifra: string;
  artikal: string;
  opis: string;
  duzinaSipke: number;
  spoljna: Kontura;
  komore: { kontura: Kontura; naziv: string }[];
  zaptivke: { kontura: Kontura; naziv: string }[];
  /** čelično ojačanje: ili cev (spoljna + unutrasnja) ili otvoren profil (samo spoljna kontura) */
  celik?: { spoljna: Kontura; unutrasnja?: Kontura; naziv: string; duzina: number };
  kote: { naziv: string; vrednost: string }[];
  /** kote na 2D preseku: h = vodoravna (od a do b po x, na visini poz), v = uspravna (od a do b po y, na x = poz) */
  koteCrtez: { tip: "h" | "v"; a: number; b: number; poz: number; tekst: string }[];
  /** šta je levo/desno na preseku */
  strane: [string, string];
};

const pravougaonik = (x1: number, y1: number, x2: number, y2: number, r = 1): Kontura => [
  [x1, y1, r],
  [x2, y1, r],
  [x2, y2, r],
  [x1, y2, r],
];
const pomeri = (k: Kontura, dx: number, dy: number): Kontura => k.map(([x, y, r]) => [x + dx, y + dy, r] as Tacka);
const ogledaloY = (k: Kontura): Kontura => k.map(([x, y, r]) => [x, -y, r] as Tacka).reverse();

/** Ojačanje štoka i krila 2823289.15: U 35×28×1,5, desni krak sa preklopom 9,6, kosina dna 18°. */
const U_OJACANJE: Kontura = [
  [0, 0, 0.4],
  [23, 0, 0.3],
  [35, 3.9, 0.4],
  [35, 28, 0.3],
  [25.4, 28, 0.2],
  [25.4, 26.5, 0.2],
  [33.5, 26.5, 0.2],
  [33.5, 4.9, 0.3],
  [23.2, 1.5, 0.3],
  [1.5, 1.5, 0.2],
  [1.5, 28, 0.2],
  [0, 28, 0.2],
];

// ───────────── ŠTOK 170820 ─────────────
export const BE92_RAM: Presek = {
  naziv: "Salamander bluEvolution 92 – štok",
  sifra: "BE92-RAM",
  artikal: "170820",
  opis: "Štok 92 × 83 mm, spoljna zaptivka, „peraja“ za srednju zaptivku krila, U ojačanje 35×28×1,5",
  duzinaSipke: 6500,
  spoljna: [
    [0, 0, 1.5],
    [92, 0, 1.5],
    [92, 47.5, 1],
    [88.5, 47.5, 0.4], // žleb za lajsnu
    [88.5, 44, 0.4],
    [84, 44, 0.4],
    [84, 47.5, 0.4],
    [80, 47.5, 0.8],
    [80, 42, 0.6], // pod falca
    [40.4, 42, 0.6],
    [40, 54, 0.4],
    [38.9, 67.3, 0.6], // peraja (naleganje srednje zaptivke krila)
    [36.4, 67.3, 0.6],
    [33, 56, 1],
    [19.5, 55, 3], // kanal
    [15.5, 58, 1.2],
    [15, 75, 1],
    [12, 80.5, 1], // spoljna usna
    [0, 78, 1.5],
  ],
  komore: [
    { kontura: pravougaonik(3, 58.5, 12.5, 75.5, 1), naziv: "1 – usna" },
    { kontura: pravougaonik(3, 38.5, 14.5, 53, 1), naziv: "2 – spoljna gornja" },
    { kontura: pravougaonik(3, 9, 14.5, 36, 1), naziv: "3 – spoljna donja" },
    { kontura: pravougaonik(17, 38.5, 25.5, 52.5, 1), naziv: "4 – izolaciona gornja" },
    { kontura: pravougaonik(17, 9, 25.5, 36, 1), naziv: "5 – izolaciona donja" },
    { kontura: pravougaonik(28, 38.5, 34, 52.5, 0.8), naziv: "6 – ispod peraje" },
    { kontura: pravougaonik(28, 9, 37.5, 36, 1), naziv: "7 – srednja donja" },
    { kontura: pravougaonik(40.5, 9, 77.5, 39.5, 1.5), naziv: "8 – glavna (čelik)" },
    { kontura: pravougaonik(80, 22, 89.5, 39.5, 1), naziv: "9 – unutrašnja gornja" },
    { kontura: pravougaonik(80, 9, 89.5, 19.5, 1), naziv: "10 – unutrašnja donja" },
  ],
  zaptivke: [
    {
      naziv: "Spoljna zaptivka štoka (EPDM)",
      kontura: [
        [12.5, 79.5, 0.3],
        [18.5, 77, 0.4],
        [21.5, 80, 1],
        [19.5, 83, 1.2],
        [15, 82.5, 1],
      ],
    },
  ],
  celik: { naziv: "Ojačanje štoka 2823289.15 – U 35×28×1,5", spoljna: pomeri(U_OJACANJE, 41.5, 10.5), duzina: 6000 },
  kote: [
    { naziv: "Artikal", vrednost: "170820" },
    { naziv: "Ugradna dubina", vrednost: "92 mm" },
    { naziv: "Visina (sa zaptivkom)", vrednost: "83 mm" },
    { naziv: "Unutrašnja strana", vrednost: "46 mm" },
    { naziv: "Pod falca", vrednost: "≈ 42 mm" },
    { naziv: "Ojačanje", vrednost: "U 35×28×1,5 (2823289.15)" },
    { naziv: "Cena (PDF)", vrednost: "53,00 € / 6,5 m" },
  ],
  koteCrtez: [
    { tip: "h", a: 0, b: 92, poz: 90, tekst: "92" },
    { tip: "v", a: 0, b: 83, poz: -9, tekst: "83" },
    { tip: "v", a: 0, b: 46, poz: 101, tekst: "46" },
  ],
  strane: ["SPOLJA", "UNUTRA"],
};

// ───────────── KRILO 171820 ─────────────
// U sklopu: spoljna ivica krila je 46 mm od spoljne ivice štoka, krilo je ~30 mm pomereno ka unutra.
export const BE92_KRILO: Presek = {
  naziv: "Salamander bluEvolution 92 – krilo",
  sifra: "BE92-KRILO",
  artikal: "171820",
  opis: "Krilo 92 × 80 mm, zaptivka stakla, srednja i unutrašnja zaptivka, U ojačanje 35×28×1,5",
  duzinaSipke: 6500,
  spoljna: [
    [0, 37, 1],
    [12, 37, 0.6], // nos spoljne usne
    [12, 33, 0.6],
    [24, 31, 0.8],
    [24, 22, 0.6],
    [72, 22, 0.6],
    [72, 0, 1], // unutrašnji preklop
    [92, 0, 1.5],
    [92, 60.5, 1],
    [88.5, 60.5, 0.4], // žleb za lajsnu
    [88.5, 57, 0.4],
    [84, 57, 0.4],
    [84, 60.5, 0.4],
    [78, 60.5, 0.6],
    [78, 58, 0.6],
    [19, 56, 2.5], // pod falca za staklo
    [15, 62, 1],
    [14.5, 74, 1],
    [13, 80, 1], // spoljna usna krila
    [0, 77, 1.5],
  ],
  komore: [
    { kontura: pravougaonik(3, 40, 12, 74, 1), naziv: "1 – spoljna usna" },
    { kontura: pravougaonik(16, 34.5, 22, 52, 0.8), naziv: "2 – spoljna" },
    { kontura: pravougaonik(26.5, 24.5, 31.5, 53, 0.8), naziv: "3 – izolaciona" },
    { kontura: pravougaonik(34, 24.5, 70, 53.5, 1.5), naziv: "4 – glavna (čelik)" },
    { kontura: pravougaonik(74.5, 2.5, 89.5, 19.5, 1), naziv: "5 – preklop" },
    { kontura: pravougaonik(74.5, 22, 89.5, 54, 1), naziv: "6 – unutrašnja" },
  ],
  zaptivke: [
    {
      naziv: "Spoljna zaptivka stakla (EPDM)",
      kontura: [
        [14.5, 67, 0.3],
        [14.6, 74, 0.3],
        [19, 75, 1],
        [20.5, 71.5, 1],
        [18, 68, 0.8],
      ],
    },
    {
      naziv: "Srednja zaptivka krila (EPDM)",
      kontura: [
        [13, 32.8, 0.3],
        [21, 31.3, 0.3],
        [21.5, 27, 1],
        [17.5, 24, 1.5],
        [13.5, 27, 1],
      ],
    },
    {
      naziv: "Unutrašnja zaptivka krila (EPDM)",
      kontura: [
        [72, 6, 0.3],
        [72, 1, 0.3],
        [68.5, -3.5, 1],
        [64.5, -2, 1.2],
        [66, 3.5, 1],
      ],
    },
  ],
  // U okrenut otvorom nadole (ka okovnom žlebu)
  celik: {
    naziv: "Ojačanje krila 2823289.15 – U 35×28×1,5",
    spoljna: pomeri(U_OJACANJE.map(([x, y, r]) => [x, 28 - y, r] as Tacka).reverse(), 34.5, 25),
    duzina: 6000,
  },
  kote: [
    { naziv: "Artikal", vrednost: "171820" },
    { naziv: "Dubina", vrednost: "92 mm" },
    { naziv: "Visina", vrednost: "80 mm" },
    { naziv: "Spoljna usna", vrednost: "44 mm" },
    { naziv: "Unutrašnja strana", vrednost: "60 mm" },
    { naziv: "Staklo (lajsna 48 mm)", vrednost: "48 mm" },
    { naziv: "Cena (PDF)", vrednost: "59,00 € / 6,5 m" },
  ],
  koteCrtez: [
    { tip: "h", a: 0, b: 92, poz: 88, tekst: "92" },
    { tip: "v", a: 0, b: 80, poz: -16, tekst: "80" },
    { tip: "v", a: 36, b: 80, poz: -9, tekst: "44" },
    { tip: "v", a: 0, b: 60.5, poz: 101, tekst: "60" },
  ],
  strane: ["SPOLJA", "UNUTRA"],
};

// ───────────── LAJSNA 413821 (za staklo 48 mm) ─────────────
export const BE92_LAJSNA: Presek = {
  naziv: "Salamander bluEvolution 92 – lajsna za staklo 48 mm",
  sifra: "BE92-LAJSNA",
  artikal: "413821",
  opis: "Lajsna 21,5 × 20 mm, kosi gornji deo, noga za kačenje u žleb, dvostruka zaptivka prema staklu",
  duzinaSipke: 6000,
  spoljna: [
    [1.5, 20, 0.6],
    [17.5, 15, 1],
    [19.5, 14, 1],
    [19.5, 0, 0.5],
    [14, 0, 0.3], // noga
    [13.5, -4, 0.8],
    [11, -6, 1],
    [9.5, -5, 0.5],
    [11.5, -3.8, 0.5],
    [12, 0, 0.3],
    [8, 0, 2],
    [1.5, 5, 1.5],
  ],
  komore: [
    {
      kontura: [
        [5, 6, 1],
        [9, 4, 1],
        [16.5, 4, 1],
        [16.5, 13, 1],
        [4.5, 16.5, 1],
      ],
      naziv: "1 – šupljina lajsne",
    },
  ],
  zaptivke: [
    {
      naziv: "Zaptivka stakla (EPDM)",
      kontura: [
        [1.5, 6.5, 0.3],
        [1.5, 19.5, 0.3],
        [-1.5, 20.5, 0.8],
        [-2.8, 18, 0.8],
        [-1.2, 15, 0.6],
        [-2.8, 9, 0.8],
        [-1.5, 6.5, 0.6],
      ],
    },
  ],
  kote: [
    { naziv: "Artikal", vrednost: "413821" },
    { naziv: "Širina", vrednost: "21,5 mm" },
    { naziv: "Visina", vrednost: "20 mm" },
    { naziv: "Za staklo", vrednost: "48 mm" },
    { naziv: "Rez pri ugradnji", vrednost: "45°/45°" },
    { naziv: "Cena (PDF)", vrednost: "11,00 € / 6 m" },
  ],
  koteCrtez: [
    { tip: "h", a: -2.8, b: 19.5, poz: 24, tekst: "21,5" },
    { tip: "v", a: 0, b: 20, poz: 25, tekst: "20" },
  ],
  strane: ["STAKLO", "UNUTRA"],
};

// ───────────── T PREČKA 172420 ─────────────
// Simetrična oko y = 0: spoljni deo (116 mm sa zaptivkama) sa usnama i perajama na obe strane,
// telo ka unutra širine 42 mm sa žlebovima za lajsne.
const T_GORE: Kontura = [
  [0, 53.5, 1.5],
  [12, 55.5, 1],
  [15, 51, 1],
  [15.5, 33.5, 1.2],
  [19.5, 30.5, 3],
  [33.5, 31.5, 1],
  [36.4, 42.5, 0.6],
  [38.9, 42.5, 0.6],
  [40, 28, 0.4],
  [40.5, 21, 0.6],
  [80, 21, 0.6],
  [80, 23, 0.8],
  [84, 23, 0.4],
  [84, 19.5, 0.4],
  [88.5, 19.5, 0.4],
  [88.5, 23, 0.4],
  [92, 23, 1],
];
const zaptivkaT: Kontura = [
  [12.5, 54.5, 0.3],
  [18.5, 52, 0.4],
  [21.5, 55, 1],
  [19.5, 58, 1.2],
  [15, 57.5, 1],
];
const komoraTGore = (x1: number, x2: number, y1: number, y2: number, n: string) => [
  { kontura: pravougaonik(x1, y1, x2, y2, 1), naziv: `${n} gore` },
  { kontura: ogledaloY(pravougaonik(x1, y1, x2, y2, 1)), naziv: `${n} dole` },
];

export const BE92_PRECKA: Presek = {
  naziv: "Salamander bluEvolution 92 – T prečka",
  sifra: "BE92-PRECKA",
  artikal: "172420",
  opis: "T prečka 92 × 116 mm, telo 42 mm, spoljne zaptivke sa obe strane, ojačanje 40×20×2",
  duzinaSipke: 6500,
  spoljna: [...T_GORE, ...ogledaloY(T_GORE)],
  komore: [
    ...komoraTGore(3, 12.5, 34.5, 50.5, "usna"),
    ...komoraTGore(3, 14, 12, 30, "spoljna"),
    { kontura: pravougaonik(3, -10, 14, 10, 1), naziv: "spoljna sredina" },
    ...komoraTGore(16.5, 25.5, 12, 27.5, "izolaciona"),
    { kontura: pravougaonik(16.5, -10, 25.5, 10, 1), naziv: "izolaciona sredina" },
    ...komoraTGore(28, 35, 12, 28, "ispod peraje"),
    { kontura: pravougaonik(28, -10, 37.5, 10, 1), naziv: "srednja" },
    { kontura: pravougaonik(40, -18, 81, 18, 1.5), naziv: "glavna (čelik)" },
    { kontura: pravougaonik(83.5, -16.5, 89.5, 16.5, 1), naziv: "unutrašnja" },
  ],
  zaptivke: [
    { naziv: "Spoljna zaptivka (EPDM), strana A", kontura: zaptivkaT },
    { naziv: "Spoljna zaptivka (EPDM), strana B", kontura: ogledaloY(zaptivkaT) },
  ],
  celik: {
    naziv: "Ojačanje T prečke 40204020.20 – cev 40×20×2",
    spoljna: pravougaonik(40.5, -10, 80.5, 10, 1.5),
    unutrasnja: pravougaonik(42.5, -8, 78.5, 8, 0.5),
    duzina: 6000,
  },
  kote: [
    { naziv: "Artikal", vrednost: "172420" },
    { naziv: "Dubina", vrednost: "92 mm" },
    { naziv: "Širina (sa zaptivkama)", vrednost: "116 mm" },
    { naziv: "Telo", vrednost: "42 mm" },
    { naziv: "Ojačanje", vrednost: "40×20×2 (40204020.20)" },
    { naziv: "Rez pri ugradnji", vrednost: "90° (ravno)" },
    { naziv: "Cena (PDF)", vrednost: "81,00 € / 6,5 m" },
  ],
  koteCrtez: [
    { tip: "h", a: 0, b: 92, poz: 64, tekst: "92" },
    { tip: "v", a: -58, b: 58, poz: -9, tekst: "116" },
    { tip: "v", a: -21, b: 21, poz: 101, tekst: "42" },
  ],
  strane: ["SPOLJA", "UNUTRA"],
};

export const PROFILI_3D: Presek[] = [BE92_RAM, BE92_KRILO, BE92_LAJSNA, BE92_PRECKA];

/** Mere sklopa (mm) kojima 3D prikaz prozora povezuje profile – očitane sa sklopa u PDF-u. */
export const SKLOP_BE92 = {
  usnaRama: 80.5, // svetli otvor počinje na vrhu spoljne usne štoka (80,5 mm od spoljne ivice)
  podFalca: 36, // prečka ulazi ispod usne do poda falca (štok 38,5 / T prečka 34,5)
  sirinaPrecke: 111, // vidljiva širina T prečke između usana (116 sa zaptivkama)
  preklopKrila: 34.5, // spoljna ivica krila je 34,5 mm ispod ivice usne (46 mm od spoljne ivice štoka)
  krilo: { pomakZ: 30, podStakla: 60, sedisteLajsne: 60.5, xLajsne: 70, dubina: 92 },
  staklo: { debljina: 48, zKrilo: 19.5, zFiks: 22, uvlacenje: 12 },
  fiks: { staklo: 12, lajsna: 20 }, // fiksno staklo: ivica 12 mm, lajsna 20 mm iza ivice svetlog otvora
  lajsnaFiks: { z: 72 },
  dubinaRama: 92,
  lazna: { sirina: 34, dubina: 96 }, // lažna prečka (štulp) 176030
};

/** Tačke zaobljenog poligona: za svaki ugao vraća [ulaz, kontrolna, izlaz] za kvadratnu krivu. */
export function zaobljeniUglovi(k: Kontura) {
  const n = k.length;
  return k.map(([x, y, r = 0], i) => {
    const [px, py] = k[(i - 1 + n) % n];
    const [nx, ny] = k[(i + 1) % n];
    const d1 = Math.hypot(px - x, py - y) || 1;
    const d2 = Math.hypot(nx - x, ny - y) || 1;
    const rr = Math.min(r, d1 / 2, d2 / 2);
    return {
      ulaz: [x + ((px - x) / d1) * rr, y + ((py - y) / d1) * rr] as [number, number],
      ugao: [x, y] as [number, number],
      izlaz: [x + ((nx - x) / d2) * rr, y + ((ny - y) / d2) * rr] as [number, number],
    };
  });
}

/** SVG putanja konture (y se okreće da bi „gore“ bilo gore na ekranu). */
export function svgPutanja(k: Kontura, visina: number) {
  const u = zaobljeniUglovi(k);
  const f = ([x, y]: [number, number]) => `${x.toFixed(2)} ${(visina - y).toFixed(2)}`;
  return u.map((t, i) => `${i === 0 ? "M" : "L"}${f(t.ulaz)} Q${f(t.ugao)} ${f(t.izlaz)}`).join(" ") + " Z";
}

/** Granice preseka (sve konture, uključujući zaptivke). */
export function granice(p: Presek) {
  const sve = [p.spoljna, ...p.zaptivke.map((z) => z.kontura)].flat();
  const xs = sve.map((t) => t[0]);
  const ys = sve.map((t) => t[1]);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}
