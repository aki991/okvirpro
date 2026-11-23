import Link from "next/link";
import { Coins, PiggyBank, Wallet } from "lucide-react";
import { db } from "@/lib/db";
import { datum, eur } from "@/lib/format";
import { poMesecima, prihodNeto, zarada } from "@/lib/finansije";
import { PageHeader } from "@/components/PageHeader";
import { MesecniGrafikon } from "@/components/MesecniGrafikon";
import { RealizacijaDugme } from "./RealizacijaDugme";

export const dynamic = "force-dynamic";

const MESECI = ["januar", "februar", "mart", "april", "maj", "jun", "jul", "avgust", "septembar", "oktobar", "novembar", "decembar"];

export default async function Finansije() {
  const ponude = await db.ponuda.findMany({
    where: { status: { in: ["POTVRDJENO", "REALIZOVANO"] } },
    orderBy: [{ rokIsporuke: "desc" }, { createdAt: "desc" }],
    include: { klijent: { select: { naziv: true } } },
  });

  const trosak = ponude.reduce((a, p) => a + p.trosakMaterijala, 0);
  const prihodSve = ponude.reduce((a, p) => a + p.ukupnoZaNaplatu, 0);
  const neto = ponude.reduce((a, p) => a + prihodNeto(p), 0);
  const cista = ponude.reduce((a, p) => a + zarada(p), 0);
  const marza = neto ? (cista / neto) * 100 : 0;

  // čekanje na naplatu u tekućem mesecu
  const sad = new Date();
  const danas = new Date(sad.getFullYear(), sad.getMonth(), sad.getDate(), 23, 59, 59);
  const krajMeseca = new Date(sad.getFullYear(), sad.getMonth() + 1, 0, 23, 59, 59);
  const cekaju = ponude.filter((p) => p.status === "POTVRDJENO");
  const zaNaplatu = (p: (typeof ponude)[number]) => p.ukupnoZaNaplatu - (p.avans ?? 0);
  const dospele = cekaju.filter((p) => p.rokIsporuke && p.rokIsporuke <= danas).reduce((a, p) => a + zaNaplatu(p), 0);
  const buduce = cekaju.filter((p) => p.rokIsporuke && p.rokIsporuke > danas && p.rokIsporuke <= krajMeseca).reduce((a, p) => a + zaNaplatu(p), 0);
  const ukupnoNenaplaceno = cekaju.reduce((a, p) => a + zaNaplatu(p), 0);

  const kartice = [
    { n: "Troškovi materijala", v: eur(trosak), o: "Nabavna vrednost potvrđenih poslova", i: Coins },
    { n: "Ukupan prihod", v: eur(prihodSve), o: "Sa PDV-om i montažom", i: Wallet },
    { n: "Čista zarada", v: eur(cista), o: `${marza.toFixed(1)} % prosečna marža (na prihod bez PDV-a)`, i: PiggyBank },
  ];

  return (
    <>
      <PageHeader naslov="Finansijski prikaz" opis="Potvrđeni i realizovani poslovi" />
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="grid gap-4 md:grid-cols-3">
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
            <h2 className="font-bold">Analitika po mesecima</h2>
            <p className="mb-4 text-sm text-muted">Prihod bez PDV-a i neto zarada, poslednjih 6 meseci (po datumu ponude)</p>
            <MesecniGrafikon podaci={poMesecima(ponude, 6)} />
          </section>

          <section className="card p-6">
            <h2 className="font-bold">Čekanje na naplatu</h2>
            <p className="mb-4 text-sm text-muted">Status za {MESECI[sad.getMonth()]} {sad.getFullYear()}. (umanjeno za avanse)</p>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Dospele isporuke</dt><dd className="font-semibold text-danger">{eur(dospele)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Buduće isporuke ovog meseca</dt><dd className="font-semibold">{eur(buduce)}</dd></div>
              <div className="flex justify-between border-t border-line pt-3 font-bold"><dt>Očekivano ovog meseca</dt><dd className="text-brand">{eur(dospele + buduce)}</dd></div>
              <div className="flex justify-between text-xs text-muted"><dt>Ukupno nenaplaćeno (svi rokovi)</dt><dd>{eur(ukupnoNenaplaceno)}</dd></div>
            </dl>
          </section>
        </div>

        <section>
          <h2 className="mb-3 font-bold">Finansijski board ponuda</h2>
          {ponude.length === 0 ? (
            <div className="card px-6 py-12 text-center text-sm text-muted">Nema potvrđenih ponuda.</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {ponude.map((p) => {
                const z = zarada(p);
                const pn = prihodNeto(p);
                const udeoTroska = pn ? Math.min(100, Math.max(0, (p.trosakMaterijala / pn) * 100)) : 0;
                const kasni = p.status === "POTVRDJENO" && p.rokIsporuke && p.rokIsporuke < sad;
                return (
                  <div key={p.id} className="card p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link href={`/ponude/${p.id}`} className="font-mono text-sm font-bold text-brand hover:underline">{p.broj}</Link>
                        <p className="font-semibold">{p.klijent.naziv}</p>
                      </div>
                      <RealizacijaDugme id={p.id} status={p.status} />
                    </div>
                    <p className="mt-3 text-2xl font-extrabold">{eur(p.ukupnoZaNaplatu)}</p>
                    <p className="text-xs text-muted">Ukupna vrednost</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div><p className="text-xs text-muted">Trošak mat.</p><p className="font-semibold">{eur(p.trosakMaterijala)}</p></div>
                      <div><p className="text-xs text-muted">Neto profit</p><p className="font-semibold">{eur(z)}</p></div>
                    </div>
                    <div className="mt-3 flex h-2 gap-0.5 overflow-hidden rounded-full">
                      <div style={{ width: `${udeoTroska}%`, background: "#8b8f8a" }} className="rounded-l-full" />
                      <div style={{ width: `${100 - udeoTroska}%`, background: "#b8690a" }} className="rounded-r-full" />
                    </div>
                    <div className="mt-1 flex justify-between text-[11px] text-muted">
                      <span>Trošak {udeoTroska.toFixed(0)}%</span>
                      <span>Zarada {(100 - udeoTroska).toFixed(0)}%</span>
                    </div>
                    <p className={`mt-3 text-xs ${kasni ? "font-semibold text-danger" : "text-muted"}`}>
                      Rok: {datum(p.rokIsporuke)}
                      {kasni && " · rok prošao"}
                      {p.avans ? ` · avans ${eur(p.avans)}` : ""}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
