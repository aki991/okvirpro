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
  // komadi po (sistem, ključ profila)
  const grupe = new Map<string, { sistemId: number; kljuc: string; komadi: Komad[] }>();
  for (const { s, poz, r } of p.pozicije) {
    if (!profilnaVrsta(s.vrsta) || !s.sistemId) continue;
    for (const rez of [...r.rezovi, ...r.celik]) {
      const kljuc = `${s.sistemId}|${rez.kljuc}`;
      if (!grupe.has(kljuc)) grupe.set(kljuc, { sistemId: s.sistemId, kljuc: rez.kljuc, komadi: [] });
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
    const g = grupe.get(`${pr.sistemId}|${pr.kljuc}`);
    if (!g || !pr.duzinaSipke) continue;
    const { sipke, greska } = optimizuj(g.komadi, pr.duzinaSipke, pr.ostaci.filter((o) => o.duzina >= MIN_OSTATAK));
    planovi.push({
      profilStavkaId: pr.id,
      sistem: pr.sistem.naziv,
      profil: pr.naziv,
      duzinaSipke: pr.duzinaSipke,
      sipke,
      punihSipki: sipke.filter((s) => s.izvor === "NOVA").length,
      iskoriscenihOstataka: sipke.filter((s) => s.izvor === "OSTATAK").length,
      metara: Math.round(g.komadi.reduce((a, k) => a + k.mera, 0)) / 1000,
      otpad: sipke.reduce((a, s) => a + (s.ostatak < MIN_OSTATAK ? s.ostatak : 0), 0),
      greska,
    });
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
