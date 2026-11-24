import { notFound } from "next/navigation";
import { napraviPlan, ucitajProizvodnju } from "@/lib/proizvodnja";
import { MIN_OSTATAK, POCETNI_ODSECAK, REZ, type Komad, type PlanProfila } from "@/lib/krojenje";
import { PageHeader } from "@/components/PageHeader";
import { StampajDugme } from "@/components/StampajDugme";
import { NazadDugme } from "@/components/NazadDugme";
import { KnjizenjeDugme } from "./KnjizenjeDugme";

export const dynamic = "force-dynamic";

const PLAVA = "#1f6fd1"; // kosi rez 45°
const ZELENA = "#12906a"; // ravan rez 90°
const TACNO = "[print-color-adjust:exact] [-webkit-print-color-adjust:exact]";

// Značenje oznaka komada: P + broj pozicije + slovni kod (npr. P1RV = pozicija 1, ram, vertikalno)
const KODOVI: [string, string][] = [
  ["RH", "ram, horizontalno (gornji i donji štok – po širini)"],
  ["RV", "ram, vertikalno (levi i desni štok – po visini)"],
  ["H", "krilo / lajsna, horizontalno (po širini)"],
  ["V", "krilo / lajsna, vertikalno (po visini)"],
  ["PRH", "prečka, horizontalna"],
  ["PRV", "prečka, vertikalna"],
  ["PR", "čelično ojačanje prečke"],
  ["ST", "štulp (lažna prečka)"],
  ["PL / PD", "proširenje levo / desno"],
  ["PS", "podštok"],
  ["PG", "prag (vrata)"],
];

/** Objašnjenje jedne oznake, npr. „P1RV“ → „pozicija 1 · ram, vertikalno“. */
function opisOznake(oznaka: string) {
  const m = oznaka.match(/^P(\d+)(.*)$/);
  if (!m) return oznaka;
  const kod = KODOVI.find(([k]) => k.split(" / ").includes(m[2]));
  return `pozicija ${m[1]}${kod ? ` · ${kod[1]}` : ""}`;
}

/** Oblik komada: trapez (duža ivica gore) za kosi rez 45°, pravougaonik za ravan rez. */
const OBLIK_45 = "polygon(0 0,100% 0,calc(100% - min(32px,32%)) 100%,min(32px,32%) 100%)"; // 32 px = visina šipke → pravi ugao od 45°

function Sipka({ s, rb }: { s: PlanProfila["sipke"][number]; rb: number }) {
  const ost = s.izvor === "OSTATAK";
  const pct = (mm: number) => `${(mm / s.duzina) * 100}%`;
  // položaj komada: nova šipka gubi 10 mm na početku, svaki rez troši 4 mm
  let pos = ost ? 0 : POCETNI_ODSECAK;
  const raspored = s.komadi.map((k) => {
    const levo = pos;
    pos += k.mera + REZ;
    return { k, levo };
  });

  // tabela: isti komadi (mera + ugao) se grupišu, pozicije se nabrajaju
  const grupe = new Map<string, { mera: number; ugao?: string; kom: number; poz: string[] }>();
  for (const k of s.komadi) {
    const kljuc = `${k.mera}|${k.ugao ?? ""}`;
    const g = grupe.get(kljuc) ?? { mera: k.mera, ugao: k.ugao, kom: 0, poz: [] };
    g.kom++;
    if (!g.poz.includes(k.oznaka)) g.poz.push(k.oznaka);
    grupe.set(kljuc, g);
  }
  const tabela = [...grupe.values()].sort((a, b) => b.mera - a.mera);
  const otpad = s.ostatak < MIN_OSTATAK;

  return (
    <div className="break-inside-avoid border-b border-line py-4 last:border-b-0">
      <div className="grid grid-cols-[4.5rem_minmax(0,1fr)_6.5rem] items-start gap-x-3">
        <div className="pt-1">
          <p className={`text-sm font-bold ${ost ? "text-emerald-700" : "text-foreground"}`}>{ost ? "Ostatak" : `Šipka ${rb}`}</p>
          <p className="text-[11px] text-muted">{s.duzina} mm</p>
        </div>

        {/* šipka: komadi u razmeri, prazno je šrafirano */}
        <div>
          <div
            className={`relative h-8 overflow-hidden rounded-md border border-[#aeb9bf] ${TACNO}`}
            style={{ background: "repeating-linear-gradient(135deg,#f1f4f5 0 7px,#d3dbdf 7px 8px)" }}
          >
            {raspored.map(({ k, levo }, i) => (
              <div
                key={i}
                title={`${k.oznaka} – ${opisOznake(k.oznaka)}`}
                className={`absolute top-0 flex h-full items-center justify-center ${TACNO}`}
                style={{
                  left: pct(levo),
                  width: pct(k.mera),
                  background: k.ugao === "45" ? PLAVA : ZELENA,
                  clipPath: k.ugao === "45" ? OBLIK_45 : undefined,
                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,.25)",
                }}
              >
                <span className="whitespace-nowrap tabular-nums text-sm font-extrabold text-white drop-shadow-sm">{k.mera}</span>
              </div>
            ))}
          </div>

          {/* ispod šipke: ugao na oba kraja svakog komada i oznaka pozicije u sredini */}
          <div className="relative mt-1 h-5 text-[11px] font-bold leading-none">
            {raspored.map(({ k, levo }, i) => {
              const ugao = k.ugao === "45" ? "45" : "90";
              const boja = k.ugao === "45" ? PLAVA : ZELENA;
              const kraj = { color: k.ugao === "45" ? PLAVA : "#7b8a86" };
              return (
                <span key={i}>
                  <span className="absolute top-0 pl-1" style={{ left: pct(levo), ...kraj }}>{ugao}</span>
                  <span className="absolute top-0 -translate-x-full pr-1" style={{ left: pct(levo + k.mera), ...kraj }}>{ugao}</span>
                  <span className="absolute top-0 -translate-x-1/2 whitespace-nowrap" style={{ left: pct(levo + k.mera / 2), color: boja }} title={opisOznake(k.oznaka)}>
                    {k.oznaka}
                  </span>
                </span>
              );
            })}
          </div>
        </div>

        <div className="pt-0.5 text-right">
          <p className="text-[11px] text-muted">{otpad ? "Otpad" : "Ostatak"}</p>
          <p className={`tabular-nums text-sm font-extrabold ${otpad ? "text-danger" : "text-foreground"}`}>
            {Math.round(s.ostatak).toLocaleString("sr-RS")} mm
          </p>
        </div>
      </div>

      {/* tabela komada na šipki */}
      <table className="mt-1 w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] font-bold uppercase text-muted">
            <th className="w-36 py-1 pr-3 font-bold">Dužina</th>
            <th className="w-20 py-1 pr-3 font-bold">Ugao</th>
            <th className="w-14 py-1 pr-3 text-right font-bold">Kom.</th>
            <th className="py-1 pl-3 font-bold">Pozicije</th>
          </tr>
        </thead>
        <tbody>
          {tabela.map((g, i) => (
            <tr key={i} className="border-t border-line">
              <td className="py-1 pr-3 tabular-nums font-bold">{g.mera.toLocaleString("sr-RS")} mm</td>
              <td className="py-1 pr-3 font-bold" style={{ color: g.ugao === "45" ? PLAVA : ZELENA }}>{g.ugao === "45" ? "45° kosi" : "90° ravno"}</td>
              <td className="py-1 pr-3 text-right tabular-nums font-bold">{g.kom}</td>
              <td className="py-1 pl-3 text-brand">{g.poz.join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const ukupnoKomada = (k: Komad[]) => k.length;

export default async function KrojnaLista({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await ucitajProizvodnju(Number(id));
  if (!p) notFound();
  const { ponuda } = p;

  // posle knjiženja prikazujemo sačuvan plan (magacin se u međuvremenu promenio)
  const plan: PlanProfila[] = ponuda.utrosakProknjizen && ponuda.krojnaLista ? JSON.parse(ponuda.krojnaLista) : await napraviPlan(p);
  const ukupnoNovih = plan.reduce((a, x) => a + x.punihSipki, 0);
  const ukupnoOstataka = plan.reduce((a, x) => a + x.iskoriscenihOstataka, 0);

  return (
    <>
      <PageHeader
        naslov={`Krojna lista ${ponuda.broj}`}
        akcije={
          <>
            <NazadDugme href="/krojne-liste" />
            <KnjizenjeDugme id={ponuda.id} proknjizeno={ponuda.utrosakProknjizen} nacrt={ponuda.status === "NACRT"} />
            <StampajDugme label="Štampaj" />
          </>
        }
      />
      <div className="p-4 sm:p-6 lg:p-8 print:p-0">
        <article className="mx-auto max-w-5xl overflow-x-auto bg-white p-4 shadow-sm ring-1 ring-line sm:p-6 lg:p-8 print:max-w-none print:p-0 print:shadow-none print:ring-0">
          <header className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-brand pb-4">
            <div>
              <p className="text-2xl font-extrabold tracking-tight">OPTIMIZACIJA SEČENJA</p>
              <p className="mt-1 text-sm">Nalog: <b className="tabular-nums">{ponuda.broj}</b> · Kupac: <b>{ponuda.klijent.naziv}</b></p>
            </div>
            <div className="flex gap-6 text-right text-sm">
              <div><p className="text-2xl font-extrabold text-brand">{ukupnoNovih}</p><p className="text-xs text-muted">novih šipki</p></div>
              <div><p className="text-2xl font-extrabold text-emerald-600">{ukupnoOstataka}</p><p className="text-xs text-muted">ostataka iz magacina</p></div>
            </div>
          </header>

          {plan.length === 0 && <p className="py-10 text-center text-sm text-muted">Nalog nema profilnih pozicija za sečenje.</p>}

          <div className="mt-6 space-y-8">
            {plan.map((pr) => {
              let rbNove = 0;
              const komada = ukupnoKomada(pr.sipke.flatMap((s) => s.komadi));
              const ukupnaDuzina = pr.sipke.reduce((a, s) => a + s.duzina, 0);
              const iskorisceno = ukupnaDuzina ? (pr.sipke.reduce((a, s) => a + s.komadi.reduce((b, k) => b + k.mera, 0), 0) / ukupnaDuzina) * 100 : 0;
              return (
                <section key={pr.profilStavkaId}>
                  <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1 rounded-lg bg-background px-4 py-3">
                    <div>
                      <p className="text-lg font-extrabold">{pr.profil}</p>
                      <p className="text-xs text-muted">
                        {pr.sistem} · {komada} {komada === 1 ? "komad" : "komada"} · {pr.metara.toFixed(2).replace(".", ",")} m · šipka {pr.duzinaSipke} mm
                      </p>
                    </div>
                    <p className="text-sm font-bold text-muted">
                      <span className="text-brand">
                        {pr.punihSipki} {pr.punihSipki === 1 ? "šipka" : "šipke"}
                      </span>
                      {pr.iskoriscenihOstataka > 0 && <span className="text-emerald-700"> + {pr.iskoriscenihOstataka} {pr.iskoriscenihOstataka === 1 ? "ostatak" : "ostatka"}</span>}
                      <span className="mx-2 font-normal">·</span>
                      iskorišćenje <span className={iskorisceno < 50 ? "text-danger" : "text-brand"}>{iskorisceno.toFixed(1).replace(".", ",")} %</span>
                    </p>
                  </div>
                  {pr.greska && <p className="mt-2 rounded bg-red-50 px-3 py-1.5 text-sm text-danger">{pr.greska}</p>}
                  <div className="mt-1">
                    {pr.sipke.map((s, i) => (
                      <Sipka key={i} s={s} rb={s.izvor === "NOVA" ? ++rbNove : 0} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          <div className="mt-8 break-inside-avoid rounded-lg bg-background p-4 text-xs leading-relaxed text-muted">
            <p className="mb-1 font-bold uppercase text-foreground">Kako se čita</p>
            <p>
              Na šipki je svaki komad nacrtan u razmeri sa merom (duža ivica). Ispod komada je ugao sečenja na oba kraja:{" "}
              <b style={{ color: PLAVA }}>45</b> = kosi rez (ram, krila, lajsne), <b style={{ color: ZELENA }}>90</b> = ravan rez (prečke, štulp, čelik, podštok, proširenja, prag). Šrafirano je ostatak šipke.
            </p>
            <p className="mt-1">
              Oznaka komada je <b>P</b> + broj pozicije + kod, npr. <b>P1RV</b> = pozicija 1, ram, vertikalno. Kodovi:
            </p>
            <ul className="mt-1 grid gap-x-6 sm:grid-cols-2">
              {KODOVI.map(([k, o]) => (
                <li key={k}><b className="tabular-nums text-foreground">{k}</b> – {o}</li>
              ))}
            </ul>
            <p className="mt-2">Na novoj šipki se odseca {POCETNI_ODSECAK} mm, a za svaki rez se računa {REZ} mm. Sistem prvo koristi ostatke iz magacina duže od {MIN_OSTATAK} mm; posle knjiženja novi ostaci duži od {MIN_OSTATAK} mm se vraćaju u magacin. Knjiženje je moguće samo jednom po nalogu.</p>
          </div>
        </article>
      </div>
    </>
  );
}
