import "server-only";
import { db } from "./db";
import { ucitajKontekst } from "./kontekst";
import { izracunaj, type Rezultat } from "./proracun";
import { izBaze, profilnaVrsta } from "./stavka";
import { MIN_OSTATAK, optimizuj, type Komad, type PlanProfila } from "./krojenje";

/** Učitava ponudu sa proračunom za svaku stavku (za radni nalog, krojnu listu, porudžbenice). */
export async function ucitajProizvodnju(id: number) {
  const ponuda = await db.ponuda.findUnique({
    where: { id },
    include: { klijent: true, stavke: { orderBy: { redosled: "asc" }, include: { sistem: true } } },
  });
  if (!ponuda) return null;
  const k = await ucitajKontekst();
  const pozicije = ponuda.stavke.map((s, i) => ({ s, poz: i + 1, r: izracunaj(k, izBaze(s)) as Rezultat }));
  return { ponuda, k, pozicije };
}

export type Proizvodnja = NonNullable<Awaited<ReturnType<typeof ucitajProizvodnju>>>;

/** Pravi plan sečenja za celu ponudu, koristeći trenutno stanje ostataka u magacinu. */
export async function napraviPlan(p: Proizvodnja): Promise<PlanProfila[]> {
  // komadi po (sistem, ključ profila, boja) – profil u boji (dekor folija) je drugi artikal i ne sme
  // da se seče iz iste šipke kao beli; čelik nema boju
  const grupe = new Map<string, { sistemId: number; kljuc: string; boja: string; komadi: Komad[] }>();
  for (const { s, poz, r } of p.pozicije) {
    if (!profilnaVrsta(s.vrsta) || !s.sistemId) continue;
    for (const rez of [...r.rezovi, ...r.celik]) {
      const boja = rez.kljuc.startsWith("CELIK") || !s.boja || s.boja === "BELA" ? "" : s.boja;
      const kljuc = `${s.sistemId}|${rez.kljuc}|${boja}`;
      if (!grupe.has(kljuc)) grupe.set(kljuc, { sistemId: s.sistemId, kljuc: rez.kljuc, boja, komadi: [] });
      const oznaka = `P${poz}${rez.oznaka.replace(/^P\d+/, "")}`;
      for (let n = 0; n < rez.kom * s.kolicina; n++) grupe.get(kljuc)!.komadi.push({ oznaka, mera: rez.mera, ugao: rez.ugao });
    }
  }

  const profili = await db.profilStavka.findMany({
    where: { OR: [...grupe.values()].map((g) => ({ sistemId: g.sistemId, kljuc: g.kljuc })) },
    include: { sistem: true, ostaci: true },
    orderBy: [{ sistem: { redosled: "asc" } }, { redosled: "asc" }],
  });

  const planovi: PlanProfila[] = [];
  for (const pr of profili) {
    // bela grupa prva, pa boje redom kako su u podešavanjima
    const svojeGrupe = [...grupe.values()]
      .filter((g) => g.sistemId === pr.sistemId && g.kljuc === pr.kljuc)
      .sort((a, b) => (a.boja === "" ? -1 : b.boja === "" ? 1 : p.k.boje.findIndex((x) => x.sifra === a.boja) - p.k.boje.findIndex((x) => x.sifra === b.boja)));
    for (const g of svojeGrupe) {
      if (!pr.duzinaSipke) continue;
      // magacin (pune šipke i ostaci) vodi bele profile – profil u boji se uvek seče iz novih šipki
      const ostaci = g.boja ? [] : pr.ostaci.filter((o) => o.duzina >= MIN_OSTATAK);
      const { sipke, greska } = optimizuj(g.komadi, pr.duzinaSipke, ostaci);
      planovi.push({
        profilStavkaId: pr.id,
        kljuc: pr.kljuc,
        sistem: pr.sistem.naziv,
        profil: pr.naziv,
        bojaSifra: g.boja || undefined,
        boja: g.boja ? p.k.boje.find((x) => x.sifra === g.boja)?.naziv ?? g.boja : undefined,
        duzinaSipke: pr.duzinaSipke,
        sipke,
        punihSipki: sipke.filter((s) => s.izvor === "NOVA").length,
        iskoriscenihOstataka: sipke.filter((s) => s.izvor === "OSTATAK").length,
        metara: Math.round(g.komadi.reduce((a, k) => a + k.mera, 0)) / 1000,
        otpad: sipke.reduce((a, s) => a + (s.ostatak < MIN_OSTATAK ? s.ostatak : 0), 0),
        greska,
      });
    }
  }
  return planovi;
}

/** Potvrđene ponude (za liste dokumenata). */
export function potvrdjenePonude() {
  return db.ponuda.findMany({
    where: { status: { in: ["POTVRDJENO", "REALIZOVANO"] } },
    orderBy: { createdAt: "desc" },
    include: {
      klijent: true,
      stavke: { select: { vrsta: true, kolicina: true, panelSifra: true, roletna: true, komarnik: true, daska: true, okapnica: true } },
    },
  });
}
