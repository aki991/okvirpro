import { granice, svgPutanja, type Presek } from "@/lib/profili-3d";

// 2D poprečni presek sa kotama – za poređenje sa 3D modelom i vežbanje crtanja.
export function PresekSvg({ p }: { p: Presek }) {
  const g = granice(p);
  // uključi i kote u okvir crteža
  const kx = p.koteCrtez.filter((k) => k.tip === "v").map((k) => k.poz);
  const ky = p.koteCrtez.filter((k) => k.tip === "h").map((k) => k.poz);
  const minX = Math.min(g.minX, ...kx) - 6;
  const maxX = Math.max(g.maxX, ...kx) + 4;
  const minY = Math.min(g.minY, ...ky) - 5;
  const maxY = Math.max(g.maxY, ...ky) + 9;
  const H = maxY; // okretanje ose y: y_svg = H − y
  const y = (v: number) => H - v;
  const put = (k: Parameters<typeof svgPutanja>[0]) => svgPutanja(k, H);
  const s = (maxX - minX) / 130; // razmera teksta i linija prema veličini profila
  const kota = "#4b5552";
  const telo = [put(p.spoljna), ...p.komore.map((k) => put(k.kontura))].join(" ");

  return (
    <svg viewBox={`${minX} 0 ${maxX - minX} ${maxY - minY}`} className="w-full" role="img" aria-label={`Presek ${p.naziv}`}>
      <defs>
        <pattern id={`sraf-${p.sifra}`} width={1.6 * s} height={1.6 * s} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1={0} y1={0} x2={0} y2={1.6 * s} stroke="#b9bfbd" strokeWidth={0.25 * s} />
        </pattern>
      </defs>

      {/* PVC telo sa komorama (evenodd = komore su šupljine) */}
      <path d={telo} fill="#fbfbf8" fillRule="evenodd" stroke="#2f3a38" strokeWidth={0.35 * s} />
      <path d={telo} fill={`url(#sraf-${p.sifra})`} fillRule="evenodd" />

      {p.celik && (
        <path
          d={`${put(p.celik.spoljna)} ${p.celik.unutrasnja ? put(p.celik.unutrasnja) : ""}`}
          fill="#d6353a"
          fillOpacity={0.85}
          fillRule="evenodd"
          stroke="#9b1f23"
          strokeWidth={0.2 * s}
        />
      )}

      {p.zaptivke.map((z) => (
        <path key={z.naziv} d={put(z.kontura)} fill="#1d1f20" />
      ))}

      {/* brojevi komora (kod glavne komore u ugao, da ne prekriju čelik) */}
      {p.komore.map((k, i) => {
        const xs = k.kontura.map((t) => t[0]);
        const ys = k.kontura.map((t) => t[1]);
        const sirina = Math.max(...xs) - Math.min(...xs);
        const visina = Math.max(...ys) - Math.min(...ys);
        const glavna = p.celik && k.naziv.includes("čelik");
        const r = Math.min(2 * s, sirina / 2.4, visina / 2.4);
        const cx = glavna ? Math.min(...xs) + r + 0.6 : (Math.min(...xs) + Math.max(...xs)) / 2;
        const cy = glavna ? Math.max(...ys) - r - 0.6 : (Math.min(...ys) + Math.max(...ys)) / 2;
        return (
          <g key={i}>
            <circle cx={cx} cy={y(cy)} r={r} fill="#0f4c45" />
            <text x={cx} y={y(cy) + r * 0.55} fontSize={r * 1.5} fontWeight={800} fill="#fff" textAnchor="middle">{i + 1}</text>
          </g>
        );
      })}

      <text x={g.minX} y={y(g.maxY) - 3 * s} fontSize={3 * s} fill={kota} fontWeight={700}>{p.strane[0]}</text>
      <text x={g.maxX} y={y(g.maxY) - 3 * s} fontSize={3 * s} fill={kota} fontWeight={700} textAnchor="end">{p.strane[1]}</text>

      {/* kote */}
      {p.koteCrtez.map((k, i) =>
        k.tip === "h" ? (
          <g key={i} stroke={kota} strokeWidth={0.25 * s}>
            <line x1={k.a} y1={y(k.poz)} x2={k.b} y2={y(k.poz)} />
            {[k.a, k.b].map((x) => <line key={x} x1={x - s} y1={y(k.poz) + s} x2={x + s} y2={y(k.poz) - s} strokeWidth={0.4 * s} />)}
            <text x={(k.a + k.b) / 2} y={y(k.poz) - 1.2 * s} fontSize={3.2 * s} fontWeight={700} textAnchor="middle" fill="#1c1f1e" stroke="none">{k.tekst}</text>
          </g>
        ) : (
          <g key={i} stroke={kota} strokeWidth={0.25 * s}>
            <line x1={k.poz} y1={y(k.a)} x2={k.poz} y2={y(k.b)} />
            {[k.a, k.b].map((v) => <line key={v} x1={k.poz - s} y1={y(v) + s} x2={k.poz + s} y2={y(v) - s} strokeWidth={0.4 * s} />)}
            <text
              x={k.poz - 1.4 * s}
              y={(y(k.a) + y(k.b)) / 2}
              fontSize={3.2 * s}
              fontWeight={700}
              textAnchor="middle"
              fill="#1c1f1e"
              stroke="none"
              transform={`rotate(-90 ${k.poz - 1.4 * s} ${(y(k.a) + y(k.b)) / 2})`}
            >
              {k.tekst}
            </text>
          </g>
        ),
      )}
    </svg>
  );
}
