import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { datum, eur, rsd } from "@/lib/format";
import { iznosSlovima } from "@/lib/slovima";
import { PageHeader } from "@/components/PageHeader";
import { StampajDugme } from "@/components/StampajDugme";
import { NazadDugme } from "@/components/NazadDugme";
import { ZaglavljeFirme } from "@/components/ZaglavljeFirme";
import { AvansForma } from "./AvansForma";

export const dynamic = "force-dynamic";

function Clan({ br, naslov, children }: { br: number; naslov: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid">
      <p className="mt-5 text-center font-bold">Član {br}.</p>
      <p className="mb-1 text-center text-xs font-semibold uppercase tracking-wide text-muted">{naslov}</p>
      <div className="space-y-1.5 text-justify">{children}</div>
    </section>
  );
}

export default async function UgovorOAvansu({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await db.ponuda.findUnique({ where: { id: Number(id) }, include: { klijent: true, stavke: { select: { kolicina: true } } } });
  if (!p) notFound();
  const firma = await db.firma.findUniqueOrThrow({ where: { id: 1 } });

  const ukupno = p.ukupnoZaNaplatu;
  const datumUgovora = p.avansDatum ?? new Date();
  const ostatak = ukupno - (p.avans ?? 0);
  const brojKomada = p.stavke.reduce((a, s) => a + s.kolicina, 0);

  return (
    <>
      <PageHeader
        naslov={`Ugovor o avansu ${p.broj}`}
        akcije={
          <>
            <NazadDugme href="/avansi" />
            <StampajDugme label="Štampaj" />
          </>
        }
      />
      <div className="p-4 sm:p-6 lg:p-8 print:p-0">
        <AvansForma id={p.id} avans={p.avans} datum={datumUgovora.toISOString().slice(0, 10)} ukupno={ukupno} />

        <article className="mx-auto overflow-x-auto max-w-4xl bg-white p-5 sm:p-12 text-sm leading-relaxed shadow-sm ring-1 ring-line print:max-w-none print:p-0 print:shadow-none print:ring-0">
          <ZaglavljeFirme firma={firma}>
            <p className="font-mono text-xs text-muted">Br. ugovora</p>
            <p className="font-mono font-bold">{p.broj}/AV</p>
            <p className="text-xs text-muted">Datum: {datum(datumUgovora)}</p>
          </ZaglavljeFirme>

          <h1 className="mt-8 text-center text-xl font-extrabold tracking-tight">UGOVOR O AVANSU (KAPARI)</h1>
          <p className="mt-1 text-center text-muted">
            zaključen {datum(datumUgovora)} godine{firma.mesto ? ` u mestu ${firma.mesto}` : ""}, između:
          </p>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div className="rounded-lg bg-background p-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Izvođač radova / prodavac</p>
              <p className="mt-1 font-bold">{firma.naziv}</p>
              <p>{[firma.adresa, firma.mesto].filter(Boolean).join(", ")}</p>
              {firma.pib && <p>PIB: {firma.pib}{firma.maticniBroj && ` · MB: ${firma.maticniBroj}`}</p>}
              {firma.tekuciRacun && <p>Tekući račun: {firma.tekuciRacun}</p>}
              {firma.zastupnik && <p>koga zastupa: {firma.zastupnik}</p>}
              <p className="mt-1 text-xs text-muted">(u daljem tekstu: Prodavac)</p>
            </div>
            <div className="rounded-lg bg-background p-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Naručilac / kupac</p>
              <p className="mt-1 font-bold">{p.klijent.naziv}</p>
              <p>{p.klijent.adresa}</p>
              {p.klijent.pib && <p>PIB: {p.klijent.pib}{p.klijent.maticniBroj && ` · MB: ${p.klijent.maticniBroj}`}</p>}
              {p.klijent.telefon && <p>Telefon: {p.klijent.telefon}</p>}
              <p className="mt-1 text-xs text-muted">(u daljem tekstu: Kupac)</p>
            </div>
          </div>

          {p.avans ? (
            <>
              <Clan br={1} naslov="Predmet ugovora">
                <p>
                  Predmet ovog ugovora je izrada{p.bezMontaze ? " i isporuka" : ", isporuka i montaža"} PVC/ALU stolarije ({brojKomada} kom) prema ponudi br.{" "}
                  <b>{p.broj}</b> od {datum(p.createdAt)}, koja čini sastavni deo ovog ugovora.
                </p>
              </Clan>
              <Clan br={2} naslov="Cena">
                <p>
                  Ukupna ugovorena vrednost iznosi <b>{eur(ukupno)}</b> ({iznosSlovima(ukupno, "EUR")}), sa uračunatim PDV-om
                  {p.montaza > 0 ? " i montažom" : ""}. Plaćanje se vrši u dinarskoj protivvrednosti po srednjem kursu NBS na dan uplate.
                </p>
              </Clan>
              <Clan br={3} naslov="Avans">
                <p>
                  Kupac se obavezuje da prilikom zaključenja ovog ugovora uplati avans (kaparu) u iznosu od <b>{eur(p.avans)}</b> (
                  {iznosSlovima(p.avans, "EUR")}), što po kursu {firma.kursEur} iznosi približno {rsd(p.avans * firma.kursEur)}.
                </p>
                <p>
                  Preostali iznos od <b>{eur(ostatak)}</b> Kupac plaća najkasnije na dan isporuke{p.bezMontaze ? "" : ", odnosno završetka montaže"}.
                </p>
              </Clan>
              <Clan br={4} naslov="Rok isporuke">
                <p>
                  Prodavac se obavezuje da robu izradi i isporuči najkasnije do <b>{datum(p.rokIsporuke)}</b>. Rok počinje da teče od dana uplate avansa. Rok se
                  produžava za vreme trajanja više sile ili kašnjenja Kupca sa obavezama iz ovog ugovora.
                </p>
              </Clan>
              <Clan br={5} naslov="Odustanak od ugovora">
                <p>
                  Ukoliko Kupac odustane od ugovora nakon uplate avansa, Prodavac zadržava primljeni avans na ime naknade troškova, s obzirom da se stolarija
                  izrađuje po meri. Ukoliko Prodavac ne ispuni ugovor svojom krivicom, dužan je da Kupcu vrati dvostruki iznos avansa, u skladu sa Zakonom o
                  obligacionim odnosima.
                </p>
              </Clan>
              <Clan br={6} naslov="Garancija">
                <p>{firma.garancija || "Garancija se daje u skladu sa uslovima navedenim u ponudi."}</p>
              </Clan>
              <Clan br={7} naslov="Završne odredbe">
                <p>
                  Na sve što nije regulisano ovim ugovorom primenjuju se odredbe Zakona o obligacionim odnosima. Eventualne sporove strane će rešavati sporazumno, a
                  u suprotnom nadležan je sud prema sedištu Prodavca. Ugovor je sačinjen u 2 (dva) istovetna primerka, od kojih svaka strana zadržava po jedan.
                </p>
              </Clan>
            </>
          ) : (
            <p className="no-print mt-10 rounded-lg border border-dashed border-line p-4 sm:p-6 lg:p-8 text-center text-muted">
              Unesi iznos avansa iznad da bi se generisao tekst ugovora.
            </p>
          )}

          <div className="mt-16 grid grid-cols-2 gap-16 text-center">
            <div>
              <div className="border-t border-foreground/40 pt-2 font-semibold">ZA PRODAVCA (M.P.)</div>
              <p className="text-xs text-muted">{firma.zastupnik || firma.naziv}</p>
            </div>
            <div>
              <div className="border-t border-foreground/40 pt-2 font-semibold">ZA KUPCA</div>
              <p className="text-xs text-muted">{p.klijent.naziv}</p>
            </div>
          </div>
        </article>
      </div>
    </>
  );
}
