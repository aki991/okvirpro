"use client";

import { useState } from "react";
import type { MesecniPodatak } from "@/lib/finansije";

// Boje provereno validatorom (CVD, kontrast prema svetloj podlozi).
export const BOJA_PRIHOD = "#008f7a";
export const BOJA_ZARADA = "#b8690a";

const fmt = (n: number) => n.toLocaleString("sr-RS", { maximumFractionDigits: 0 }) + " €";

/** Grupisani stubići po mesecima (jedna ili dve serije), sa tooltipom na hover i tabelarnim prikazom. */
export function MesecniGrafikon({ podaci, serije = ["prihod", "zarada"] }: { podaci: MesecniPodatak[]; serije?: ("prihod" | "zarada")[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [tabela, setTabela] = useState(false);
  const def = { prihod: { n: "Prihod (bez PDV-a)", c: BOJA_PRIHOD }, zarada: { n: "Neto zarada", c: BOJA_ZARADA } };

  const max = Math.max(1, ...podaci.flatMap((m) => serije.map((s) => m[s])));
  // "lepa" gornja granica ose
  const korak = Math.pow(10, Math.floor(Math.log10(max)));
  const vrh = Math.ceil(max / korak) * korak;
  const podele = [0, 0.25, 0.5, 0.75, 1].map((f) => f * vrh);

  const W = 640, H = 240, L = 56, B = 28, T = 10;
  const sirinaGrupe = (W - L) / podaci.length;
  const sirinaStuba = Math.min(28, (sirinaGrupe * 0.6) / serije.length);
  const y = (v: number) => T + (H - T - B) * (1 - v / vrh);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs">
        {serije.length > 1 &&
          serije.map((s) => (
            <span key={s} className="flex items-center gap-1.5 text-muted">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: def[s].c }} />
              {def[s].n}
            </span>
          ))}
        <button type="button" onClick={() => setTabela((t) => !t)} className="ml-auto text-xs font-semibold text-brand hover:underline">
          {tabela ? "Prikaži grafikon" : "Prikaži tabelu"}
        </button>
      </div>

      {tabela ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th className="py-1.5 text-left font-semibold">Mesec</th>
              <th className="py-1.5 font-semibold">Ponuda</th>
              {serije.map((s) => <th key={s} className="py-1.5 font-semibold">{def[s].n}</th>)}
            </tr>
          </thead>
          <tbody>
            {podaci.map((m) => (
              <tr key={m.kljuc} className="border-b border-line/60">
                <td className="py-1.5 text-left">{m.naziv}</td>
                <td className="py-1.5 tabular-nums">{m.broj}</td>
                {serije.map((s) => <td key={s} className="py-1.5 font-semibold tabular-nums">{fmt(m[s])}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Grafikon po mesecima">
            {podele.map((v) => (
              <g key={v}>
                <line x1={L} x2={W} y1={y(v)} y2={y(v)} stroke="#e7e5df" strokeWidth={1} />
                <text x={L - 8} y={y(v) + 4} textAnchor="end" fontSize={11} fill="#7a7e7a">
                  {v >= 1000 ? `${(v / 1000).toLocaleString("sr-RS", { maximumFractionDigits: 1 })}k` : v}
                </text>
              </g>
            ))}
            {podaci.map((m, i) => {
              const cx = L + sirinaGrupe * (i + 0.5);
              const x0 = cx - (sirinaStuba * serije.length + 2 * (serije.length - 1)) / 2;
              return (
                <g key={m.kljuc} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                  {/* veća zona za hover */}
                  <rect x={L + sirinaGrupe * i} y={T} width={sirinaGrupe} height={H - T - B} fill={hover === i ? "#f2f1ec" : "transparent"} />
                  {serije.map((s, j) => {
                    const v = Math.max(0, m[s]);
                    const h = Math.max(0, H - B - y(v));
                    const x = x0 + j * (sirinaStuba + 2);
                    const r = Math.min(4, h / 2, sirinaStuba / 2);
                    return h > 0 ? (
                      <path
                        key={s}
                        d={`M${x} ${H - B} V${y(v) + r} Q${x} ${y(v)} ${x + r} ${y(v)} H${x + sirinaStuba - r} Q${x + sirinaStuba} ${y(v)} ${x + sirinaStuba} ${y(v) + r} V${H - B} Z`}
                        fill={def[s].c}
                      />
                    ) : null;
                  })}
                  <text x={cx} y={H - 8} textAnchor="middle" fontSize={11} fill="#7a7e7a">{m.naziv}</text>
                </g>
              );
            })}
            <line x1={L} x2={W} y1={H - B} y2={H - B} stroke="#c9c6bd" strokeWidth={1} />
          </svg>
          {hover !== null && (
            <div
              className="pointer-events-none absolute top-0 z-10 rounded-lg border border-line bg-white px-3 py-2 text-xs shadow-lg"
              style={{ left: `${((L + sirinaGrupe * (hover + 0.5)) / W) * 100}%`, transform: "translateX(-50%)" }}
            >
              <p className="mb-1 font-bold">{podaci[hover].naziv} · {podaci[hover].broj} ponuda</p>
              {serije.map((s) => (
                <p key={s} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm" style={{ background: def[s].c }} />
                  <span className="text-muted">{def[s].n}:</span> <b>{fmt(podaci[hover][s])}</b>
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
