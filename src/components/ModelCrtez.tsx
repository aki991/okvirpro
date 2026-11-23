import type { Cvor, Otvaranje } from "@/lib/modeli-katalog";

// Crtež prozora/vrata iz strukture modela (SVG).
// Konvencija: vrh isprekidanog trougla pokazuje stranu ručice/brave (kod kipa – gore).

const RAM = 6; // debljina rama u jedinicama crteža
const KRILO = 4;

type Rect = { x: number; y: number; w: number; h: number };
/** SVG <rect> traži width/height (ne w/h) – bez ovoga se krilo i staklo uopšte ne iscrtavaju. */
const svg = (r: Rect) => ({ x: r.x, y: r.y, width: Math.max(0, r.w), height: Math.max(0, r.h) });

function Linije({ r, o }: { r: Rect; o: Otvaranje }) {
  const { x, y, w, h } = r;
  const crtica = { stroke: "#4b5b58", strokeWidth: 0.9, strokeDasharray: "3 2.2", fill: "none" } as const;
  // strana = strana šarki; linije kreću iz uglova kod šarki, a vrh je na strani ručice
  const okretno = (strana: "L" | "D") =>
    strana === "L"
      ? `M${x} ${y} L${x + w} ${y + h / 2} L${x} ${y + h}`
      : `M${x + w} ${y} L${x} ${y + h / 2} L${x + w} ${y + h}`;
  const kip = `M${x} ${y + h} L${x + w / 2} ${y} L${x + w} ${y + h}`;
  const strelica = (smer: "L" | "D") => {
    const cy = y + h * 0.62;
    const x1 = x + w * 0.25;
    const x2 = x + w * 0.75;
    const [od, ka] = smer === "L" ? [x2, x1] : [x1, x2];
    const k = smer === "L" ? 4 : -4;
    return (
      <g stroke="#2a6f66" strokeWidth={1.4} fill="none">
        <path d={`M${od} ${cy} L${ka} ${cy}`} />
        <path d={`M${ka + k} ${cy - 3.5} L${ka} ${cy} L${ka + k} ${cy + 3.5}`} />
      </g>
    );
  };

  switch (o) {
    case "ON_L":
      return (<><path d={okretno("L")} {...crtica} /><path d={kip} {...crtica} /></>);
    case "ON_D":
      return (<><path d={okretno("D")} {...crtica} /><path d={kip} {...crtica} /></>);
    case "O_L":
    case "VRATA_L":
      return <path d={okretno("L")} {...crtica} />;
    case "O_D":
    case "VRATA_D":
      return <path d={okretno("D")} {...crtica} />;
    case "KIP":
      return <path d={kip} {...crtica} />;
    case "PSK_L":
    case "HST_L":
      return strelica("L");
    case "PSK_D":
    case "HST_D":
      return strelica("D");
    default:
      return null;
  }
}

function Rucica({ r, o }: { r: Rect; o: Otvaranje }) {
  // ručica na suprotnoj strani od šarki
  const levo = ["ON_D", "O_D", "VRATA_D"].includes(o);
  const desno = ["ON_L", "O_L", "VRATA_L"].includes(o);
  if (!levo && !desno && o !== "KIP") return null;
  if (o === "KIP") return <rect x={r.x + r.w / 2 - 4} y={r.y + 1.5} width={8} height={2.2} rx={1} fill="#c98a2b" />;
  const x = levo ? r.x + 1.2 : r.x + r.w - 3.4;
  const vrata = o.startsWith("VRATA");
  return <rect x={x} y={r.y + r.h / 2 - (vrata ? 7 : 5)} width={2.2} height={vrata ? 14 : 10} rx={1} fill="#c98a2b" />;
}

function Polje({ r, o, boja }: { r: Rect; o: Otvaranje; boja: string }) {
  const fiks = o === "FIKS";
  const sr = fiks ? r : { x: r.x + 1.5, y: r.y + 1.5, w: r.w - 3, h: r.h - 3 };
  const staklo = fiks ? r : { x: sr.x + KRILO, y: sr.y + KRILO, w: sr.w - 2 * KRILO, h: sr.h - 2 * KRILO };
  return (
    <g>
      {!fiks && <rect {...svg(sr)} fill={boja} stroke="#4b5b58" strokeWidth={1} />}
      <rect {...svg(staklo)} fill="#d9ecf2" stroke="#4b5b58" strokeWidth={0.8} />
      <Linije r={staklo} o={o} />
      {!fiks && <Rucica r={sr} o={o} />}
    </g>
  );
}

function Cvor_({ c, r, boja }: { c: Cvor; r: Rect; boja: string }) {
  if (c.tip === "polje") return <Polje r={r} o={c.otvaranje} boja={boja} />;
  const ukupno = c.delovi.reduce((s, d) => s + d.udeo, 0);
  const stub = c.stulp ? 0 : RAM * 0.7;
  const duz = c.smer === "V" ? r.w : r.h;
  const raspolozivo = duz - stub * (c.delovi.length - 1);
  let pos = c.smer === "V" ? r.x : r.y;
  const out: React.ReactNode[] = [];
  c.delovi.forEach((d, i) => {
    const vel = (raspolozivo * d.udeo) / ukupno;
    const rr: Rect = c.smer === "V" ? { x: pos, y: r.y, w: vel, h: r.h } : { x: r.x, y: pos, w: r.w, h: vel };
    out.push(<Cvor_ key={i} c={d.sadrzaj} r={rr} boja={boja} />);
    pos += vel;
    if (i < c.delovi.length - 1 && stub > 0) {
      out.push(
        <rect
          key={`s${i}`}
          {...(c.smer === "V" ? { x: pos, y: r.y, width: stub, height: r.h } : { x: r.x, y: pos, width: r.w, height: stub })}
          fill={boja}
          stroke="#4b5b58"
          strokeWidth={0.8}
        />,
      );
      pos += stub;
    }
  });
  return <g>{out}</g>;
}

export function ModelCrtez({
  definicija,
  sirina = 1200,
  visina = 1400,
  className,
  pad = 3,
  polozaj,
  boja,
}: {
  /** boja profila (hex) – boji ram i krila; bez nje je beli PVC */
  boja?: string;
  definicija: Cvor;
  sirina?: number;
  visina?: number;
  className?: string;
  pad?: number;
  /** za ugradnju u veći SVG crtež (x, y, širina, visina u koordinatama roditelja) */
  polozaj?: { x: number; y: number; width: number; height: number };
}) {
  const bojaProfila = boja ?? "#ffffff";
  // normalizujemo na 100 jedinica po dužoj strani
  const s = 100 / Math.max(sirina, visina);
  const W = sirina * s;
  const H = visina * s;
  return (
    <svg viewBox={`${-pad} ${-pad} ${W + 2 * pad} ${H + 2 * pad}`} className={className} role="img" {...(polozaj ? { ...polozaj, preserveAspectRatio: "none" } : {})}>
      <rect x={0} y={0} width={W} height={H} fill={bojaProfila} stroke="#2f3a38" strokeWidth={1.2} />
      <Cvor_ c={definicija} r={{ x: RAM, y: RAM, w: W - 2 * RAM, h: H - 2 * RAM }} boja={bojaProfila} />
      <rect x={RAM} y={RAM} width={W - 2 * RAM} height={H - 2 * RAM} fill="none" stroke="#2f3a38" strokeWidth={0.8} />
    </svg>
  );
}
