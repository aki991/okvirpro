import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { datum } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { StampajDugme } from "@/components/StampajDugme";
import { NazadDugme } from "@/components/NazadDugme";
import { ZaglavljeFirme } from "@/components/ZaglavljeFirme";
import { ReklamacijaForma } from "./ReklamacijaForma";

export const dynamic = "force-dynamic";

export default async function Reklamacija({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await db.reklamacija.findUnique({ where: { id: Number(id) }, include: { ponuda: { include: { klijent: true } } } });
  if (!r) notFound();
  const firma = await db.firma.findUniqueOrThrow({ where: { id: 1 } });
  const k = r.ponuda.klijent;

  return (
    <>
      <PageHeader
        naslov={`Reklamacija ${r.broj}`}
        akcije={
          <>
            <NazadDugme href="/reklamacije" />
            <StampajDugme label="Štampaj zapisnik" />
          </>
        }
      />
      <div className="p-4 sm:p-6 lg:p-8 print:p-0">
        <ReklamacijaForma id={r.id} opis={r.opis} status={r.status} resenje={r.resenje} />

        <article className="mx-auto overflow-x-auto max-w-4xl bg-white p-5 sm:p-10 text-sm leading-relaxed shadow-sm ring-1 ring-line print:max-w-none print:p-0 print:shadow-none print:ring-0">
          <ZaglavljeFirme firma={firma}>
            <p className="text-xl font-extrabold tracking-tight text-brand">ZAPISNIK O REKLAMACIJI</p>
            <p className="font-mono font-semibold">br. {r.broj}</p>
            <p className="text-xs text-muted">Datum prijave: {datum(r.datum)}</p>
          </ZaglavljeFirme>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div className="rounded-lg bg-background p-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Podnosilac reklamacije</p>
              <p className="mt-1 font-bold">{k.naziv}</p>
              <p>{k.adresa}</p>
              <p>{[k.telefon, k.email].filter(Boolean).join(" · ")}</p>
            </div>
            <div className="rounded-lg bg-background p-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Osnov</p>
              <p className="mt-1">Ugovor / ponuda br. <b className="font-mono">{r.ponuda.broj}</b></p>
              <p>od {datum(r.ponuda.createdAt)}, isporuka {datum(r.ponuda.rokIsporuke)}</p>
              <p>Status: <b>{r.status === "RESENO" ? "Rešeno" : "U obradi"}</b></p>
            </div>
          </div>

          <section className="mt-6">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-muted">Opis reklamacije (izjava kupca)</p>
            <p className="min-h-20 whitespace-pre-wrap rounded-lg border border-line p-4">{r.opis}</p>
          </section>
          <section className="mt-5">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-muted">Nalaz i rešenje</p>
            <p className="min-h-24 whitespace-pre-wrap rounded-lg border border-line p-4">{r.resenje || " "}</p>
          </section>

          <p className="mt-6 text-xs text-muted">
            Prodavac će se o reklamaciji izjasniti u roku od 8 dana od prijema, a otkloniti nesaobraznost u roku od 15 dana, u skladu sa Zakonom o zaštiti
            potrošača. {firma.garancija}
          </p>

          <div className="mt-14 grid grid-cols-2 gap-16 text-center text-xs">
            <div className="border-t border-foreground/40 pt-2 font-semibold">ZA PRODAVCA (M.P.)<p className="font-normal text-muted">{firma.zastupnik || firma.naziv}</p></div>
            <div className="border-t border-foreground/40 pt-2 font-semibold">KUPAC<p className="font-normal text-muted">{k.naziv}</p></div>
          </div>
        </article>
      </div>
    </>
  );
}
