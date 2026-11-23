import type { Cvor, Otvaranje } from "@/lib/modeli-katalog";
import { napraviRaspored, type Pravougaonik } from "@/lib/prozor-raspored";

// Realističan 2D prikaz prozora/vrata gledano IZNUTRA, u pravim merama (mm) profila Salamander BE92:
// štok 46 mm, krilo do lajsne 60,5 mm + lajsna, T prečka 42 mm, uglovi sečeni pod 45°.
// Senčenje profila je prozirni gradijent preko osnovne boje, pa definicije ne zavise od boje
// (iste su za sve stavke na strani). Dekor (drvo) dobija šaru preko SVG filtera.

type R = { x: number; y: number; w: number; h: number };
type Tacka = [number, number];
type Strana = "gore" | "dole" | "levo" | "desno";

// mere iz sklopa BE92 (mm) – vidljivo iznutra
const STOK = 46; // od spoljne ivice štoka do ivice krila
const KRILO_TELO = 60.5; // od ivice krila do lajsne
const KRILO_STAKLO = 81; // od ivice krila do vidljivog stakla (posle lajsne)
const FIKS_LAJSNA = 34.5; // fiksno polje: lajsna počinje gde bi bila ivica krila…
const FIKS_STAKLO = 12.5; // …a staklo se vidi 12,5 mm iza ivice svetlog otvora
const PRECKA = 42; // vidljivo telo T prečke iznutra

// ───────────── boje ─────────────
const hexURgb = (h: string) => {
  const m = h.replace("#", "");
  const n = parseInt(m.length === 3 ? m.split("").map((c) => c + c).join("") : m, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
/** Meša boju sa drugom (t = 0 … 1). */
export function mesaj(hex: string, sa: string, t: number) {
  const a = hexURgb(hex);
  const b = hexURgb(sa);
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;
}
/** Da li je boja dekor folija (drvo) – braonkaste, zasićene boje. */
export function jeDekor(hex?: string) {
  if (!hex) return false;
  const [r, g, b] = hexURgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return false;
  const s = (max - min) / (1 - Math.abs(2 * l - 1));
  let h = max === r ? ((g - b) / (max - min)) % 6 : max === g ? (b - r) / (max - min) + 2 : (r - g) / (max - min) + 4;
  h *= 60;
  if (h < 0) h += 360;
  return s > 0.2 && h <= 50 && l < 0.75;
}

// ───────────── zajedničke definicije (gradijenti, filteri, šare) ─────────────
const STOPOVI: Record<"ram" | "krilo" | "lajsna", [number, string, number][]> = {
  ram: [[0, "#fff", 0.3], [0.12, "#fff", 0.06], [0.6, "#000", 0], [0.9, "#000", 0.08], [1, "#000", 0.22]],
  krilo: [[0, "#000", 0.12], [0.05, "#fff", 0.32], [0.25, "#fff", 0.06], [0.7, "#000", 0.02], [0.93, "#000", 0.1], [1, "#000", 0.26]],
  lajsna: [[0, "#000", 0.2], [0.3, "#fff", 0.24], [0.65, "#fff", 0.04], [1, "#000", 0.24]],
};
const SMER: Record<Strana, { x1: number; y1: number; x2: number; y2: number }> = {
  gore: { x1: 0, y1: 0, x2: 0, y2: 1 },
  dole: { x1: 0, y1: 1, x2: 0, y2: 0 },
  levo: { x1: 0, y1: 0, x2: 1, y2: 0 },
  desno: { x1: 1, y1: 0, x2: 0, y2: 0 },
};

/** Sve definicije realističnog prikaza; `id` je prefiks, `u` = 1/100 duže strane crteža (mm). */
export function RealnoDefs({ id, u }: { id: string; u: number }) {
  const lin = (ime: string, smer: { x1: number; y1: number; x2: number; y2: number }, stopovi: [number, string, number][]) => (
    <linearGradient key={ime} id={`${id}-${ime}`} {...smer}>
      {stopovi.map(([o, c, a], i) => (
        <stop key={i} offset={o} stopColor={c} stopOpacity={a} />
      ))}
    </linearGradient>
  );
  const drvo = (ime: string, frekv: string, seme: number) => (
    <filter id={`${id}-${ime}`} x="0" y="0" width="1" height="1" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency={frekv} numOctaves={3} seed={seme} result="n" />
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.22  0 0 0 0 0.11  0 0 0 0 0.03  1.7 0 0 0 -0.68" result="z" />
      <feComposite in="z" in2="SourceGraphic" operator="in" result="s" />
      <feMerge>
        <feMergeNode in="SourceGraphic" />
        <feMergeNode in="s" />
      </feMerge>
    </filter>
  );
  const mreza = Math.max(2.5, u * 0.45);
  return (
    <>
      {(Object.keys(STOPOVI) as (keyof typeof STOPOVI)[]).flatMap((v) => (Object.keys(SMER) as Strana[]).map((s) => lin(`${v}-${s}`, SMER[s], STOPOVI[v])))}
      {lin("precka-x", { x1: 0, y1: 0, x2: 1, y2: 0 }, [[0, "#000", 0.2], [0.12, "#fff", 0.22], [0.5, "#fff", 0.04], [0.88, "#000", 0.06], [1, "#000", 0.22]])}
      {lin("precka-y", { x1: 0, y1: 0, x2: 0, y2: 1 }, [[0, "#000", 0.2], [0.12, "#fff", 0.22], [0.5, "#fff", 0.04], [0.88, "#000", 0.06], [1, "#000", 0.22]])}
      {lin("ploca-x", { x1: 0, y1: 0, x2: 1, y2: 0 }, [[0, "#fff", 0.18], [0.5, "#fff", 0], [1, "#000", 0.12]])}
      {lin("ploca-y", { x1: 0, y1: 0, x2: 0, y2: 1 }, [[0, "#fff", 0.2], [0.55, "#fff", 0], [1, "#000", 0.16]])}
      {lin("senka-dole", { x1: 0, y1: 0, x2: 0, y2: 1 }, [[0, "#000", 0.34], [1, "#000", 0]])}
      {lin("senka-desno", { x1: 0, y1: 0, x2: 1, y2: 0 }, [[0, "#000", 0.22], [1, "#000", 0]])}
      <linearGradient id={`${id}-staklo`} x1="0" y1="0" x2="0.35" y2="1">
        <stop offset="0" stopColor="#e6f0f3" />
        <stop offset="0.45" stopColor="#c7d9de" />
        <stop offset="1" stopColor="#a8bec5" />
      </linearGradient>
      <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="0.55" stopColor="#ececeb" />
        <stop offset="1" stopColor="#c9cbcb" />
      </linearGradient>
      <linearGradient id={`${id}-celik`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#f1f3f4" />
        <stop offset="0.35" stopColor="#b6bbbf" />
        <stop offset="0.6" stopColor="#e4e7e9" />
        <stop offset="1" stopColor="#9aa1a6" />
      </linearGradient>
      <linearGradient id={`${id}-alu`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f0f2f2" />
        <stop offset="0.5" stopColor="#c9cfcf" />
        <stop offset="1" stopColor="#a9b0b0" />
      </linearGradient>
      <linearGradient id={`${id}-mermer`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="1" stopColor="#e2e1dc" />
      </linearGradient>
      <linearGradient id={`${id}-lamela`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity={0.35} />
        <stop offset="0.6" stopColor="#fff" stopOpacity={0} />
        <stop offset="1" stopColor="#000" stopOpacity={0.22} />
      </linearGradient>
      {drvo("drvoH", "0.0022 0.085", 3)}
      {drvo("drvoV", "0.085 0.0022", 7)}
      <filter id={`${id}-senka`} x="-10%" y="-10%" width="125%" height="125%">
        <feDropShadow dx={u * 0.12} dy={u * 0.22} stdDeviation={u * 0.18} floodColor="#000" floodOpacity={0.32} />
      </filter>
      <filter id={`${id}-senkaR`} x="-40%" y="-20%" width="200%" height="160%">
        <feDropShadow dx={u * 0.15} dy={u * 0.3} stdDeviation={u * 0.2} floodColor="#000" floodOpacity={0.38} />
      </filter>
      <pattern id={`${id}-mreza`} width={mreza} height={mreza} patternUnits="userSpaceOnUse">
        <path d={`M0 0 H${mreza} M0 0 V${mreza}`} stroke="#1f2526" strokeWidth={mreza * 0.14} strokeOpacity={0.5} fill="none" />
      </pattern>
      <pattern id={`${id}-kais`} width={16} height={6} patternUnits="userSpaceOnUse">
        <rect width={16} height={6} fill="#bdb6a6" />
        <rect y={0} width={16} height={2} fill="#a59e8e" />
      </pattern>
      <pattern id={`${id}-lamele`} width={10} height={37} patternUnits="userSpaceOnUse">
        <rect width={10} height={37} fill={`url(#${id}-lamela)`} />
        <rect y={35.5} width={10} height={1.5} fill="#000" fillOpacity={0.28} />
      </pattern>
    </>
  );
}

// ───────────── pomoćne funkcije crtanja ─────────────
const tacke = (p: Tacka[]) => p.map((t) => t.join(",")).join(" ");
const unutra = (r: R, d: number): R => ({ x: r.x + d, y: r.y + d, w: r.w - 2 * d, h: r.h - 2 * d });

/** Okvir od 4 člana sečena pod 45° između spoljnog i unutrašnjeg pravougaonika. */
function prsten(o: R, i: R): { strana: Strana; p: Tacka[] }[] {
  const tl: Tacka = [o.x, o.y], tr: Tacka = [o.x + o.w, o.y], br: Tacka = [o.x + o.w, o.y + o.h], bl: Tacka = [o.x, o.y + o.h];
  const itl: Tacka = [i.x, i.y], itr: Tacka = [i.x + i.w, i.y], ibr: Tacka = [i.x + i.w, i.y + i.h], ibl: Tacka = [i.x, i.y + i.h];
  return [
    { strana: "gore", p: [tl, tr, itr, itl] },
    { strana: "dole", p: [bl, br, ibr, ibl] },
    { strana: "levo", p: [tl, bl, ibl, itl] },
    { strana: "desno", p: [tr, br, ibr, itr] },
  ];
}

type Ctx = { id: string; u: number; prof: string; dekor: boolean };

function Okvir({ c, o, i, vrsta }: { c: Ctx; o: R; i: R; vrsta: "ram" | "krilo" | "lajsna" }) {
  return (
    <g>
      {prsten(o, i).map(({ strana, p }) => (
        <g key={strana}>
          <polygon points={tacke(p)} fill={c.prof} filter={c.dekor ? `url(#${c.id}-${strana === "gore" || strana === "dole" ? "drvoH" : "drvoV"})` : undefined} />
          <polygon points={tacke(p)} fill={`url(#${c.id}-${vrsta}-${strana})`} stroke="#000" strokeOpacity={0.22} strokeWidth={c.u * 0.06} strokeLinejoin="round" />
        </g>
      ))}
    </g>
  );
}

/** Ravna ploča (prečka, proširenje, podštok, lažna prečka) sa senčenjem po širini. */
function Ploca({ c, r, smer, grad = "precka" }: { c: Ctx; r: R; smer: "x" | "y"; grad?: "precka" | "ploca" }) {
  if (r.w <= 0 || r.h <= 0) return null;
  // šara drveta ide duž dužeg pravca
  const duz = r.w >= r.h ? "drvoH" : "drvoV";
  return (
    <g>
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={c.prof} filter={c.dekor ? `url(#${c.id}-${duz})` : undefined} />
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={`url(#${c.id}-${grad}-${smer})`} stroke="#000" strokeOpacity={0.22} strokeWidth={c.u * 0.06} />
    </g>
  );
}

function Staklo({ c, g, i, komarnik }: { c: Ctx; g: R; i: number; komarnik?: boolean }) {
  const clip = `${c.id}-c${i}`;
  const sh = Math.min(g.h, Math.max(6, c.u * 0.6));
  return (
    <g>
      <clipPath id={clip}>
        <rect x={g.x} y={g.y} width={g.w} height={g.h} />
      </clipPath>
      <rect x={g.x} y={g.y} width={g.w} height={g.h} fill={`url(#${c.id}-staklo)`} />
      <g clipPath={`url(#${clip})`}>
        {/* odsjaji neba na staklu */}
        <polygon points={tacke([[g.x + g.w * 0.52, g.y], [g.x + g.w * 0.74, g.y], [g.x + g.w * 0.3, g.y + g.h], [g.x + g.w * 0.08, g.y + g.h]])} fill="#fff" fillOpacity={0.16} />
        <polygon points={tacke([[g.x + g.w * 0.8, g.y], [g.x + g.w * 0.86, g.y], [g.x + g.w * 0.42, g.y + g.h], [g.x + g.w * 0.36, g.y + g.h]])} fill="#fff" fillOpacity={0.12} />
        {/* komarnik spolja – vidi se kroz staklo kao fina mrežica */}
        {komarnik && <rect x={g.x} y={g.y} width={g.w} height={g.h} fill={`url(#${c.id}-mreza)`} />}
        {/* senka lajsne na staklu (svetlo odozgo levo) */}
        <rect x={g.x} y={g.y} width={g.w} height={sh} fill={`url(#${c.id}-senka-dole)`} />
        <rect x={g.x} y={g.y} width={sh * 0.7} height={g.h} fill={`url(#${c.id}-senka-desno)`} />
      </g>
      <rect x={g.x} y={g.y} width={g.w} height={g.h} fill="none" stroke="#000" strokeOpacity={0.3} strokeWidth={c.u * 0.06} />
    </g>
  );
}

function Panel({ c, g, naziv, boja }: { c: Ctx; g: R; naziv?: string | null; boja: string }) {
  const d = Math.min(g.w, g.h) * 0.12;
  const r = unutra(g, d);
  return (
    <g>
      <rect x={g.x} y={g.y} width={g.w} height={g.h} fill={boja} filter={c.dekor ? `url(#${c.id}-drvoV)` : undefined} />
      <rect x={g.x} y={g.y} width={g.w} height={g.h} fill={`url(#${c.id}-ploca-y)`} stroke="#000" strokeOpacity={0.25} strokeWidth={c.u * 0.06} />
      {/* utisnuta kaseta panela */}
      {r.w > 0 && r.h > 0 && (
        <>
          <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="none" stroke="#000" strokeOpacity={0.22} strokeWidth={c.u * 0.12} />
          <rect x={r.x + c.u * 0.15} y={r.y + c.u * 0.15} width={r.w} height={r.h} fill="none" stroke="#fff" strokeOpacity={0.55} strokeWidth={c.u * 0.1} />
        </>
      )}
      {naziv && (
        <text x={g.x + g.w / 2} y={g.y + g.h - c.u * 1.2} fontSize={c.u * 2} textAnchor="middle" fill="#000" fillOpacity={0.35} fontWeight={600}>
          {naziv}
        </text>
      )}
    </g>
  );
}

/** Linije otvaranja – tanke, prozirne; vrh trougla je na strani ručice (kod kipa gore). */
function Linije({ c, g, o }: { c: Ctx; g: R; o: Otvaranje }) {
  const st = { stroke: "#1d2726", strokeOpacity: 0.38, strokeWidth: c.u * 0.16, strokeDasharray: `${c.u * 0.9} ${c.u * 0.6}`, fill: "none" } as const;
  const okretno = (sarke: "L" | "D") =>
    sarke === "L" ? `M${g.x} ${g.y} L${g.x + g.w} ${g.y + g.h / 2} L${g.x} ${g.y + g.h}` : `M${g.x + g.w} ${g.y} L${g.x} ${g.y + g.h / 2} L${g.x + g.w} ${g.y + g.h}`;
  const kip = `M${g.x} ${g.y + g.h} L${g.x + g.w / 2} ${g.y} L${g.x + g.w} ${g.y + g.h}`;
  if (o === "ON_L") return <><path d={okretno("L")} {...st} /><path d={kip} {...st} /></>;
  if (o === "ON_D") return <><path d={okretno("D")} {...st} /><path d={kip} {...st} /></>;
  if (o === "O_L" || o === "VRATA_L") return <path d={okretno("L")} {...st} />;
  if (o === "O_D" || o === "VRATA_D") return <path d={okretno("D")} {...st} />;
  if (o === "KIP") return <path d={kip} {...st} />;
  if (o.startsWith("PSK") || o.startsWith("HST")) {
    const levo = o.endsWith("_L");
    const cy = g.y + g.h * 0.62;
    const [od, ka] = levo ? [g.x + g.w * 0.75, g.x + g.w * 0.25] : [g.x + g.w * 0.25, g.x + g.w * 0.75];
    const k = (levo ? 1 : -1) * c.u * 2.2;
    return (
      <g stroke="#1d2726" strokeOpacity={0.5} strokeWidth={c.u * 0.3} fill="none" strokeLinecap="round">
        <path d={`M${od} ${cy} L${ka} ${cy}`} />
        <path d={`M${ka + k} ${cy - c.u * 1.6} L${ka} ${cy} L${ka + k} ${cy + c.u * 1.6}`} />
      </g>
    );
  }
  return null;
}

/** Ručica prozora u lokalnim koordinatama (centar rozete, y nadole): rozeta 30×78, poluga 18×125. */
function RucicaProzor({ c }: { c: Ctx }) {
  const m = `url(#${c.id}-metal)`;
  const sw = c.u * 0.05;
  return (
    <g filter={`url(#${c.id}-senkaR)`}>
      <rect x={-15} y={-39} width={30} height={78} rx={9} fill={m} stroke="#000" strokeOpacity={0.25} strokeWidth={sw} />
      <rect x={-9} y={-22.5} width={18} height={125} rx={9} fill={m} stroke="#000" strokeOpacity={0.28} strokeWidth={sw} />
      <circle cx={0} cy={-12} r={9.5} fill={m} stroke="#000" strokeOpacity={0.25} strokeWidth={sw} />
    </g>
  );
}

/** Kvaka vrata sa dugom pločom i cilindrom brave; smer = na koju stranu ide kvaka. */
function KvakaVrata({ c, smer }: { c: Ctx; smer: 1 | -1 }) {
  const m = `url(#${c.id}-metal)`;
  const sw = c.u * 0.05;
  return (
    <g filter={`url(#${c.id}-senkaR)`}>
      <rect x={-15} y={-110} width={30} height={220} rx={11} fill={m} stroke="#000" strokeOpacity={0.25} strokeWidth={sw} />
      <rect x={smer > 0 ? -10 : -115} y={-39} width={125} height={18} rx={9} fill={m} stroke="#000" strokeOpacity={0.28} strokeWidth={sw} />
      <circle cx={0} cy={-30} r={10} fill={m} stroke="#000" strokeOpacity={0.25} strokeWidth={sw} />
      <rect x={-7} y={42} width={14} height={34} rx={7} fill={`url(#${c.id}-celik)`} stroke="#000" strokeOpacity={0.3} strokeWidth={sw} />
      <rect x={-1.5} y={48} width={3} height={18} rx={1.5} fill="#2a2e30" />
    </g>
  );
}

// ───────────── glavna komponenta ─────────────
export function ProzorRealno({
  id,
  u,
  definicija,
  W,
  H,
  mere,
  boja,
  komarnik,
  panel,
  vrsta,
}: {
  id: string;
  u: number;
  definicija: Cvor;
  W: number;
  H: number;
  mere: { prosirenjeL: number; prosirenjeD: number; podstok: number };
  boja?: string;
  komarnik?: boolean;
  /** naziv panela (vrata) – umesto stakla */
  panel?: string | null;
  vrsta: string;
}) {
  const rasp = napraviRaspored(definicija, W, H, mere);
  // raspored ima y nagore od dna; SVG ima y nadole od vrha
  const Y = (p: Pravougaonik): R => ({ x: p.x, y: H - p.y - p.h, w: p.w, h: p.h });
  const c: Ctx = { id, u, prof: boja ?? "#f5f5f1", dekor: jeDekor(boja) };
  const vrata = vrsta === "VRATA";
  const bojaSarke = boja ?? "#eeeeea";
  const { prosirenjeL: pl, prosirenjeD: pd, podstok: ps } = mere;

  const ram = Y(rasp.ram);
  const nodes: React.ReactNode[] = [];

  // proširenja i podštok
  if (ps > 0) nodes.push(<Ploca key="ps" c={c} r={{ x: 0, y: H - ps, w: W, h: ps }} smer="y" grad="ploca" />);
  if (pl > 0) nodes.push(<Ploca key="pl" c={c} r={{ x: 0, y: 0, w: pl, h: H - ps }} smer="x" grad="ploca" />);
  if (pd > 0) nodes.push(<Ploca key="pd" c={c} r={{ x: W - pd, y: 0, w: pd, h: H - ps }} smer="x" grad="ploca" />);

  // štok
  nodes.push(<Okvir key="ram" c={c} o={ram} i={unutra(ram, STOK)} vrsta="ram" />);
  // unutrašnjost štoka iza krila/stakla (senka falca)
  nodes.push(<rect key="falc" {...(() => { const r = unutra(ram, STOK); return { x: r.x, y: r.y, width: r.w, height: r.h }; })()} fill={mesaj(c.prof, "#000000", 0.35)} />);

  // T prečke (iznutra se vidi telo 42 mm), ravno sečene, naležu na štok/drugu prečku
  rasp.precke.forEach((p, i) => {
    const r: R =
      p.smer === "V"
        ? Y({ x: p.osa - PRECKA / 2, y: p.od + 1.5, w: PRECKA, h: p.do - p.od - 3 })
        : Y({ x: p.od + 1.5, y: p.osa - PRECKA / 2, w: p.do - p.od - 3, h: PRECKA });
    nodes.push(<Ploca key={`p${i}`} c={c} r={r} smer={p.smer === "V" ? "x" : "y"} />);
  });

  // polja
  const pasivna = new Set<number>();
  rasp.stulpovi.forEach((s) => {
    const idx = rasp.polja.map((p, i) => ({ p, i })).filter(({ p }) => p.stulp && p.krilo && (Math.abs(p.krilo.x + p.krilo.w - 4 - s.x) < 1 || Math.abs(p.krilo.x + 4 - s.x) < 1));
    const pas = idx.find(({ p }) => p.otvaranje === "O_L" || p.otvaranje === "O_D") ?? idx.find(({ p }) => p.stulp === "desno") ?? idx[0];
    if (pas) pasivna.add(pas.i);
  });

  const okov: React.ReactNode[] = [];
  rasp.polja.forEach((p, i) => {
    const o = p.otvaranje;
    const krVrata = o === "VRATA_L" || o === "VRATA_D";
    const usePanel = vrata && !!panel;
    if (!p.krilo) {
      const sv = Y(p.svetlo);
      const lo = unutra(sv, -FIKS_LAJSNA);
      const g = unutra(sv, -FIKS_STAKLO);
      nodes.push(
        <g key={`f${i}`}>
          {usePanel ? <Panel c={c} g={g} naziv={panel} boja={c.prof} /> : <Staklo c={c} g={g} i={i} komarnik={komarnik} />}
          <Okvir c={c} o={lo} i={g} vrsta="lajsna" />
        </g>,
      );
      return;
    }
    const kr = Y(p.krilo);
    const g = unutra(kr, KRILO_STAKLO);
    nodes.push(
      <g key={`k${i}`}>
        {krVrata && usePanel ? <Panel c={c} g={g} naziv={panel} boja={c.prof} /> : <Staklo c={c} g={g} i={i} komarnik={komarnik} />}
        <Linije c={c} g={g} o={o} />
        {/* krilo je ispred štoka – baca senku */}
        <g filter={`url(#${id}-senka)`}>
          <Okvir c={c} o={kr} i={unutra(kr, KRILO_TELO)} vrsta="krilo" />
        </g>
        <Okvir c={c} o={unutra(kr, KRILO_TELO)} i={g} vrsta="lajsna" />
      </g>,
    );

    // ── šarke (iz 3D modela) ──
    const levo = o === "ON_L" || o === "O_L" || o === "VRATA_L";
    const desno = o === "ON_D" || o === "O_D" || o === "VRATA_D";
    const sg = levo ? 1 : -1;
    const ax = levo ? p.krilo.x - 4 : p.krilo.x + p.krilo.w + 4;
    const sy = (y: number) => H - y; // y iz rasporeda → SVG
    const kutija = (k: string, x1: number, y1: number, x2: number, y2: number, fill: string, rx: number) => (
      <rect key={k} x={Math.min(x1, x2)} y={sy(Math.max(y1, y2))} width={Math.abs(x2 - x1)} height={Math.abs(y2 - y1)} rx={rx} fill={fill} stroke="#000" strokeOpacity={0.25} strokeWidth={u * 0.05} />
    );
    if (krVrata && (levo || desno)) {
      [p.krilo.y + 250, p.krilo.y + p.krilo.h / 2 + 100, p.krilo.y + p.krilo.h - 250].forEach((yc, j) => {
        okov.push(
          <g key={`s${i}-${j}`} filter={`url(#${id}-senka)`}>
            {kutija("a", ax - sg * 30, yc - 50, ax - sg * 4, yc + 50, `url(#${id}-celik)`, 3)}
            {kutija("c", ax + sg * 4, yc - 45, ax + sg * 34, yc + 45, `url(#${id}-celik)`, 3)}
            {kutija("b", ax - 10, yc - 52, ax + 10, yc + 52, `url(#${id}-celik)`, 10)}
          </g>,
        );
      });
    } else if (levo || desno) {
      [p.krilo.y + 60, p.krilo.y + p.krilo.h - 60].forEach((yc, j) => {
        okov.push(
          <g key={`s${i}-${j}`} filter={`url(#${id}-senka)`}>
            {kutija("a", ax - sg * 18, yc - 28, ax - sg * 3, yc + 28, bojaSarke, 3)}
            {kutija("c", ax + sg * 3, yc - 22, ax + sg * 48, yc + 22, bojaSarke, 4)}
            {kutija("b", ax - 7, yc - 30, ax + 7, yc + 30, bojaSarke, 7)}
            {kutija("d", ax - 7, yc - 30, ax + 7, yc + 30, `url(#${id}-ploca-x)`, 7)}
          </g>,
        );
      });
    } else if (o === "KIP") {
      const ky = p.krilo.y - 4;
      [p.krilo.x + 90, p.krilo.x + p.krilo.w - 90].forEach((xc, j) => {
        okov.push(
          <g key={`s${i}-${j}`} filter={`url(#${id}-senka)`}>
            {kutija("a", xc - 28, ky - 18, xc + 28, ky - 3, bojaSarke, 3)}
            {kutija("c", xc - 22, ky + 3, xc + 22, ky + 48, bojaSarke, 4)}
            {kutija("b", xc - 30, ky - 7, xc + 30, ky + 7, bojaSarke, 7)}
            {kutija("d", xc - 30, ky - 7, xc + 30, ky + 7, `url(#${id}-ploca-y)`, 7)}
          </g>,
        );
      });
    }

    // ── ručica ── (pasivno štulp krilo je nema)
    if (pasivna.has(i) && (o === "O_L" || o === "O_D")) return;
    const yR = p.krilo.y + (krVrata ? Math.min(1050, p.krilo.h / 2) : p.krilo.h / 2);
    const nsL = o === "ON_L" || o === "VRATA_L" || o === "PSK_L" || o === "HST_L";
    const nsD = o === "ON_D" || o === "VRATA_D" || o === "PSK_D" || o === "HST_D";
    if (o === "KIP") {
      okov.push(
        <g key={`r${i}`} transform={`translate(${p.krilo.x + p.krilo.w / 2} ${sy(p.krilo.y + p.krilo.h - 40)}) rotate(-90)`}>
          <RucicaProzor c={c} />
        </g>,
      );
    } else if (nsL || nsD) {
      const xR = nsL ? p.krilo.x + p.krilo.w - 38 : p.krilo.x + 38;
      okov.push(
        <g key={`r${i}`} transform={`translate(${xR} ${sy(yR)})`}>
          {krVrata ? <KvakaVrata c={c} smer={nsL ? -1 : 1} /> : <RucicaProzor c={c} />}
        </g>,
      );
    }
  });

  // štulp: lažna prečka (34 mm) preko spoja krila, sa kapama na krajevima
  rasp.stulpovi.forEach((s, i) => {
    const r = Y({ x: s.x - 17, y: s.y + 30, w: 34, h: s.h - 60 });
    nodes.push(
      <g key={`st${i}`} filter={`url(#${id}-senka)`}>
        <Ploca c={c} r={r} smer="x" />
        <rect x={r.x} y={r.y} width={r.w} height={10} rx={2} fill={mesaj(c.prof, "#000000", 0.18)} />
        <rect x={r.x} y={r.y + r.h - 10} width={r.w} height={10} rx={2} fill={mesaj(c.prof, "#000000", 0.18)} />
      </g>,
    );
  });

  return (
    <g>
      {nodes}
      {okov}
    </g>
  );
}

/** Kratak, stabilan heš (za jedinstvene id-jeve clipPath-a po modelu i merama). */
export function hes(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
