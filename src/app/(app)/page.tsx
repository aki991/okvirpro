import Link from "next/link";
import { AlertTriangle, CheckCircle2, Euro, FileText, Globe, Lightbulb, Plus, Target, Trophy } from "lucide-react";
import { db } from "@/lib/db";
import { datum, eur } from "@/lib/format";
import { poMesecima } from "@/lib/finansije";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { MesecniGrafikon } from "@/components/MesecniGrafikon";

export const dynamic = "force-dynamic";

export default async function Pregled() {
  const [sve, otvoreneReklamacije] = await Promise.all([
    db.ponuda.findMany({ orderBy: { createdAt: "desc" }, include: { klijent: { select: { id: true, naziv: true } } } }),
    db.reklamacija.count({ where: { status: "OTVORENO" } }),
  ]);
  const potvrdjene = sve.filter((p) => p.status !== "NACRT");
  const noviUpiti = sve.filter((p) => p.izvor === "SAJT" && !p.pregledano).length;
  const ukupno = sve.length;
  const prosek = potvrdjene.length ? potvrdjene.reduce((s, p) => s + p.ukupnoZaNaplatu, 0) / potvrdjene.length : 0;
  const stopa = ukupno ? (potvrdjene.length / ukupno) * 100 : 0;

  // top 5 kupaca po vrednosti potvrđenih ponuda
  const poKupcu = new Map<number, { naziv: string; iznos: number; broj: number }>();
  for (const p of potvrdjene) {
    const x = poKupcu.get(p.klijent.id) ?? { naziv: p.klijent.naziv, iznos: 0, broj: 0 };
    x.iznos += p.ukupnoZaNaplatu;
    x.broj += 1;
    poKupcu.set(p.klijent.id, x);
  }
  const top = [...poKupcu.entries()].sort((a, b) => b[1].iznos - a[1].iznos).slice(0, 5);

  const kasne = potvrdjene.filter((p) => p.status === "POTVRDJENO" && p.rokIsporuke && p.rokIsporuke < new Date()).length;
  const nacrti = ukupno - potvrdjene.length;

  const kartice = [
    { n: "Ukupno ponuda", v: ukupno.toString(), o: "U bazi", i: FileText },
    { n: "Potvrđeno", v: potvrdjene.length.toString(), o: `${stopa.toFixed(0)}% od ukupno`, i: CheckCircle2 },
    { n: "Prosečna ponuda", v: eur(prosek), o: "Vrednost potvrđenih", i: Euro },
    { n: "Stopa uspešnosti", v: `${stopa.toFixed(1)} %`, o: "Nacrt → potvrđeno", i: Target },
  ];

  const savet =
    kasne > 0
      ? `${kasne} ${kasne === 1 ? "posao je prešao" : "posla su prešla"} rok isporuke, a nisu označeni kao realizovani. Proveri ih u finansijskom prikazu.`
      : nacrti > 0
        ? `Imaš ${nacrti} ${nacrti === 1 ? "ponudu" : "ponuda"} u nacrtu. Redovno prebacuj dogovorene poslove u status „Potvrđeno“ – samo tada ulaze u analitiku, radne naloge i krojne liste.`
        : "Potvrđene ponude automatski dobijaju radni nalog, krojnu listu, porudžbenice, ugovor o avansu i račun.";

  return (
    <>
      <PageHeader
        naslov="Pregled"
        akcije={
          <Link href="/ponude/nova" className="btn-primary">
            <Plus size={16} /> Nova ponuda
          </Link>
        }
      />
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kartice.map((k) => (
            <div key={k.n} className="card p-5">
              <div className="flex items-center justify-between text-sm text-muted">
                {k.n}
                <k.i size={18} className="text-brand" />
              </div>
              <p className="mt-2 text-3xl font-extrabold tracking-tight">{k.v}</p>
              <p className="mt-1 text-xs text-muted">{k.o}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <section className="card p-6 xl:col-span-2">
            <h2 className="font-bold">Promet po mesecima</h2>
            <p className="mb-4 text-sm text-muted">Prihod bez PDV-a od potvrđenih ponuda, poslednjih 6 meseci</p>
            <MesecniGrafikon podaci={poMesecima(potvrdjene, 6)} serije={["prihod"]} />
          </section>

          <section className="card p-6">
            <h2 className="flex items-center gap-2 font-bold"><Trophy size={17} className="text-accent" /> Najveći kupci</h2>
            <p className="mb-4 text-sm text-muted">Top 5 po vrednosti potvrđenih poslova</p>
            {top.length === 0 ? (
              <p className="text-sm text-muted">Još nema potvrđenih poslova.</p>
            ) : (
              <ol className="space-y-3">
                {top.map(([id, k], i) => (
                  <li key={id} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand">#{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{k.naziv}</p>
                      <p className="text-xs text-muted">{k.broj} {k.broj === 1 ? "posao" : "posla"}</p>
                    </div>
                    <span className="font-bold">{eur(k.iznos)}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <section className="card p-6 xl:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold">Poslednje ponude</h2>
              <Link href="/ponude" className="text-sm font-semibold text-brand hover:underline">Sve ponude →</Link>
            </div>
            {sve.length === 0 ? (
              <p className="text-sm text-muted">Još nema ponuda. <Link href="/ponude/nova" className="font-semibold text-brand">Napravi prvu →</Link></p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {sve.slice(0, 6).map((p) => (
                    <tr key={p.id} className="border-b border-line/60 last:border-0">
                      <td className="py-2 text-left"><Link href={`/ponude/${p.id}`} className="font-mono font-semibold text-brand hover:underline">{p.broj}</Link></td>
                      <td className="py-2 text-left">{p.klijent.naziv}</td>
                      <td className="py-2 text-muted">{datum(p.createdAt)}</td>
                      <td className="py-2"><StatusBadge status={p.status} /></td>
                      <td className="py-2 font-semibold tabular-nums">{eur(p.ukupnoZaNaplatu)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="space-y-4">
            <div className="card border-accent/40 bg-accent-soft/60 p-5">
              <p className="flex items-center gap-2 font-bold"><Lightbulb size={17} className="text-accent" /> Brzi savet</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{savet}</p>
            </div>
            {noviUpiti > 0 && (
              <Link href="/ponude" className="card flex items-center gap-3 border-accent p-5 transition hover:bg-accent-soft/40">
                <Globe size={20} className="text-accent" />
                <div>
                  <p className="font-bold">{noviUpiti} {noviUpiti === 1 ? "nov upit" : "novih upita"} sa sajta</p>
                  <p className="text-xs text-muted">Kupci su sami izračunali cenu – proveri i potvrdi ponude</p>
                </div>
              </Link>
            )}
            {otvoreneReklamacije > 0 && (
              <Link href="/reklamacije" className="card flex items-center gap-3 p-5 transition hover:border-danger">
                <AlertTriangle size={20} className="text-danger" />
                <div>
                  <p className="font-bold">{otvoreneReklamacije} {otvoreneReklamacije === 1 ? "otvorena reklamacija" : "otvorenih reklamacija"}</p>
                  <p className="text-xs text-muted">Klikni za pregled zapisnika</p>
                </div>
              </Link>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
