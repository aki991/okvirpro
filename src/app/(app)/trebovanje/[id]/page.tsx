import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipboardList, Layers, Package, PackagePlus, Scissors, Shield, SquareStack, Wrench } from "lucide-react";
import { db } from "@/lib/db";
import { ucitajProizvodnju } from "@/lib/proizvodnja";
import { napraviTrebovanje, POTROSNI, type RedProfila } from "@/lib/trebovanje";
import { datum } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { StampajDugme } from "@/components/StampajDugme";
import { NazadDugme } from "@/components/NazadDugme";
import { ZaglavljeFirme } from "@/components/ZaglavljeFirme";

export const dynamic = "force-dynamic";

const br = (n: number, dec = 2) => n.toLocaleString("sr-RS", { minimumFractionDigits: 0, maximumFractionDigits: dec });
const poz = (p: number[]) => [...p].sort((a, b) => a - b).join(", ");

/** Tabela sa kolonom za čekiranje izdatog (za štampu). */
function Tabela({
  naslov,
  ikona: Ikona,
  kolone,
  desno = [],
  redovi,
  zbir,
  napomena,
}: {
  naslov: string;
  ikona: React.ElementType;
  kolone: string[];
  desno?: number[];
  redovi: React.ReactNode[][];
  zbir?: React.ReactNode[];
  napomena?: React.ReactNode;
}) {
  if (redovi.length === 0) return null;
  // prva kolona (naziv) levo, sve ostale centrirane ispod naziva kolone
  const d = (j: number) => (j === 0 ? "text-left" : desno.includes(j) ? "tabular-nums" : "");
  return (
    <section className="break-inside-avoid">
      <p className="mb-2 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-brand">
        <Ikona size={16} /> {naslov}
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-y border-line bg-background text-left text-[11px] uppercase tracking-wide text-muted">
            {kolone.map((k, j) => (
              <th key={k} className={`px-2 py-1.5 font-semibold ${d(j)}`}>{k}</th>
            ))}
            <th className="w-12 px-2 py-1.5 text-center font-semibold">Izdato</th>
          </tr>
        </thead>
        <tbody>
          {redovi.map((r, i) => (
            <tr key={i} className="border-b border-line/60">
              {r.map((c, j) => (
                <td key={j} className={`px-2 py-1.5 ${d(j)}`}>{c}</td>
              ))}
              <td className="px-2 py-1.5 text-center">
                <span className="inline-block h-4 w-4 rounded border border-foreground/40" />
              </td>
            </tr>
          ))}
          {zbir && (
            <tr className="font-bold">
              {zbir.map((c, j) => (
                <td key={j} className={`px-2 py-1.5 ${d(j)}`}>{c}</td>
              ))}
              <td />
            </tr>
          )}
        </tbody>
      </table>
      {napomena && <p className="mt-1.5 text-xs text-muted">{napomena}</p>}
    </section>
  );
}

function redProfila(p: RedProfila) {
  return [
    <span key="p">
      <b>{p.profil}</b>
      <span className="block text-xs text-muted">{p.sistem}</span>
    </span>,
    p.boja ? <span key="b" className="rounded bg-accent-soft px-1.5 py-0.5 text-xs font-bold text-accent">{p.boja}</span> : <span key="b" className="text-muted">{p.celik ? "–" : "bela"}</span>,
    br(p.duzinaSipke, 0),
    p.komada,
    br(p.metara),
    <b key="s" className="text-base">{p.noveSipke}</b>,
    p.ostaci.length ? <span key="o" className="text-emerald-700">{p.ostaci.map((x) => br(x, 0)).join(" + ")}</span> : "–",
    p.naStanju === null ? <span key="n" className="text-muted">–</span> : p.naStanju,
    p.nedostaje ? <b key="d" className="text-danger">{p.nedostaje}</b> : <span key="d" className="text-emerald-700">0</span>,
    `${br(p.iskoriscenje, 1)} %`,
  ];
}

const KOLONE_PROFILA = ["Profil", "Boja", "Šipka (mm)", "Komada", "Metara", "Celih šipki", "Ostaci iz magacina (mm)", "Na stanju", "Nedostaje", "Iskorišć."];

export default async function Trebovanje({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await ucitajProizvodnju(Number(id));
  if (!p) notFound();
  const [firma, t] = await Promise.all([db.firma.findUniqueOrThrow({ where: { id: 1 } }), napraviTrebovanje(p)]);
  const { ponuda } = p;

  const profili = t.profili.filter((x) => !x.celik);
  const celik = t.profili.filter((x) => x.celik);
  const sipki = t.profili.reduce((a, x) => a + x.noveSipke, 0);
  const nedostaje = t.profili.reduce((a, x) => a + x.nedostaje, 0);
  const stakla = t.staklo.reduce((a, x) => a + x.kom, 0);
  const m2Stakla = t.staklo.reduce((a, x) => a + x.m2, 0);
  const vrsteStakla = [...new Set(t.staklo.map((x) => x.vrsta))];

  return (
    <>
      <PageHeader
        naslov={`Trebovanje ${ponuda.broj}`}
        akcije={
          <>
            <NazadDugme href="/trebovanje" />
            <Link href={`/radni-nalozi/${ponuda.id}`} className="btn-secondary">
              <ClipboardList size={16} /> Radni nalog
            </Link>
            <Link href={`/krojne-liste/${ponuda.id}`} className="btn-secondary">
              <Scissors size={16} /> Krojna lista
            </Link>
            <StampajDugme label="Štampaj" />
          </>
        }
      />
      <div className="p-4 sm:p-6 lg:p-8 print:p-0">
        {ponuda.status === "NACRT" && (
          <p className="no-print mx-auto mb-4 max-w-6xl rounded-lg bg-accent-soft px-4 py-2 text-sm">Ponuda još nije potvrđena – trebovanje je informativno.</p>
        )}
        <article className="mx-auto max-w-6xl overflow-x-auto bg-white p-5 shadow-sm ring-1 ring-line sm:p-8 print:max-w-none print:p-0 print:shadow-none print:ring-0">
          <ZaglavljeFirme firma={firma}>
            <p className="text-xl font-extrabold uppercase tracking-tight text-brand">Trebovanje materijala</p>
            <p className="font-semibold tabular-nums">za nalog {ponuda.broj}</p>
            <p className="text-sm text-muted">Datum: {datum(new Date())}</p>
          </ZaglavljeFirme>

          <div className="mt-5 flex flex-wrap items-end justify-between gap-4 rounded-lg bg-background px-4 py-3 text-sm">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Kupac</p>
              <p className="font-semibold">{ponuda.klijent.naziv}</p>
              <p className="text-muted">Rok isporuke: <b className="text-foreground">{datum(ponuda.rokIsporuke)}</b> · {p.pozicije.length} pozicija, {p.pozicije.reduce((a, x) => a + x.s.kolicina, 0)} kom</p>
            </div>
            <div className="flex flex-wrap gap-6 text-right">
              <div><p className="text-2xl font-extrabold text-brand tabular-nums">{sipki}</p><p className="text-xs text-muted">celih šipki</p></div>
              <div><p className={`text-2xl font-extrabold tabular-nums ${nedostaje ? "text-danger" : "text-emerald-600"}`}>{nedostaje}</p><p className="text-xs text-muted">šipki nedostaje</p></div>
              <div><p className="text-2xl font-extrabold text-brand tabular-nums">{stakla}</p><p className="text-xs text-muted">stakala · {br(m2Stakla)} m²</p></div>
              <div><p className="text-2xl font-extrabold text-brand tabular-nums">{t.okov.length}</p><p className="text-xs text-muted">stavki okova</p></div>
            </div>
          </div>

          {t.greske.length > 0 && (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-danger">
              {t.greske.map((g) => <p key={g}>{g}</p>)}
            </div>
          )}

          <div className="mt-8 space-y-9">
            <Tabela
              naslov="Profili"
              ikona={Layers}
              kolone={KOLONE_PROFILA}
              desno={[2, 3, 4, 5, 7, 8, 9]}
              redovi={profili.map(redProfila)}
              napomena={
                <>
                  Broj šipki je iz optimizacije sečenja{t.proknjizeno ? " (proknjiženo – šipke su već skinute sa stanja)" : ""}: 10 mm odsecak na početku nove šipke i 4 mm po rezu. U mere rama i krila je
                  već uračunat dodatak za varenje 3 mm po kraju. Profil u boji magacin ne vodi – poručuje se ceo.
                </>
              }
            />

            <Tabela naslov="Čelično ojačanje" ikona={Shield} kolone={KOLONE_PROFILA} desno={[2, 3, 4, 5, 7, 8, 9]} redovi={celik.map(redProfila)} />

            <Tabela
              naslov="Staklo"
              ikona={SquareStack}
              kolone={["Vrsta stakla", "Širina (mm)", "Visina (mm)", "Kom", "m²", "Pozicije"]}
              desno={[1, 2, 3, 4]}
              redovi={t.staklo.map((g) => [g.vrsta, g.sirina, g.visina, <b key="k">{g.kom}</b>, br(g.m2), poz(g.pozicije)])}
              zbir={["Ukupno", "", "", stakla, br(m2Stakla), ""]}
              napomena={
                vrsteStakla.length > 1
                  ? vrsteStakla.map((v) => `${v}: ${t.staklo.filter((x) => x.vrsta === v).reduce((a, x) => a + x.kom, 0)} kom, ${br(t.staklo.filter((x) => x.vrsta === v).reduce((a, x) => a + x.m2, 0))} m²`).join(" · ")
                  : "Mere stakla su mere za porudžbinu (svetla mera umanjena za zazor)."
              }
            />

            <Tabela naslov="Paneli" ikona={Package} kolone={["Naziv", "Količina", "Jed.", "Pozicije"]} desno={[1]} redovi={t.paneli.map((x) => [x.naziv, <b key="k">{br(x.kolicina)}</b>, x.jedinica, poz(x.pozicije)])} />

            <Tabela
              naslov="Okov i sitni delovi"
              ikona={Wrench}
              kolone={["Naziv", "Količina", "Jed.", "Pozicije"]}
              desno={[1]}
              redovi={t.okov.map((x) => [x.naziv, <b key="k">{br(x.kolicina)}</b>, x.jedinica, poz(x.pozicije)])}
              napomena="Okov po metru (brava, leđna šina, nosač makaze) je zbir dužina krila; artikal se izdaje u prvoj većoj standardnoj dužini."
            />

            <Tabela
              naslov="Pribor uz profile"
              ikona={Package}
              kolone={["Naziv", "Količina", "Jed.", "Pozicije"]}
              desno={[1]}
              redovi={t.pribor.map((x) => [x.naziv, <b key="k">{br(x.kolicina)}</b>, x.jedinica, poz(x.pozicije)])}
              napomena="Pribor se zadaje po profilnom sistemu (stranica Profili): dihtunzi po metru, ugaonici, kapice i sl."
            />

            <Tabela
              naslov="Roletne, komarnici, daske i okapnice"
              ikona={PackagePlus}
              kolone={["Vrsta", "Materijal", "Mera (mm)", "Kom", "Količina", "Pozicije"]}
              desno={[2, 3, 4]}
              redovi={t.dodaci.map((d) => [
                d.vrsta,
                d.opis,
                d.visina ? `${d.sirina} × ${d.visina}` : d.sirina,
                d.kom,
                <b key="k">{`${br(d.kolicina)} ${d.jedinica}`}</b>,
                poz(d.pozicije),
              ])}
            />

            <Tabela
              naslov="Potrošni i montažni materijal (procena)"
              ikona={Package}
              kolone={["Naziv", "Količina", "Jed.", "Napomena", "Pozicije"]}
              desno={[1]}
              redovi={t.potrosni.map((x) => [x.naziv, <b key="k">{br(x.kolicina)}</b>, x.jedinica, x.napomena ?? "", poz(x.pozicije)])}
              napomena={`Procena: ${POTROSNI.podmetaciPoStaklu} podmetača po staklu (+2 za staklo preko 1,5 m²), vijak za čelik na svakih ${POTROSNI.vijakCelikaNaMm / 10} cm, anker na svakih ${POTROSNI.ankerNaMm / 10} cm obima rama, PUR pena ${POTROSNI.penaMetaraPoDozi} m spoja po dozi, silikon ${POTROSNI.silikonMetaraPoTubi} m po tubi (spolja i iznutra).`}
            />
          </div>

          <div className="mt-14 grid grid-cols-3 gap-10 text-center text-xs text-muted">
            <div className="border-t border-line pt-2">Trebovao (proizvodnja)</div>
            <div className="border-t border-line pt-2">Izdao (magacin)</div>
            <div className="border-t border-line pt-2">Primio</div>
          </div>
        </article>
      </div>
    </>
  );
}
