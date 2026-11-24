import Link from "next/link";
import { notFound } from "next/navigation";
import { Package, PackageCheck, Scissors, Shield, SquareStack, StickyNote } from "lucide-react";
import { ucitajProizvodnju } from "@/lib/proizvodnja";
import { opisStavke, VRSTE } from "@/lib/proracun";
import { izBaze, profilnaVrsta } from "@/lib/stavka";
import { PODRAZUMEVANI_MODEL } from "@/lib/modeli-katalog";
import { datum } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { StavkaCrtez } from "@/components/StavkaCrtez";
import { DODACI, mereOpcija, ugaoOznaka, visinaRoletne } from "@/lib/proracun";
import { StampajDugme } from "@/components/StampajDugme";
import { NazadDugme } from "@/components/NazadDugme";

export const dynamic = "force-dynamic";

function Tabela({ naslov, ikona: Ikona, redovi, kolone }: { naslov: string; ikona: React.ElementType; redovi: React.ReactNode[][]; kolone: string[] }) {
  if (redovi.length === 0) return null;
  return (
    <div className="break-inside-avoid">
      <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-brand">
        <Ikona size={13} /> {naslov}
      </p>
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-line text-left text-[10px] uppercase tracking-wide text-muted">
            {kolone.map((k, i) => (
              <th key={k} className={`py-1 font-semibold ${i === 0 ? "text-left" : ""}`}>{k}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {redovi.map((r, i) => (
            <tr key={i} className="border-b border-line/50 last:border-0">
              {r.map((c, j) => (
                <td key={j} className={`py-1 ${j > 0 ? "font-semibold tabular-nums" : "text-left"}`}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function RadniNalog({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await ucitajProizvodnju(Number(id));
  if (!p) notFound();
  const { ponuda, k, pozicije } = p;

  return (
    <>
      <PageHeader
        naslov={`Radni nalog ${ponuda.broj}`}
        opis={`${pozicije.length} pozicija · rok ${datum(ponuda.rokIsporuke)}`}
        akcije={
          <>
            <NazadDugme href="/radni-nalozi" />
            <Link href={`/trebovanje/${ponuda.id}`} className="btn-secondary">
              <PackageCheck size={16} /> Trebovanje
            </Link>
            <StampajDugme label="Štampaj nalog" />
          </>
        }
      />
      <div className="space-y-6 p-4 sm:p-6 lg:p-8 print:space-y-0 print:p-0">
        {ponuda.status === "NACRT" && (
          <p className="no-print rounded-lg bg-accent-soft px-4 py-2 text-sm">Ponuda još nije potvrđena – nalog je informativan.</p>
        )}
        {pozicije.map(({ s, poz, r }) => {
          const ulaz = izBaze(s);
          const profilna = profilnaVrsta(s.vrsta);
          const model =
            k.modeli.find((m) => m.sifra === s.modelSifra) ??
            (profilna ? k.modeli.find((m) => m.sifra === PODRAZUMEVANI_MODEL[s.vrsta === "VRATA" ? "VRATA" : "PROZOR"]) : undefined);
          const mo = mereOpcija(s, k.sistemi.find((x) => x.id === s.sistemId));
          const bojaNaziv = profilna && s.boja && s.boja !== "BELA" ? k.boje.find((b) => b.sifra === s.boja)?.naziv ?? s.boja : null;
          const opcije = [
            bojaNaziv && `BOJA: ${bojaNaziv.toUpperCase()}`,
            s.podstok && `PODŠTOK ${mo.podstok} mm`,
            s.prosirenjeL && `PROŠIRENJE L ${mo.prosirenjeL} mm`,
            s.prosirenjeD && `PROŠIRENJE D ${mo.prosirenjeD} mm`,
            s.spojL && "SPOJ LEVO",
            s.spojD && "SPOJ DESNO",
            ...DODACI.map((d) => s[d.polje] && d.naziv.toUpperCase()),
          ].filter(Boolean) as string[];
          const vrsta = VRSTE.find((v) => v.k === s.vrsta)?.n ?? s.vrsta;

          return (
            <article
              key={s.id}
              className="mx-auto overflow-x-auto max-w-5xl break-after-page bg-white p-4 sm:p-6 lg:p-8 shadow-sm ring-1 ring-line print:max-w-none print:p-6 print:shadow-none print:ring-0"
            >
              <header className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-brand pb-4">
                <div>
                  <p className="flex items-center gap-3 text-2xl font-extrabold tracking-tight text-brand">
                    RADNI NALOG
                    <span className="rounded-full border-2 border-brand px-3 py-0.5 text-base">POZ {poz}</span>
                  </p>
                  <p className="mt-1 text-sm">
                    Nalog: <b className="font-mono">{ponuda.broj}</b>
                    {s.sistem && <> · Sistem: <b>{s.sistem.tip}</b></>}
                    {" "}· Rok: <b>{datum(ponuda.rokIsporuke)}</b>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Kupac</p>
                  <p className="text-lg font-bold">{ponuda.klijent.naziv}</p>
                  <p className="text-xs text-muted">{ponuda.klijent.adresa}</p>
                </div>
              </header>

              <div className="mt-5 flex flex-col gap-6 sm:flex-row">
                <div className="w-full shrink-0 rounded-lg border border-line p-2 sm:w-72">
                  <StavkaCrtez s={s} k={k} className="h-auto max-h-80 w-full" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xl font-extrabold uppercase">{vrsta}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold">
                        {s.sistem && <span className="rounded bg-background px-2 py-1">PROFIL: {s.sistem.naziv}</span>}
                        {profilna && s.staklo && <span className="rounded bg-background px-2 py-1">STAKLO: {s.staklo}</span>}
                        {!profilna && s.materijal && <span className="rounded bg-background px-2 py-1">{s.materijal}</span>}
                        {model && <span className="rounded bg-background px-2 py-1">MODEL: {model.sifra}</span>}
                        {opcije.map((o) => (
                          <span key={o} className="rounded bg-accent-soft px-2 py-1 text-accent">{o}</span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-extrabold text-brand">{s.kolicina} KOM</p>
                      <p className="font-mono text-lg">
                        {s.sirina} × {s.visina} mm
                      </p>
                    </div>
                  </div>
                  {s.napomena && (
                    <p className="mt-3 flex items-center gap-2 rounded-lg border border-accent/40 bg-accent-soft px-3 py-2 text-sm">
                      <StickyNote size={15} className="text-accent" /> <b>Napomena:</b> {s.napomena}
                    </p>
                  )}
                  {!profilna && <p className="mt-3 text-sm text-muted">{opisStavke(ulaz, k).detalji}</p>}
                </div>
              </div>

              {profilna && (
                <div className="mt-6 grid gap-6 md:grid-cols-3 print:grid-cols-3">
                  <Tabela
                    naslov="Sečenje profila (mm)"
                    ikona={Scissors}
                    kolone={["Element", "Mera", "Ugao", "Kom"]}
                    redovi={r.rezovi.map((x) => [
                      x.element,
                      x.mera,
                      <span key="u" className={`whitespace-nowrap text-[11px] ${x.ugao === "45" ? "text-accent" : "text-muted"}`}>{ugaoOznaka(x.ugao)}</span>,
                      x.kom,
                    ])}
                  />
                  <div className="space-y-5">
                    <Tabela
                      naslov="Čelično ojačanje"
                      ikona={Shield}
                      kolone={["Element", "Mera", "Ugao", "Kom"]}
                      redovi={r.celik.map((x) => [x.element, x.mera, <span key="u" className="whitespace-nowrap text-[11px] text-muted">{ugaoOznaka(x.ugao)}</span>, x.kom])}
                    />
                    <Tabela
                      naslov="Staklo i ispuna"
                      ikona={SquareStack}
                      kolone={["Polje", "Mera", "Kom"]}
                      redovi={r.staklo.map((g) => [g.opis.endsWith("(panel)") ? `${g.opis} – ${s.panelSifra}` : g.opis, `${g.sirina} × ${g.visina}`, g.kom])}
                    />
                  </div>
                  <Tabela
                    naslov="Okov i dodaci"
                    ikona={Package}
                    kolone={["Naziv", "Kol."]}
                    redovi={[
                      ...r.okov.map((o) => [o.naziv, `${o.kolicina} ${o.jedinica}`]),
                      ...(r.pribor ?? []).map((o) => [o.naziv, `${o.kolicina} ${o.jedinica}`]),
                      ...r.komadi.map((x) => [x.naziv, `${x.kom} kom`]),
                      ...(s.rukohvat ? [[`Rukohvat ${s.rukohvat}`, "1 kom"]] : []),
                      ...(s.elektroPrihvatnik ? [["Elektro prihvatnik", "1 kom"]] : []),
                      ...(s.automat ? [["Automat / pumpa", "1 kom"]] : []),
                      ...DODACI.filter((d) => s[d.polje]).map((d) => [
                        d.polje === "roletna" ? `${d.naziv}: ${s.roletna} (kutija ${visinaRoletne(s.roletnaVisina)} mm, kaiš ${s.roletnaKais === "L" ? "levo" : "desno"})` : `${d.naziv}: ${s[d.polje]}`,
                        d.polje === "roletna"
                          ? `${s.sirina}×${s.visina + visinaRoletne(s.roletnaVisina)}`
                          : d.jedinica === "m²"
                            ? `${s.sirina}×${s.visina}`
                            : `${s.sirina} mm`,
                      ]),
                    ]}
                  />
                </div>
              )}

              {profilna && s.kolicina > 1 && (
                <p className="mt-4 text-xs text-muted">Mere su za jedan komad. Ukupno izraditi: {s.kolicina} kom.</p>
              )}

              <footer className="mt-8 grid grid-cols-3 gap-8 text-center text-[11px] text-muted">
                <div className="border-t border-line pt-1.5">Sekao</div>
                <div className="border-t border-line pt-1.5">Varenje / sklapanje</div>
                <div className="border-t border-line pt-1.5">Kontrola</div>
              </footer>
            </article>
          );
        })}
      </div>
    </>
  );
}
