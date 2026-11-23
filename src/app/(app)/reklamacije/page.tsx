import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleDot } from "lucide-react";
import { db } from "@/lib/db";
import { datum } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { NovaReklamacija } from "./NovaReklamacija";

export const dynamic = "force-dynamic";

export default async function Reklamacije() {
  const [reklamacije, ponude] = await Promise.all([
    db.reklamacija.findMany({ orderBy: { datum: "desc" }, include: { ponuda: { include: { klijent: true } } } }),
    db.ponuda.findMany({
      where: { status: { in: ["POTVRDJENO", "REALIZOVANO"] } },
      orderBy: { createdAt: "desc" },
      select: { id: true, broj: true, klijent: { select: { naziv: true } } },
    }),
  ]);
  const otvorene = reklamacije.filter((r) => r.status === "OTVORENO").length;

  return (
    <>
      <PageHeader
        naslov="Reklamacije"
        opis={`Zapisnici o reklamacijama · ${otvorene} otvorenih`}
        akcije={<NovaReklamacija ponude={ponude.map((p) => ({ id: p.id, naziv: `${p.broj} – ${p.klijent.naziv}` }))} />}
      />
      <div className="p-4 sm:p-6 lg:p-8">
        {reklamacije.length === 0 ? (
          <div className="card px-6 py-16 text-center text-sm text-muted">Nema evidentiranih reklamacija.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {reklamacije.map((r) => {
              const reseno = r.status === "RESENO";
              return (
                <Link key={r.id} href={`/reklamacije/${r.id}`} className="card group flex flex-col p-5 transition hover:border-brand">
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        reseno ? "bg-emerald-50 text-emerald-700" : "bg-accent-soft text-accent"
                      }`}
                    >
                      {reseno ? <CheckCircle2 size={12} /> : <CircleDot size={12} />}
                      {reseno ? "Rešeno" : "Otvoreno"}
                    </span>
                    <span className="text-xs text-muted">{datum(r.datum)}</span>
                  </div>
                  <p className="mt-3 font-mono text-sm font-bold">Zapisnik br. {r.broj}</p>
                  <p className="font-semibold">{r.ponuda.klijent.naziv}</p>
                  <p className="text-xs text-muted">Ugovor: {r.ponuda.broj}</p>
                  <p className="mt-3 line-clamp-3 flex-1 text-sm italic text-muted">„{r.opis}“</p>
                  <span className="mt-4 flex items-center gap-1 text-sm font-semibold text-brand">
                    Detalji i zapisnik <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
