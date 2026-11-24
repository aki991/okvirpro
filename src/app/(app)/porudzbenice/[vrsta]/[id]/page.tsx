import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { napraviPlan, ucitajProizvodnju } from "@/lib/proizvodnja";
import { profilnaVrsta } from "@/lib/stavka";
import { nazivPoIzvoru } from "@/lib/trebovanje";
import { visinaRoletne } from "@/lib/proracun";
import { datum } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { StampajDugme } from "@/components/StampajDugme";
import { NazadDugme } from "@/components/NazadDugme";
import { ZaglavljeFirme } from "@/components/ZaglavljeFirme";
import { PORUDZBENICE, type VrstaPorudzbenice } from "../../vrste";

export const dynamic = "force-dynamic";

type Red = (string | number)[];

const m2 = (s: number, v: number, kom: number) => ((s * v) / 1e6) * kom;
const s_roletna = (s: { roletna: string | null }) => s.roletna;
const s_komarnik = (s: { komarnik: string | null }) => s.komarnik;
const f2 = (n: number) => n.toLocaleString("sr-RS", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default async function Porudzbenica({ params }: { params: Promise<{ vrsta: string; id: string }> }) {
  const { vrsta, id } = await params;
  const def = PORUDZBENICE[vrsta as VrstaPorudzbenice];
  if (!def) notFound();
  const p = await ucitajProizvodnju(Number(id));
  if (!p) notFound();
  const firma = await db.firma.findUniqueOrThrow({ where: { id: 1 } });
  const { ponuda, pozicije } = p;

  let kolone: string[] = [];
  let redovi: Red[] = [];
  let zbir: Red | null = null;

  switch (vrsta as VrstaPorudzbenice) {
    case "staklo": {
      kolone = ["Poz.", "Vrsta stakla", "Polje", "Širina (mm)", "Visina (mm)", "Kom", "m²"];
      for (const { s, poz, r } of pozicije) {
        if (!profilnaVrsta(s.vrsta)) continue;
        for (const g of r.staklo) {
          if (g.opis.endsWith("(panel)")) continue;
          redovi.push([poz, s.staklo ?? "", g.opis, g.sirina, g.visina, g.kom * s.kolicina, f2(m2(g.sirina, g.visina, g.kom * s.kolicina))]);
        }
      }
      const ukupno = redovi.reduce((a, r) => a + Number(String(r[6]).replace(/\./g, "").replace(",", ".")), 0);
      zbir = ["", "", "Ukupno", "", "", redovi.reduce((a, r) => a + Number(r[5]), 0), f2(ukupno)];
      break;
    }
    case "roletne":
    case "komarnici": {
      const tip = vrsta === "roletne" ? "ROLETNA" : "KOMARNIK";
      kolone = ["Poz.", "Model / materijal", "Širina (mm)", "Visina (mm)", "Kom", "m²", "Napomena"];
      const dodatak = vrsta === "roletne" ? s_roletna : s_komarnik;
      for (const { s, poz } of pozicije) {
        // samostalna stavka (roletna/komarnik) ili dodatak uz prozor/vrata
        const materijal = s.vrsta === tip ? s.materijal : dodatak(s);
        if (!materijal) continue;
        const uz = s.vrsta === "VRATA" ? "vrata" : "prozor";
        // roletna uz poziciju: visina zavese = visina pozicije + kutija
        const kutija = vrsta === "roletne" && s.vrsta !== tip ? visinaRoletne(s.roletnaVisina) : 0;
        const kais = kutija ? `, kaiš ${s.roletnaKais === "L" ? "levo" : "desno"}` : "";
        const opis = s.vrsta === tip ? materijal : `${materijal} (uz ${uz}${kutija ? `, kutija ${kutija} mm` : ""}${kais})`;
        const vis = s.visina + kutija;
        redovi.push([poz, opis, s.sirina, vis, s.kolicina, f2(m2(s.sirina, vis, s.kolicina)), s.napomena]);
      }
      break;
    }
    case "daske-okapnice": {
      kolone = ["Poz.", "Vrsta", "Materijal", "Dužina (mm)", "Kom", "Ukupno (m)", "Napomena"];
      for (const { s, poz } of pozicije) {
        const red = (naziv: string, mat: string) =>
          redovi.push([poz, naziv, mat, s.sirina, s.kolicina, f2((s.sirina * s.kolicina) / 1000), s.napomena]);
        if (s.vrsta === "DASKA") red("Unutrašnja daska", s.materijal ?? "");
        else if (s.vrsta === "OKAPNICA") red("Spoljašnja okapnica", s.materijal ?? "");
        else {
          if (s.daska) red("Unutrašnja daska (uz poziciju)", s.daska);
          if (s.okapnica) red("Spoljašnja okapnica (uz poziciju)", s.okapnica);
        }
      }
      break;
    }
    case "okov": {
      kolone = ["Naziv", "Količina", "Jedinica", "Pozicije"];
      const mapa = new Map<string, { kol: number; jed: string; poz: Set<number> }>();
      const dodaj = (naziv: string, kol: number, jed: string, poz: number) => {
        const x = mapa.get(naziv) ?? { kol: 0, jed, poz: new Set<number>() };
        x.kol += kol;
        x.poz.add(poz);
        mapa.set(naziv, x);
      };
      const nazivOkova = nazivPoIzvoru(pozicije.flatMap((x) => x.r.okov));
      const nazivPribora = nazivPoIzvoru(pozicije.flatMap((x) => x.r.pribor ?? []));
      for (const { s, poz, r } of pozicije) {
        for (const o of r.okov) dodaj(nazivOkova(o), o.kolicina * s.kolicina, o.jedinica, poz);
        for (const o of r.pribor ?? []) dodaj(nazivPribora(o), o.kolicina * s.kolicina, o.jedinica, poz);
        for (const k of r.komadi) dodaj(k.naziv, k.kom * s.kolicina, "kom", poz);
        if (s.rukohvat) dodaj(`Rukohvat ${s.rukohvat}`, s.kolicina, "kom", poz);
        if (s.elektroPrihvatnik) dodaj("Elektro prihvatnik", s.kolicina, "kom", poz);
        if (s.automat) dodaj("Automat / pumpa", s.kolicina, "kom", poz);
        if (s.panelSifra) dodaj(`Panel ${s.panelSifra}`, s.kolicina, "kom", poz);
      }
      redovi = [...mapa.entries()].map(([n, x]) => [n, Math.round(x.kol * 100) / 100, x.jed, [...x.poz].join(", ")]);
      break;
    }
    case "profil": {
      kolone = ["Sistem", "Profil", "Dužina šipke", "Potrebno (m)", "Iz ostataka", "Novih šipki", "Na stanju", "Poručiti"];
      const plan = ponuda.utrosakProknjizen && ponuda.krojnaLista ? JSON.parse(ponuda.krojnaLista) : await napraviPlan(p);
      const stanja = await db.profilStavka.findMany({ where: { id: { in: plan.map((x: { profilStavkaId: number }) => x.profilStavkaId) } } });
      for (const pr of plan as Awaited<ReturnType<typeof napraviPlan>>) {
        // magacin vodi bele profile; profil u boji se uvek poručuje ceo
        const naStanju = pr.bojaSifra ? 0 : stanja.find((x) => x.id === pr.profilStavkaId)?.puneSipke ?? 0;
        const poruciti = pr.bojaSifra ? pr.punihSipki : ponuda.utrosakProknjizen ? Math.max(0, -naStanju) : Math.max(0, pr.punihSipki - naStanju);
        redovi.push([pr.sistem, pr.boja ? `${pr.profil} – ${pr.boja}` : pr.profil, pr.duzinaSipke, f2(pr.metara), pr.iskoriscenihOstataka, pr.punihSipki, naStanju, poruciti]);
      }
      break;
    }
  }

  // kolone sa tekstom (naziv, materijal, opis) su levo, a kolone sa brojevima centrirane
  const brojcana = (j: number) => redovi.every((r) => r[j] === "" || typeof r[j] === "number" || /^[\d.,\s+×x-]+$/.test(String(r[j])));
  const levo = (j: number) => redovi.length > 0 && !brojcana(j) && !/^(Poz|Pozicije|Jedinica|Napomena)/.test(kolone[j]);

  return (
    <>
      <PageHeader
        naslov={`${def.dokument} ${ponuda.broj}`}
        akcije={
          <>
            <NazadDugme href={`/porudzbenice/${vrsta}`} />
            <StampajDugme label="Štampaj" />
          </>
        }
      />
      <div className="p-4 sm:p-6 lg:p-8 print:p-0">
        <article className="mx-auto overflow-x-auto max-w-5xl bg-white p-5 sm:p-10 shadow-sm ring-1 ring-line print:max-w-none print:p-0 print:shadow-none print:ring-0">
          <ZaglavljeFirme firma={firma}>
            <p className="text-xl font-extrabold uppercase tracking-tight text-brand">{def.dokument}</p>
            <p className="font-mono font-semibold">br. {ponuda.broj}</p>
            <p className="text-sm text-muted">Datum: {datum(new Date())}</p>
          </ZaglavljeFirme>

          <div className="mt-6 grid gap-6 sm:grid-cols-2 text-sm">
            <div className="rounded-lg border border-dashed border-line p-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Dobavljač</p>
              <div className="mt-6 border-b border-line" />
              <div className="mt-6 border-b border-line" />
            </div>
            <div className="rounded-lg bg-background p-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Za nalog</p>
              <p className="mt-1 font-semibold">{ponuda.klijent.naziv}</p>
              <p>Rok isporuke kupcu: <b>{datum(ponuda.rokIsporuke)}</b></p>
            </div>
          </div>

          {redovi.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">Nalog nema stavki za ovu porudžbenicu.</p>
          ) : (
            <table className="mt-8 w-full text-sm">
              <thead>
                <tr className="border-y border-line bg-background text-xs uppercase tracking-wide text-muted">
                  {kolone.map((k, j) => (
                    <th key={k} className={`px-2 py-2 font-semibold ${levo(j) ? "text-left" : ""}`}>{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {redovi.map((r, i) => (
                  <tr key={i} className="border-b border-line/60">
                    {r.map((c, j) => (
                      <td key={j} className={`px-2 py-2 ${levo(j) ? "text-left" : "tabular-nums"} ${typeof c === "number" ? "font-semibold" : ""}`}>{c}</td>
                    ))}
                  </tr>
                ))}
                {zbir && (
                  <tr className="font-bold">
                    {zbir.map((c, j) => (
                      <td key={j} className={`px-2 py-2 ${levo(j) ? "text-left" : "tabular-nums"}`}>{c}</td>
                    ))}
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {vrsta === "profil" && (() => {
            const obojene = pozicije.filter(({ s }) => profilnaVrsta(s.vrsta) && s.boja && s.boja !== "BELA");
            if (obojene.length === 0) return null;
            return (
              <p className="mt-4 rounded-lg bg-accent-soft px-3 py-2 text-sm">
                <b>Boje profila (dekor/folija):</b>{" "}
                {obojene.map(({ s, poz }) => `poz. ${poz} – ${p.k.boje.find((b) => b.sifra === s.boja)?.naziv ?? s.boja}`).join("; ")}. Ostale pozicije su bele.
              </p>
            );
          })()}

          {vrsta === "profil" && (
            <p className="mt-4 text-xs text-muted">
              Broj novih šipki je iz optimizacije sečenja{ponuda.utrosakProknjizen ? " (proknjiženo)" : ""}. „Poručiti“ = nove šipke koje nedostaju na stanju magacina.
            </p>
          )}

          <div className="mt-14 grid grid-cols-2 gap-16 text-center text-xs text-muted">
            <div className="border-t border-line pt-2">Poručio ({firma.naziv || "naručilac"})</div>
            <div className="border-t border-line pt-2">Primio (dobavljač)</div>
          </div>
        </article>
      </div>
    </>
  );
}
