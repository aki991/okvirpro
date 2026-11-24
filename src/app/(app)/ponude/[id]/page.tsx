import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipboardList, FileSignature, Globe, PackageCheck, Pencil, Receipt, Scissors } from "lucide-react";
import { db } from "@/lib/db";
import { ucitajKontekst } from "@/lib/kontekst";
import { opisStavke, type StavkaUlaz, type Vrsta } from "@/lib/proracun";
import { StavkaCrtez } from "@/components/StavkaCrtez";
import { Prozor3DDugme } from "@/components/prozor3d/Prozor3DDugme";
import { parametri3D } from "@/lib/prozor-3d-parametri";
import { izBaze } from "@/lib/stavka";
import { datum, eur, rsd } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { StampajDugme } from "@/components/StampajDugme";
import { ZaglavljeFirme } from "@/components/ZaglavljeFirme";
import { StatusAkcije } from "./StatusAkcije";

export const dynamic = "force-dynamic";

export default async function PrikazPonude({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ponuda = await db.ponuda.findUnique({
    where: { id: Number(id) },
    include: { klijent: true, stavke: { orderBy: { redosled: "asc" } } },
  });
  if (!ponuda) notFound();
  const [firma, k] = await Promise.all([db.firma.findUniqueOrThrow({ where: { id: 1 } }), ucitajKontekst()]);
  // upit sa sajta je pregledan čim ga vlasnik otvori
  if (!ponuda.pregledano) await db.ponuda.update({ where: { id: ponuda.id }, data: { pregledano: true } });

  const potvrdjena = ponuda.status !== "NACRT";
  const uslovi = firma.uslovi.split("\n").map((x) => x.trim()).filter(Boolean);
  const montazaUCenu = ponuda.montazaUCenu;

  return (
    <>
      <PageHeader
        naslov={`Ponuda ${ponuda.broj}`}
        akcije={
          <>
            <Link href={`/ponude/${ponuda.id}/izmeni`} className="btn-secondary">
              <Pencil size={16} /> Izmeni
            </Link>
            <StatusAkcije id={ponuda.id} status={ponuda.status} />
            <StampajDugme />
          </>
        }
      />

      <div className="p-4 sm:p-6 lg:p-8 print:p-0">
        {ponuda.izvor === "SAJT" && (
          <div className="no-print mx-auto mb-6 flex max-w-4xl gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm">
            <Globe size={18} className="mt-0.5 shrink-0 text-sky-700" />
            <div>
              <p className="font-semibold text-sky-900">Upit sa sajta (javni kalkulator) – {datum(ponuda.createdAt)}</p>
              <p className="text-sky-900/80">
                Kupac je sam uneo mere i modele. Proveri mere i opcije (podštok, proširenja, okov) pa klikni „Izmeni“ pre potvrde.
              </p>
              {ponuda.napomenaKupca && <p className="mt-2 whitespace-pre-wrap rounded-lg bg-white/70 p-2 italic">„{ponuda.napomenaKupca}“</p>}
            </div>
          </div>
        )}
        {potvrdjena && (
          <div className="no-print mx-auto mb-6 flex max-w-4xl flex-wrap gap-2">
            {[
              { href: `/radni-nalozi/${ponuda.id}`, n: "Radni nalog", i: ClipboardList },
              { href: `/krojne-liste/${ponuda.id}`, n: "Krojna lista", i: Scissors },
              { href: `/trebovanje/${ponuda.id}`, n: "Trebovanje", i: PackageCheck },
              { href: `/avansi/${ponuda.id}`, n: "Ugovor o avansu", i: FileSignature },
              { href: `/racuni/${ponuda.id}`, n: "Račun", i: Receipt },
            ].map((d) => (
              <Link key={d.href} href={d.href} className="btn-secondary !py-1.5">
                <d.i size={15} /> {d.n}
              </Link>
            ))}
          </div>
        )}

        <article className="mx-auto overflow-x-auto max-w-4xl bg-white p-5 sm:p-10 shadow-sm ring-1 ring-line print:max-w-none print:p-0 print:shadow-none print:ring-0">
          <ZaglavljeFirme firma={firma}>
            <p className="text-2xl font-extrabold tracking-tight text-brand">PONUDA</p>
            <p className="font-mono font-semibold">br. {ponuda.broj}</p>
            <p className="text-sm text-muted">Datum: {datum(ponuda.createdAt)}</p>
            <div className="no-print mt-2"><StatusBadge status={ponuda.status} /></div>
          </ZaglavljeFirme>

          <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
            <div className="min-w-64 rounded-lg bg-background p-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Kupac</p>
              <p className="mt-1 text-lg font-bold">{ponuda.klijent.naziv}</p>
              {ponuda.klijent.pib && <p className="text-sm">PIB: {ponuda.klijent.pib}</p>}
              <p className="text-sm">{ponuda.klijent.adresa}</p>
              <p className="text-sm">{ponuda.klijent.telefon}</p>
              <p className="text-sm">{ponuda.klijent.email}</p>
            </div>
            <div className="text-right text-sm">
              {firma.mesto && <p><span className="text-muted">Mesto izdavanja:</span> <b>{firma.mesto}</b></p>}
              <p><span className="text-muted">Rok isporuke:</span> <b>{datum(ponuda.rokIsporuke)}</b></p>
            </div>
          </div>

          <table className="mt-8 w-full text-sm">
            <thead>
              <tr className="border-y border-line bg-background text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-2 py-2 font-semibold">#</th>
                <th className="px-2 py-2 text-left font-semibold">Opis stavke</th>
                <th className="px-2 py-2 font-semibold">Kol.</th>
                <th className="px-2 py-2 font-semibold">Cena/kom</th>
                <th className="px-2 py-2 font-semibold">Ukupno</th>
              </tr>
            </thead>
            <tbody>
              {ponuda.stavke.map((s, i) => {
                const ulaz = { ...s, vrsta: s.vrsta as Vrsta } as unknown as StavkaUlaz;
                const { naslov, detalji } = opisStavke(ulaz, k);
                return (
                  <tr key={s.id} className="break-inside-avoid border-b border-line/70 align-top">
                    <td className="px-2 py-3 font-semibold">{i + 1}.</td>
                    <td className="px-2 py-3 text-left">
                      <div className="flex flex-col gap-4 sm:flex-row">
                        <div className="w-full shrink-0 sm:w-48">
                          <StavkaCrtez s={s} k={k} className="h-auto max-h-56 w-full" />
                          {(() => {
                            const par = parametri3D(izBaze(s), k);
                            return par ? (
                              <div className="no-print mt-2 flex justify-center">
                                <Prozor3DDugme par={par} naslov={`${i + 1}. ${naslov}`} />
                              </div>
                            ) : null;
                          })()}
                        </div>
                        <div>
                          <p className="font-bold">{naslov}</p>
                          <p className="text-xs leading-relaxed text-muted">{detalji}</p>
                          {s.napomena && <p className="mt-1 text-xs italic">Napomena: {s.napomena}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3 tabular-nums">{s.kolicina}</td>
                    <td className="whitespace-nowrap px-2 py-3 tabular-nums">{eur(s.cenaKom)}</td>
                    <td className="whitespace-nowrap px-2 py-3 font-semibold tabular-nums">{eur(s.cenaKom * s.kolicina)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="mt-6 flex justify-end">
            <dl className="w-80 space-y-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Ukupno bez PDV-a{montazaUCenu && " (sa montažom)"}:</dt><dd>{eur(ponuda.ukupnoBezPdv)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">PDV ({ponuda.bezPdv ? 0 : firma.pdvStopa}%):</dt><dd>{eur(ponuda.pdv)}</dd></div>
              <div className="flex justify-between border-t border-line pt-1.5 font-bold text-brand">
                <dt>UKUPNO ZA UPLATU (SA PDV):</dt><dd className="text-lg">{eur(ponuda.ukupnoBezPdv + ponuda.pdv)}</dd>
              </div>
              {!montazaUCenu && !ponuda.bezMontaze && (
                <>
                  <div className="flex justify-between pt-1"><dt className="text-muted">Montaža:</dt><dd>{eur(ponuda.montaza)}</dd></div>
                  <div className="flex justify-between border-t border-line pt-1.5 font-bold">
                    <dt>UKUPNO ZA NAPLATU (SA MONTAŽOM):</dt><dd>{eur(ponuda.ukupnoZaNaplatu)}</dd>
                  </div>
                </>
              )}
              <div className="pt-2 text-right text-xs text-muted">
                Protivvrednost u dinarima (kurs {firma.kursEur}):
                <p className="text-sm font-bold text-foreground">{rsd(ponuda.ukupnoZaNaplatu * firma.kursEur)}</p>
              </div>
            </dl>
          </div>

          {(firma.garancija || uslovi.length > 0) && (
            <div className="mt-10 break-inside-avoid border-t border-line pt-5 text-xs leading-relaxed">
              <p className="mb-1 font-bold uppercase tracking-wide">Garancija i uslovi</p>
              {firma.garancija && <p className="text-muted">{firma.garancija}</p>}
              {uslovi.length > 0 && (
                <ul className="mt-2 list-disc pl-4">
                  {uslovi.map((u) => <li key={u}>{u}</li>)}
                </ul>
              )}
            </div>
          )}

          <div className="mt-12 grid grid-cols-2 gap-16 text-center text-xs text-muted">
            <div className="border-t border-line pt-2">Za {firma.naziv || "prodavca"}</div>
            <div className="border-t border-line pt-2">Kupac</div>
          </div>
        </article>
      </div>
    </>
  );
}
