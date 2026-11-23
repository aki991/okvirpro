import type { Cvor } from "@/lib/modeli-katalog";
import { ModelCrtez } from "./ModelCrtez";
import { visinaRoletne } from "@/lib/proracun";

// Veliki crtež pozicije u razmeri: model, proširenja, podštok, spoj, roletna, komarnik,
// daska, okapnica – sa kotama (ukupne mere, lanci mera i podela polja).

export type ElementOpcije = {
  podstok?: boolean;
  prosirenjeL?: boolean;
  prosirenjeD?: boolean;
  spojL?: boolean;
  spojD?: boolean;
  roletna?: string | null;
  roletnaVisina?: number | null;
  /** strana kaiša gledano iznutra: "L" | "D" (podrazumevano D) */
  roletnaKais?: string | null;
  komarnik?: string | null;
  daska?: string | null;
  okapnica?: string | null;
  panel?: string | null;
};

const BOJE = {
  kota: "#4b5552",
  prosirenje: "#e9d2a6",
  podstok: "#cfc6b4",
  spoj: "#b4352b",
  roletna: "#cfd3d1",
  okapnica: "#6b7471",
  daska: "#f1efe9",
  oznaka: "#0f4c45",
};

function Kota({
  x1, y1, x2, y2, tekst, u, vertikalno = false, istaknuto = false,
}: { x1: number; y1: number; x2: number; y2: number; tekst: string; u: number; vertikalno?: boolean; istaknuto?: boolean }) {
  const t = 1.4 * u; // kosa crtica na krajevima
  const fs = (istaknuto ? 3.6 : 3) * u;
  const sw = 0.22 * u;
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  return (
    <g stroke={BOJE.kota} strokeWidth={sw}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      {[ [x1, y1], [x2, y2] ].map(([x, y], i) => (
        <line key={i} x1={x - t} y1={y + t} x2={x + t} y2={y - t} strokeWidth={sw * 1.6} />
      ))}
      <text
        x={vertikalno ? cx - 1.2 * u : cx}
        y={vertikalno ? cy : cy - 1.2 * u}
        fontSize={fs}
        fontWeight={istaknuto ? 800 : 600}
        fill={istaknuto ? "#1c1f1e" : BOJE.kota}
        stroke="none"
        textAnchor="middle"
        style={{ fontFamily: "var(--font-mono), ui-monospace, monospace" }}
        transform={vertikalno ? `rotate(-90 ${cx - 1.2 * u} ${cy})` : undefined}
      >
        {tekst}
      </text>
    </g>
  );
}

/** Pomoćne linije od elementa do kote. */
function Pomocna({ x1, y1, x2, y2, u }: { x1: number; y1: number; x2: number; y2: number; u: number }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={BOJE.kota} strokeWidth={0.12 * u} strokeDasharray={`${u} ${0.8 * u}`} />;
}

function Oznaka({ x, y, tekst, u, boja = BOJE.oznaka, anchor = "middle" }: { x: number; y: number; tekst: string; u: number; boja?: string; anchor?: "start" | "middle" | "end" }) {
  const fs = 2.6 * u;
  const w = tekst.length * fs * 0.62 + 2 * u;
  const x0 = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x;
  return (
    <g>
      <rect x={x0} y={y - fs * 0.85} width={w} height={fs * 1.3} rx={0.6 * u} fill="#ffffff" fillOpacity={0.9} stroke={boja} strokeWidth={0.15 * u} />
      <text x={x0 + w / 2} y={y} fontSize={fs} fontWeight={700} fill={boja} textAnchor="middle" letterSpacing={0.1 * u}>
        {tekst}
      </text>
    </g>
  );
}

/** Mere polja na prvom nivou podele (osne mere, po udelima). */
function podelaPrvogNivoa(d: Cvor | null, smer: "V" | "H", duz: number): number[] {
  if (!d || d.tip !== "podela" || d.smer !== smer || d.delovi.length < 2) return [];
  const uk = d.delovi.reduce((s, x) => s + x.udeo, 0);
  return d.delovi.map((x) => (duz * x.udeo) / uk);
}

export function ElementCrtez({
  definicija,
  sirina,
  visina,
  vrsta = "PROZOR",
  opcije = {},
  prosirenjeLMm = 40,
  prosirenjeDMm = 40,
  podstokMm = 30,
  className,
  boja,
}: {
  /** boja profila (hex); bez nje je beli PVC */
  boja?: string;
  definicija: Cvor | null;
  sirina: number;
  visina: number;
  vrsta?: string;
  opcije?: ElementOpcije;
  /** stvarne mere opcija u mm (koriste se kad je opcija uključena) */
  prosirenjeLMm?: number;
  prosirenjeDMm?: number;
  podstokMm?: number;
  className?: string;
}) {
  const W = Math.max(100, sirina || 0);
  const linijska = vrsta === "DASKA" || vrsta === "OKAPNICA";
  const H = linijska ? Math.max(120, W * 0.08) : Math.max(100, visina || 0);
  const L = Math.max(W, H);
  const u = L / 100;
  const profilna = !!definicija;

  const prL = profilna && opcije.prosirenjeL ? prosirenjeLMm : 0;
  const prD = profilna && opcije.prosirenjeD ? prosirenjeDMm : 0;
  const pod = profilna && opcije.podstok ? podstokMm : 0;
  const fw = W - prL - prD; // ram
  const fh = H - pod;
  // kutija roletne u stvarnoj visini (mm)
  const rolH = profilna && opcije.roletna ? visinaRoletne(opcije.roletnaVisina) : 0;

  // donje trake (okapnica/daska) ispod elementa
  const traka = 3.2 * u;
  const trake: { tip: "okapnica" | "daska"; y: number }[] = [];
  let yDole = H;
  if (profilna && opcije.okapnica) {
    trake.push({ tip: "okapnica", y: yDole + 1.5 * u });
    yDole += 1.5 * u + traka;
  }
  if (profilna && opcije.daska) {
    trake.push({ tip: "daska", y: yDole + 1.5 * u });
    yDole += 1.5 * u + traka;
  }

  // kote
  const k1 = 9 * u; // razmak prvog reda kota
  const k2 = 8 * u; // razmak između redova
  const lanacDole = [prL, fw, prD].filter((x) => x > 0);
  const imaLanacDole = lanacDole.length > 1;
  // levo: lanac (roletna | ram | podštok), pa visina elementa, pa ukupno sa roletnom
  const lanacLevo = [rolH, fh, pod].filter((x) => x > 0);
  const imaLanacLevo = lanacLevo.length > 1;
  const poljaV = podelaPrvogNivoa(definicija, "V", fw);
  const poljaH = podelaPrvogNivoa(definicija, "H", fh);

  const yKotaDole1 = yDole + k1;
  const yKotaDole2 = yKotaDole1 + (imaLanacDole ? k2 : 0);
  const xKotaLevo1 = -k1;
  const xKotaLevo2 = xKotaLevo1 - (imaLanacLevo ? k2 : 0);
  const xKotaLevo3 = xKotaLevo2 - (rolH > 0 ? k2 : 0);
  const yKotaGore = -rolH - (poljaV.length ? k1 : 0);
  const xKotaDesno = W + (poljaH.length ? k1 : 0);

  const minX = xKotaLevo3 - 6 * u;
  const maxX = Math.max(W + (opcije.okapnica ? 2 * u : 0), xKotaDesno) + 6 * u;
  const minY = Math.min(-rolH, yKotaGore) - 6 * u;
  const maxY = yKotaDole2 + 4 * u;

  const zaokr = (n: number) => String(Math.round(n));
  const idPref = `e${Math.round(W)}x${Math.round(H)}`;

  return (
    <svg viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`} className={className} role="img" aria-label={`${vrsta} ${sirina}×${visina} mm`}>
      <defs>
        <pattern id={`${idPref}-sraf`} width={2 * u} height={2 * u} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1={0} y1={0} x2={0} y2={2 * u} stroke="#a07a3a" strokeWidth={0.25 * u} strokeOpacity={0.55} />
        </pattern>
        <pattern id={`${idPref}-mreza`} width={1.4 * u} height={1.4 * u} patternUnits="userSpaceOnUse">
          <path d={`M0 0 H${1.4 * u} M0 0 V${1.4 * u}`} stroke="#3d4a47" strokeWidth={0.1 * u} strokeOpacity={0.45} fill="none" />
        </pattern>
        <pattern id={`${idPref}-lamele`} width={W} height={1.6 * u} patternUnits="userSpaceOnUse">
          <line x1={0} y1={1.6 * u} x2={W} y2={1.6 * u} stroke="#9aa29f" strokeWidth={0.15 * u} />
        </pattern>
      </defs>

      {/* ── Sam element ── */}
      {profilna ? (
        <ModelCrtez definicija={definicija!} sirina={fw} visina={fh} pad={0} boja={boja} polozaj={{ x: prL, y: 0, width: fw, height: fh }} />
      ) : (
        <g>
          <rect x={0} y={0} width={W} height={H} fill={vrsta === "ROLETNA" ? BOJE.roletna : vrsta === "OKAPNICA" ? BOJE.okapnica : "#f6f6f4"} stroke="#2f3a38" strokeWidth={0.35 * u} />
          {vrsta === "ROLETNA" && <rect x={0} y={0} width={W} height={H} fill={`url(#${idPref}-lamele)`} />}
          {vrsta === "KOMARNIK" && <rect x={2 * u} y={2 * u} width={W - 4 * u} height={H - 4 * u} fill={`url(#${idPref}-mreza)`} stroke="#2f3a38" strokeWidth={0.2 * u} />}
          <Oznaka x={W / 2} y={H / 2 + u} tekst={vrsta} u={u} />
        </g>
      )}

      {/* Proširenja */}
      {prL > 0 && (
        <g>
          <rect x={0} y={0} width={prL} height={fh} fill={boja ?? BOJE.prosirenje} stroke="#8a6a3b" strokeWidth={0.2 * u} />
          <rect x={0} y={0} width={prL} height={fh} fill={`url(#${idPref}-sraf)`} />
        </g>
      )}
      {prD > 0 && (
        <g>
          <rect x={W - prD} y={0} width={prD} height={fh} fill={boja ?? BOJE.prosirenje} stroke="#8a6a3b" strokeWidth={0.2 * u} />
          <rect x={W - prD} y={0} width={prD} height={fh} fill={`url(#${idPref}-sraf)`} />
        </g>
      )}
      {/* Podštok */}
      {pod > 0 && (
        <g>
          <rect x={0} y={fh} width={W} height={pod} fill={BOJE.podstok} stroke="#7d7360" strokeWidth={0.2 * u} />
          <rect x={0} y={fh} width={W} height={pod} fill={`url(#${idPref}-sraf)`} />
        </g>
      )}

      {/* Komarnik preko ostakljenja */}
      {profilna && opcije.komarnik && (
        <g>
          <rect x={prL + 4 * u} y={4 * u} width={fw - 8 * u} height={fh - 8 * u} fill={`url(#${idPref}-mreza)`} stroke="#3d4a47" strokeWidth={0.15 * u} strokeDasharray={`${u} ${0.6 * u}`} />
          <Oznaka x={prL + fw / 2} y={fh - 7 * u} tekst={`KOMARNIK`} u={u} boja="#3d4a47" />
        </g>
      )}

      {/* Roletna (kutija iznad) */}
      {rolH > 0 && (
        <g>
          {/* roletna prati boju prozora */}
          <rect x={0} y={-rolH} width={W} height={rolH} fill={boja ?? BOJE.roletna} stroke="#2f3a38" strokeWidth={0.3 * u} />
          <rect x={0} y={-rolH} width={W} height={rolH} fill={`url(#${idPref}-lamele)`} />
          <Oznaka x={W / 2} y={-rolH / 2 + u} tekst="ROLETNA" u={u} boja="#2f3a38" />
          {/* kaiš i namotač (gledano iznutra) na izabranoj strani */}
          {(() => {
            const xk = opcije.roletnaKais === "L" ? 1.6 * u : W - 1.6 * u;
            const yn = fh * 0.55;
            return (
              <g>
                <line x1={xk} y1={0} x2={xk} y2={yn} stroke="#a59e8e" strokeWidth={0.9 * u} />
                <rect x={xk - 1.3 * u} y={yn} width={2.6 * u} height={8 * u} rx={0.6 * u} fill="#f6f6f3" stroke="#2f3a38" strokeWidth={0.18 * u} />
                <Oznaka x={opcije.roletnaKais === "L" ? xk + 2 * u : xk - 2 * u} y={yn + 4.5 * u} tekst="KAIŠ" u={u * 0.8} boja="#2f3a38" anchor={opcije.roletnaKais === "L" ? "start" : "end"} />
              </g>
            );
          })()}
        </g>
      )}

      {/* Spoj */}
      {profilna && opcije.spojL && (
        <g>
          <line x1={0} y1={-rolH} x2={0} y2={H} stroke={BOJE.spoj} strokeWidth={1.1 * u} />
          <Oznaka x={1.5 * u} y={4 * u} tekst="SPOJ" u={u} boja={BOJE.spoj} anchor="start" />
        </g>
      )}
      {profilna && opcije.spojD && (
        <g>
          <line x1={W} y1={-rolH} x2={W} y2={H} stroke={BOJE.spoj} strokeWidth={1.1 * u} />
          <Oznaka x={W - 1.5 * u} y={4 * u} tekst="SPOJ" u={u} boja={BOJE.spoj} anchor="end" />
        </g>
      )}

      {/* Okapnica i daska */}
      {trake.map((t) =>
        t.tip === "okapnica" ? (
          <g key="o">
            <path d={`M${-2 * u} ${t.y} H${W + 2 * u} L${W + 2 * u} ${t.y + traka * 0.6} L${-2 * u} ${t.y + traka}Z`} fill={BOJE.okapnica} />
            <Oznaka x={W / 2} y={t.y + traka * 0.75} tekst="OKAPNICA" u={u * 0.85} boja="#2f3a38" />
          </g>
        ) : (
          <g key="d">
            <rect x={-1.2 * u} y={t.y} width={W + 2.4 * u} height={traka} fill={BOJE.daska} stroke="#8b8f8a" strokeWidth={0.18 * u} strokeDasharray={`${u} ${0.6 * u}`} />
            <Oznaka x={W / 2} y={t.y + traka * 0.8} tekst="DASKA" u={u * 0.85} boja="#5b605c" />
          </g>
        ),
      )}

      {/* Panel na vratima */}
      {profilna && opcije.panel && <Oznaka x={prL + fw / 2} y={fh * 0.55} tekst={`PANEL ${opcije.panel}`} u={u} />}

      {/* ── Kote ── */}
      {/* širina: lanac (proširenja + ram) i ukupno */}
      <Pomocna x1={0} y1={yDole + u} x2={0} y2={yKotaDole2 + 1.5 * u} u={u} />
      <Pomocna x1={W} y1={yDole + u} x2={W} y2={yKotaDole2 + 1.5 * u} u={u} />
      {imaLanacDole &&
        (() => {
          let x = 0;
          return lanacDole.map((seg, i) => {
            const k = <Kota key={i} x1={x} y1={yKotaDole1} x2={x + seg} y2={yKotaDole1} tekst={zaokr(seg)} u={u} />;
            x += seg;
            return k;
          });
        })()}
      <Kota x1={0} y1={yKotaDole2} x2={W} y2={yKotaDole2} tekst={zaokr(W)} u={u} istaknuto />

      {/* visina: lanac (ram + podštok) i ukupno */}
      {!linijska && (
        <>
          {rolH > 0 && <Pomocna x1={-u} y1={-rolH} x2={xKotaLevo3 - 1.5 * u} y2={-rolH} u={u} />}
          <Pomocna x1={-u} y1={0} x2={xKotaLevo3 - 1.5 * u} y2={0} u={u} />
          <Pomocna x1={-u} y1={H} x2={xKotaLevo3 - 1.5 * u} y2={H} u={u} />
          {imaLanacLevo &&
            (() => {
              let y = -rolH;
              return lanacLevo.map((seg, i) => {
                const k = <Kota key={i} x1={xKotaLevo1} y1={y} x2={xKotaLevo1} y2={y + seg} tekst={zaokr(seg)} u={u} vertikalno />;
                y += seg;
                return k;
              });
            })()}
          <Kota x1={xKotaLevo2} y1={0} x2={xKotaLevo2} y2={H} tekst={zaokr(H)} u={u} vertikalno istaknuto />
          {rolH > 0 && <Kota x1={xKotaLevo3} y1={-rolH} x2={xKotaLevo3} y2={H} tekst={zaokr(H + rolH)} u={u} vertikalno />}
        </>
      )}

      {/* podela polja (prvi nivo) – osne mere */}
      {poljaV.length > 0 &&
        (() => {
          let x = prL;
          return poljaV.map((seg, i) => {
            const k = <Kota key={`v${i}`} x1={x} y1={yKotaGore} x2={x + seg} y2={yKotaGore} tekst={zaokr(seg)} u={u} />;
            x += seg;
            return k;
          });
        })()}
      {poljaH.length > 0 &&
        (() => {
          let y = 0;
          return poljaH.map((seg, i) => {
            const k = <Kota key={`h${i}`} x1={xKotaDesno} y1={y} x2={xKotaDesno} y2={y + seg} tekst={zaokr(seg)} u={u} vertikalno />;
            y += seg;
            return k;
          });
        })()}
    </svg>
  );
}
