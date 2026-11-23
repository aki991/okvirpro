import { notFound } from "next/navigation";
import { Ruler } from "lucide-react";
import { napraviPlan, ucitajProizvodnju } from "@/lib/proizvodnja";
import { MIN_OSTATAK, POCETNI_ODSECAK, REZ, type PlanProfila } from "@/lib/krojenje";
import { PageHeader } from "@/components/PageHeader";
import { StampajDugme } from "@/components/StampajDugme";
import { NazadDugme } from "@/components/NazadDugme";
import { KnjizenjeDugme } from "./KnjizenjeDugme";

export const dynamic = "force-dynamic";

const BOJE = ["#0f4c45", "#2a7f73", "#4f9d8f", "#c98a2b", "#8a6a3b", "#3d6e8f"];

/** Mala silueta komada: trapez za kosi rez 45°/45°, pravougaonik za ravan rez. */
function OblikKomada({ ugao, obrnut }: { ugao: "45" | "90"; obrnut: boolean }) {
  const d = ugao === "45" ? (obrnut ? "M1 1 H39 L35 7 H5 Z" : "M5 1 H35 L39 7 H1 Z") : "M1 1 H39 V7 H1 Z";
  return (
    <svg viewBox="0 0 40 8" className="mx-auto mt-0.5 block h-2 w-10" aria-hidden="true">
      <path d={d} fill={ugao === "45" ? "#f7ecd9" : "#e3efec"} stroke={ugao === "45" ? "#c98a2b" : "#0f4c45"} strokeWidth={1} />
    </svg>
  );
}

function Sipka({ s, rb }: { s: PlanProfila["sipke"][number]; rb: number }) {
  const ost = s.izvor === "OSTATAK";
  const iskorisceno = ((s.duzina - s.ostatak) / s.duzina) * 100;
  return (
    <div className={`break-inside-avoid rounded-lg border border-line bg-white p-3 ${ost ? "border-l-4 border-l-emerald-500" : "border-l-4 border-l-brand"}`}>
      <div className="flex items-center gap-3">
        <span className={`flex h-9 w-12 shrink-0 items-center justify-center rounded-md text-xs font-extrabold ${ost ? "bg-emerald-50 text-emerald-700" : "bg-brand-soft text-brand"}`}>
          {ost ? "OST" : `#${rb}`}
        </span>
        <div className="flex flex-1 flex-wrap gap-1.5">
          {s.komadi.map((k, i) => (
            <span key={i} className="rounded-md border border-line bg-background px-2 py-0.5 text-center leading-tight">
              <span className="block text-[9px] font-bold text-muted">
                {k.oznaka}
                {k.ugao && <span className={k.ugao === "45" ? "ml-1 text-accent" : "ml-1"}>{k.ugao === "45" ? "∠45°" : "90°"}</span>}
              </span>
              <span className="font-mono text-sm font-bold">{k.mera}</span>
              {k.ugao && <OblikKomada ugao={k.ugao} obrnut={i % 2 === 1} />}
            </span>
          ))}
        </div>
        <span className={`rounded-md px-2 py-0.5 text-center leading-tight ${s.ostatak >= MIN_OSTATAK ? "bg-accent-soft text-accent" : "bg-red-50 text-danger"}`}>
          <span className="block text-[9px] font-bold">{s.ostatak >= MIN_OSTATAK ? "OSTATAK" : "OTPAD"}</span>
          <span className="font-mono text-sm font-bold">{Math.round(s.ostatak)}</span>
        </span>
      </div>
      {/* traka iskorišćenosti */}
      <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-red-100">
        {s.komadi.map((k, i) => (
          <div
            key={i}
            style={{
              width: `${(k.mera / s.duzina) * 100}%`,
              background: BOJE[i % BOJE.length],
              // kosi rez: trapez, naizmenično okrenut (tako se komadi slažu na šipki)
              clipPath: k.ugao === "45" ? (i % 2 ? "polygon(0 0,100% 0,calc(100% - 6px) 100%,6px 100%)" : "polygon(6px 0,calc(100% - 6px) 0,100% 100%,0 100%)") : undefined,
            }}
            className="border-r border-white"
          />
        ))}
      </div>
      <p className="mt-1 text-[10px] text-muted">
        {ost ? "Ostatak iz magacina" : "Nova šipka"} {s.duzina} mm · iskorišćeno {iskorisceno.toFixed(0)}%
      </p>
    </div>
  );
}

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
        <article className="mx-auto overflow-x-auto max-w-5xl bg-white p-4 sm:p-6 lg:p-8 shadow-sm ring-1 ring-line print:max-w-none print:p-0 print:shadow-none print:ring-0">
          <header className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-brand pb-4">
            <div>
              <p className="text-2xl font-extrabold tracking-tight">OPTIMIZACIJA SEČENJA</p>
              <p className="mt-1 text-sm">Nalog: <b className="font-mono">{ponuda.broj}</b> · Kupac: <b>{ponuda.klijent.naziv}</b></p>
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
              return (
                <section key={pr.profilStavkaId} className="break-inside-avoid-page">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-background px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Ruler size={17} className="text-brand" />
                      <div>
                        <p className="font-extrabold uppercase">{pr.profil}</p>
                        <p className="text-[11px] uppercase text-muted">{pr.sistem} · šipka {pr.duzinaSipke} mm · potrebno {pr.metara.toFixed(2)} m</p>
                      </div>
                    </div>
                    <p className="text-xs font-bold uppercase">
                      Pune šipke: <span className="text-brand">{pr.punihSipki}</span> · Iskorišćeni ostaci: <span className="text-emerald-600">{pr.iskoriscenihOstataka}</span>
                    </p>
                  </div>
                  {pr.greska && <p className="mb-2 rounded bg-red-50 px-3 py-1.5 text-sm text-danger">{pr.greska}</p>}
                  <div className="space-y-2">
                    {pr.sipke.map((s, i) => (
                      <Sipka key={i} s={s} rb={s.izvor === "NOVA" ? ++rbNove : 0} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          <div className="mt-8 rounded-lg bg-background p-4 text-xs leading-relaxed text-muted">
            <p className="mb-1 font-bold uppercase text-foreground">Napomene</p>
            <p>
              Ugao sečenja: <b className="text-accent">∠45°</b> = kosi rez na oba kraja (ram, krila, lajsne – mera je po dužoj ivici), <b>90°</b> = ravan rez
              (prečke, štulp, čelik, podštok, proširenja, prag).
            </p>
            <p>Oznaka komada: P = pozicija, H = horizontalno, V = vertikalno, R = ram, PR = prečka. Na novoj šipki se odseca {POCETNI_ODSECAK} mm, a za svaki rez se računa {REZ} mm.</p>
            <p>Sistem prvo koristi ostatke iz magacina duže od {MIN_OSTATAK} mm. Posle knjiženja novi ostaci duži od {MIN_OSTATAK} mm se vraćaju u magacin.</p>
            <p>Knjiženje je moguće samo jednom po nalogu.</p>
          </div>
        </article>
      </div>
    </>
  );
}
