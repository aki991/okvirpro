import type { Cvor } from "@/lib/modeli-katalog";
import { prepustRoletne, visinaRoletne } from "@/lib/proracun";
import { hes, jeDekor, mesaj, ProzorRealno, RealnoDefs } from "./ProzorRealno";

// Veliki crtež pozicije u razmeri – realističan prikaz gledano iznutra (profili, staklo, okov,
// roletna sa kaišem i namotačem, daska, okapnica) sa kotama (ukupne mere, lanci mera i podela polja).

export type ElementOpcije = {
  podstok?: boolean;
  prosirenjeL?: boolean;
  prosirenjeD?: boolean;
  spojL?: boolean;
  spojD?: boolean;
  roletna?: string | null;
  roletnaVisina?: number | null;
  /** prepust kutije ka sobi (mm) – vidi se kao senka ispod kutije */
  roletnaPrepust?: number | null;
  /** strana kaiša gledano iznutra: "L" | "D" (podrazumevano D) */
  roletnaKais?: string | null;
  komarnik?: string | null;
  daska?: string | null;
  okapnica?: string | null;
  panel?: string | null;
};

const BOJE = {
  kota: "#4b5552",
  roletna: "#dfe2e1",
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
  // id-jevi definicija: zavise od mera i modela (clipPath stakla), ne od boje
  const idPref = `e${Math.round(W)}x${Math.round(H)}${hes(JSON.stringify([definicija, prL, prD, pod, vrsta]))}`;
  const prof = boja ?? "#f5f5f1";
  const dekor = profilna && jeDekor(boja);
  const tanka = 0.06 * u;

  // ── samostalne stavke (bez profila): roletna, komarnik, daska, okapnica ──
  const samostalna = () => {
    if (vrsta === "ROLETNA") {
      const bh = Math.min(H * 0.2, 200); // kutija
      return (
        <g>
          <rect x={16} y={bh} width={W - 32} height={H - bh} fill={BOJE.roletna} />
          <rect x={16} y={bh} width={W - 32} height={H - bh} fill={`url(#${idPref}-lamele)`} />
          <rect x={16} y={H - 44} width={W - 32} height={44} fill={`url(#${idPref}-alu)`} stroke="#000" strokeOpacity={0.25} strokeWidth={tanka} />
          {[0, W - 26].map((x) => (
            <rect key={x} x={x} y={bh} width={26} height={H - bh} fill={`url(#${idPref}-alu)`} stroke="#000" strokeOpacity={0.25} strokeWidth={tanka} />
          ))}
          <rect x={0} y={0} width={W} height={bh} fill={BOJE.roletna} />
          <rect x={0} y={0} width={W} height={bh} fill={`url(#${idPref}-ploca-y)`} stroke="#000" strokeOpacity={0.3} strokeWidth={tanka} />
        </g>
      );
    }
    if (vrsta === "KOMARNIK") {
      const r = { x: 0, y: 0, w: W, h: H };
      const t = 25;
      return (
        <g>
          <rect x={t} y={t} width={W - 2 * t} height={H - 2 * t} fill="#dfe6e8" fillOpacity={0.5} />
          <rect x={t} y={t} width={W - 2 * t} height={H - 2 * t} fill={`url(#${idPref}-mreza)`} />
          <path
            d={`M${r.x} ${r.y}H${W}V${H}H0Z M${t} ${t}V${H - t}H${W - t}V${t}Z`}
            fill="#d6dbdb"
            fillRule="evenodd"
            stroke="#000"
            strokeOpacity={0.3}
            strokeWidth={tanka}
          />
          <path d={`M${r.x} ${r.y}H${W}V${H}H0Z M${t} ${t}V${H - t}H${W - t}V${t}Z`} fill={`url(#${idPref}-ploca-y)`} fillRule="evenodd" />
        </g>
      );
    }
    return <rect x={0} y={0} width={W} height={H} fill={`url(#${idPref}-${vrsta === "OKAPNICA" ? "alu" : "mermer"})`} stroke="#000" strokeOpacity={0.3} strokeWidth={tanka} />;
  };

  // namotač kaiša: na istoj visini kao u 3D prikazu
  const yNamotac = H - (pod + Math.max(140, Math.min(950, (H - pod) * 0.42)));
  const xKais = opcije.roletnaKais === "L" ? 12 : W - 12;
  const senkaKutije = 6 + prepustRoletne(opcije.roletnaPrepust) * 0.5;

  return (
    <svg viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`} className={className} role="img" aria-label={`${vrsta} ${sirina}×${visina} mm`}>
      <defs>
        <RealnoDefs id={idPref} u={u} />
      </defs>

      {/* ── Sam element (gledano iznutra) ── */}
      {profilna ? (
        <ProzorRealno
          id={idPref}
          u={u}
          definicija={definicija!}
          W={W}
          H={H}
          mere={{ prosirenjeL: prL, prosirenjeD: prD, podstok: pod }}
          boja={boja}
          komarnik={!!opcije.komarnik}
          panel={opcije.panel}
          vrsta={vrsta}
        />
      ) : (
        samostalna()
      )}

      {/* Roletna (kutija iznad) */}
      {rolH > 0 && (
        <g>
          {/* nadgradna kutija gledano iznutra – unutrašnje lice u boji prozora; prepust baca senku na štok */}
          <rect x={0} y={0} width={W} height={senkaKutije} fill={`url(#${idPref}-senka-dole)`} />
          <rect x={0} y={-rolH} width={W} height={rolH} fill={prof} filter={dekor ? `url(#${idPref}-drvoH)` : undefined} />
          <rect x={0} y={-rolH} width={W} height={rolH} fill={`url(#${idPref}-ploca-y)`} />
          {/* donja ivica revizionog poklopca i bočne kape */}
          <rect x={0} y={-12} width={W} height={12} fill="#000" fillOpacity={0.06} />
          <line x1={6} y1={-12} x2={W - 6} y2={-12} stroke="#000" strokeOpacity={0.28} strokeWidth={tanka * 1.5} />
          <rect x={0} y={-rolH - 2} width={5} height={rolH + 2} fill={mesaj(prof, "#000000", 0.18)} />
          <rect x={W - 5} y={-rolH - 2} width={5} height={rolH + 2} fill={mesaj(prof, "#000000", 0.18)} />
          <rect x={0} y={-rolH} width={W} height={rolH} fill="none" stroke="#000" strokeOpacity={0.3} strokeWidth={tanka} />

          {/* kaiš (sivo-bež traka) od uvodnika do namotača */}
          <g filter={`url(#${idPref}-senka)`}>
            <rect x={xKais - 8} y={0} width={16} height={Math.max(0, yNamotac - 85)} fill={`url(#${idPref}-kais)`} stroke="#000" strokeOpacity={0.2} strokeWidth={tanka} />
            {/* uvodnik sa četkicama */}
            <rect x={xKais - 15} y={-1} width={30} height={9} rx={2} fill={`url(#${idPref}-metal)`} stroke="#000" strokeOpacity={0.25} strokeWidth={tanka} />
            {/* namotač */}
            <rect x={xKais - 20} y={yNamotac - 85} width={40} height={170} rx={7} fill={`url(#${idPref}-metal)`} stroke="#000" strokeOpacity={0.28} strokeWidth={tanka} />
            <rect x={xKais - 16} y={yNamotac - 80} width={32} height={160} rx={5} fill="#fff" fillOpacity={0.55} stroke="#000" strokeOpacity={0.12} strokeWidth={tanka} />
            <rect x={xKais - 9} y={yNamotac - 84} width={18} height={3} rx={1} fill="#2a2e30" />
            <circle cx={xKais} cy={yNamotac + 56} r={6} fill="#5b6163" />
          </g>
        </g>
      )}

      {/* Spoj: spojni profil uz ivicu */}
      {profilna &&
        [opcije.spojL && 0, opcije.spojD && W - 12].filter((x): x is number => typeof x === "number").map((x) => (
          <g key={`sp${x}`}>
            <rect x={x} y={-rolH} width={12} height={H + rolH} fill={prof} />
            <rect x={x} y={-rolH} width={12} height={H + rolH} fill={`url(#${idPref}-precka-x)`} stroke="#000" strokeOpacity={0.35} strokeWidth={tanka} />
          </g>
        ))}

      {/* Okapnica (aluminijum) i unutrašnja daska */}
      {trake.map((t) =>
        t.tip === "okapnica" ? (
          <path
            key="o"
            d={`M${-2 * u} ${t.y} H${W + 2 * u} L${W + 2 * u} ${t.y + traka * 0.6} L${-2 * u} ${t.y + traka}Z`}
            fill={`url(#${idPref}-alu)`}
            stroke="#000"
            strokeOpacity={0.3}
            strokeWidth={tanka}
          />
        ) : (
          <g key="d" filter={`url(#${idPref}-senka)`}>
            <rect x={-1.2 * u} y={t.y} width={W + 2.4 * u} height={traka} rx={0.3 * u} fill={`url(#${idPref}-mermer)`} stroke="#000" strokeOpacity={0.22} strokeWidth={tanka} />
          </g>
        ),
      )}

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
