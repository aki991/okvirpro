import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ucitajKontekst } from "@/lib/kontekst";
import { opisStavke } from "@/lib/proracun";
import { izBaze } from "@/lib/stavka";
import { datum } from "@/lib/format";
import { iznosSlovima } from "@/lib/slovima";
import { PageHeader } from "@/components/PageHeader";
import { StampajDugme } from "@/components/StampajDugme";
import { NazadDugme } from "@/components/NazadDugme";
import { ZaglavljeFirme } from "@/components/ZaglavljeFirme";
import { RacunForma } from "./RacunForma";

export const dynamic = "force-dynamic";

const din = (n: number) => n.toLocaleString("sr-RS", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const r2 = (n: number) => Math.round(n * 100) / 100;

export default async function Racun({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await db.ponuda.findUnique({ where: { id: Number(id) }, include: { klijent: true, stavke: { orderBy: { redosled: "asc" } } } });
  if (!p) notFound();
  const [firma, k] = await Promise.all([db.firma.findUniqueOrThrow({ where: { id: 1 } }), ucitajKontekst()]);

  const kurs = firma.kursEur;
  const izdat = p.racunDatum ?? new Date();
  const valuta = new Date(izdat);
  valuta.setDate(valuta.getDate() + p.racunValutaDana);
  const pdvStopa = p.racunBezPdv ? 0 : firma.pdvStopa;

  // stavke u RSD; montaža je posebna stavka (usluga) ako nije uračunata u cene
  const redovi = p.stavke.map((s) => {
    const { naslov, detalji } = opisStavke(izBaze(s), k);
    const cena = r2(s.cenaKom * kurs);
    return { naslov, detalji, kol: s.kolicina, jm: "kom", cena, osnovica: r2(cena * s.kolicina) };
  });
  if (p.montazaUCenu) {
    // montaža je već u ukupnoBezPdv – dodajemo je kao posebnu stavku da bi zbir odgovarao ponudi
    const uStavkama = p.stavke.reduce((a, s) => a + s.cenaKom * s.kolicina, 0);
    const montaza = r2((p.ukupnoBezPdv - uStavkama) * kurs);
    if (montaza > 0) redovi.push({ naslov: "Usluga montaže", detalji: "", kol: 1, jm: "usl.", cena: montaza, osnovica: montaza });
  }
  const osnovica = r2(redovi.reduce((a, r) => a + r.osnovica, 0));
  const pdv = r2((osnovica * pdvStopa) / 100);
  const montazaPosebno = !p.montazaUCenu && !p.bezMontaze && p.montaza > 0 ? r2(p.montaza * kurs) : 0;
  const ukupno = r2(osnovica + pdv + montazaPosebno);

  return (
    <>
      <PageHeader
        naslov={`Račun ${p.broj}/${izdat.getFullYear()}`}
        akcije={
          <>
            <NazadDugme href="/racuni" />
            <StampajDugme label="Štampaj" />
          </>
        }
      />
      <div className="p-4 sm:p-6 lg:p-8 print:p-0">
        <RacunForma id={p.id} bezPdv={p.racunBezPdv} datum={izdat.toISOString().slice(0, 10)} valutaDana={p.racunValutaDana} />

        <article className="mx-auto overflow-x-auto max-w-4xl bg-white p-5 sm:p-10 text-sm shadow-sm ring-1 ring-line print:max-w-none print:p-0 print:shadow-none print:ring-0">
          <ZaglavljeFirme firma={firma}>
            <p className="text-2xl font-extrabold tracking-tight text-brand">RAČUN</p>
            <p className="font-mono font-semibold">br. {p.broj}/{izdat.getFullYear()}</p>
          </ZaglavljeFirme>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
              <div className="rounded-lg bg-background p-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Prodavac / isporučilac</p>
                <p className="mt-1 font-bold">{firma.naziv}</p>
                <p>{[firma.adresa, firma.mesto].filter(Boolean).join(", ")}</p>
                {firma.pib && <p>PIB: {firma.pib}</p>}
                {firma.maticniBroj && <p>MB: {firma.maticniBroj}</p>}
                {firma.tekuciRacun && <p>Tekući račun: {firma.tekuciRacun}</p>}
              </div>
              <div className="rounded-lg bg-background p-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Kupac / primalac</p>
                <p className="mt-1 font-bold">{p.klijent.naziv}</p>
                <p>{p.klijent.adresa}</p>
                {p.klijent.pib && <p>PIB: {p.klijent.pib}</p>}
                {p.klijent.maticniBroj && <p>MB: {p.klijent.maticniBroj}</p>}
                {p.klijent.telefon && <p>Telefon: {p.klijent.telefon}</p>}
              </div>
            </div>
            <dl className="space-y-1 text-right text-xs">
              {firma.mesto && <><dt className="text-muted">Mesto izdavanja</dt><dd className="font-semibold">{firma.mesto}</dd></>}
              <dt className="text-muted">Datum izdavanja</dt><dd className="font-semibold">{datum(izdat)}</dd>
              <dt className="text-muted">Datum prometa dobara</dt><dd className="font-semibold">{datum(p.rokIsporuke ?? izdat)}</dd>
              <dt className="text-muted">Rok plaćanja (valuta)</dt><dd className="font-semibold">{datum(valuta)}</dd>
            </dl>
          </div>

          <table className="mt-8 w-full">
            <thead>
              <tr className="border-y border-line bg-background text-left text-[11px] uppercase tracking-wide text-muted">
                <th className="px-2 py-2 font-semibold">#</th>
                <th className="px-2 py-2 font-semibold">Naziv proizvoda / opis</th>
                <th className="px-2 py-2 text-center font-semibold">J.m.</th>
                <th className="px-2 py-2 text-center font-semibold">Kol.</th>
                <th className="px-2 py-2 text-right font-semibold">Cena (RSD)</th>
                <th className="px-2 py-2 text-right font-semibold">Osnovica (RSD)</th>
              </tr>
            </thead>
            <tbody>
              {redovi.map((r, i) => (
                <tr key={i} className="border-b border-line/60 align-top">
                  <td className="px-2 py-2">{i + 1}.</td>
                  <td className="px-2 py-2">
                    <p className="font-semibold uppercase">{r.naslov}</p>
                    {r.detalji && <p className="text-xs text-muted">{r.detalji}</p>}
                  </td>
                  <td className="px-2 py-2 text-center">{r.jm}</td>
                  <td className="px-2 py-2 text-center">{r.kol}</td>
                  <td className="whitespace-nowrap px-2 py-2 text-right">{din(r.cena)}</td>
                  <td className="whitespace-nowrap px-2 py-2 text-right font-semibold">{din(r.osnovica)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 flex justify-end">
            <dl className="w-96 space-y-1.5">
              <div className="flex justify-between"><dt className="text-muted">Ukupna osnovica (RSD):</dt><dd>{din(osnovica)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">PDV ({pdvStopa}%):</dt><dd>{din(pdv)}</dd></div>
              {montazaPosebno > 0 && (
                <div className="flex justify-between"><dt className="text-muted">Montaža (RSD):</dt><dd>{din(montazaPosebno)}</dd></div>
              )}
              <div className="flex justify-between border-t-2 border-brand pt-2 text-base font-extrabold text-brand">
                <dt>UKUPNO ZA UPLATU:</dt><dd>{din(ukupno)} RSD</dd>
              </div>
              <p className="text-right text-xs italic text-muted">Slovima: {iznosSlovima(ukupno, "RSD")}</p>
            </dl>
          </div>

          <div className="mt-8 break-inside-avoid rounded-lg bg-background p-4 text-xs leading-relaxed">
            <p className="mb-1 font-bold uppercase tracking-wide">Napomene o računu</p>
            <ul className="list-disc space-y-0.5 pl-4">
              {p.racunBezPdv ? (
                <li>Promet je oslobođen PDV-a u skladu sa članom 33. Zakona o PDV-u.</li>
              ) : (
                <li>PDV je obračunat po stopi od {pdvStopa}% za promet dobara.</li>
              )}
              <li>Obračun je izvršen po kursu 1 EUR = {kurs} RSD.</li>
              {p.avans ? <li>Primljen avans po ugovoru {p.broj}/AV: {din(p.avans * kurs)} RSD ({p.avans} €).</li> : null}
              <li>Reklamacije se uvažavaju u roku od 3 dana od dana prijema robe.</li>
              <li>Prilikom uplate kao poziv na broj navesti: {p.broj}.</li>
            </ul>
            {firma.garancija && (
              <>
                <p className="mb-1 mt-3 font-bold uppercase tracking-wide">Garancija</p>
                <p className="text-muted">{firma.garancija}</p>
              </>
            )}
          </div>

          <div className="mt-14 grid grid-cols-2 gap-16 text-center text-xs">
            <div className="border-t border-foreground/40 pt-2 font-semibold">RAČUN IZDAO (M.P.)<p className="font-normal text-muted">{firma.zastupnik}</p></div>
            <div className="border-t border-foreground/40 pt-2 font-semibold">ROBU PRIMIO / KUPAC<p className="font-normal text-muted">{p.klijent.naziv}</p></div>
          </div>
        </article>
      </div>
    </>
  );
}
