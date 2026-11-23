"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type { Cvor } from "@/lib/modeli-katalog";

// ───────────── Podešavanja ─────────────
export type FirmaUnos = {
  naziv: string; adresa: string; mesto: string; pib: string; maticniBroj: string; email: string;
  telefon: string; web: string; tekuciRacun: string; zastupnik: string; logo: string | null;
  marza: number; montazaPoM2: number; pdvStopa: number; kursEur: number; garancija: string; uslovi: string;
  kalkulatorAktivan: boolean; kalkulatorPoruka: string;
};

export type CenovnikUnos = { id?: number; kategorija: string; naziv: string; cena: number };

export type BojaUnos = { id: number; naziv: string; hex: string; doplata: number };

export async function sacuvajPodesavanja(firma: FirmaUnos, cenovnik: CenovnikUnos[], boje: BojaUnos[] = []) {
  await db.$transaction(async (tx) => {
    await tx.firma.upsert({ where: { id: 1 }, update: firma, create: { id: 1, ...firma } });
    for (const b of boje) {
      if (!/^#[0-9a-fA-F]{6}$/.test(b.hex)) throw new Error(`Boja „${b.naziv}“ nema ispravnu nijansu.`);
      await tx.bojaProfila.update({ where: { id: b.id }, data: { naziv: b.naziv.trim() || "Boja", hex: b.hex, doplata: Math.max(0, b.doplata) } });
    }
    const zadrzani = cenovnik.filter((c) => c.id).map((c) => c.id!) ;
    await tx.cenovnikStavka.deleteMany({ where: { id: { notIn: zadrzani } } });
    for (const [i, c] of cenovnik.entries()) {
      const data = { kategorija: c.kategorija, naziv: c.naziv.trim(), cena: c.cena, redosled: i };
      if (c.id) await tx.cenovnikStavka.update({ where: { id: c.id }, data });
      else await tx.cenovnikStavka.create({ data });
    }
  });
  revalidatePath("/", "layout");
}

// ───────────── Profili ─────────────
export type ProfilStavkaUnos = {
  id: number; duzinaSipke: number | null; unutrasnjaVisina: number | null; sirinaOdbitak: number | null; cena: number;
};

export async function sacuvajSistem(id: number, naziv: string, stavke: ProfilStavkaUnos[]) {
  await db.$transaction([
    db.profilSistem.update({ where: { id }, data: { naziv: naziv.trim() } }),
    ...stavke.map((s) =>
      db.profilStavka.update({
        where: { id: s.id },
        data: { duzinaSipke: s.duzinaSipke, unutrasnjaVisina: s.unutrasnjaVisina, sirinaOdbitak: s.sirinaOdbitak, cena: s.cena },
      }),
    ),
  ]);
  revalidatePath("/profili");
}

const STAVKE_SISTEMA: Record<string, [string, string, boolean?][]> = {
  PVC: [
    ["RAM", "Ram"], ["KRILO_PROZORA", "Krilo prozora"], ["KRILO_VRATA", "Krilo vrata"],
    ["CELIK_RAMA", "Čelično ojačanje rama"], ["CELIK_KRILA", "Čelično ojačanje krila"], ["CELIK_KRILA_VRATA", "Čelično ojačanje krila vrata"],
    ["LAJSNA", "Lajsna"], ["PRECKA", "Prečka"], ["LAZNA_PRECKA", "Lažna prečka"], ["PRAG", "Prag"],
    ["PROSIRENJE", "Proširenje"], ["PODSTOK", "Podštok"], ["SPOJNICA_PRECKE", "Spojnica prečke", true], ["POKLOPAC_STULPA", "Poklopac štulpa", true],
  ],
  ALU: [
    ["RAM", "Ram"], ["KRILO_PROZORA", "Krilo prozora"], ["KRILO_VRATA", "Krilo vrata"], ["LAJSNA", "Lajsna"],
    ["PRECKA", "Prečka"], ["LAZNA_PRECKA", "Lažna prečka"], ["PRAG", "Prag"], ["PROSIRENJE", "Proširenje"], ["PODSTOK", "Podštok"],
    ["SPOJNICA_PRECKE", "Spojnica prečke", true], ["POKLOPAC_STULPA", "Poklopac štulpa", true],
  ],
};

export async function dodajSistem(tip: "PVC" | "ALU", naziv: string) {
  const max = await db.profilSistem.aggregate({ _max: { redosled: true } });
  await db.profilSistem.create({
    data: {
      naziv: naziv.trim() || `Novi ${tip} sistem`,
      tip,
      redosled: (max._max.redosled ?? 0) + 1,
      stavke: {
        create: STAVKE_SISTEMA[tip].map(([kljuc, n, poKomadu], i) => ({
          kljuc, naziv: n, poKomadu: !!poKomadu, redosled: i,
          duzinaSipke: poKomadu ? null : kljuc === "PRAG" || kljuc.startsWith("CELIK") || kljuc === "PROSIRENJE" || kljuc === "PODSTOK" ? 6000 : 6500,
        })),
      },
    },
  });
  revalidatePath("/profili");
}

export async function obrisiSistem(id: number) {
  const koristi = await db.ponudaStavka.count({ where: { sistemId: id } });
  if (koristi > 0) throw new Error("Sistem se koristi u ponudama i ne može se obrisati.");
  await db.profilSistem.delete({ where: { id } });
  revalidatePath("/profili");
}

export async function pomeriSistem(id: number, smer: -1 | 1) {
  const s = await db.profilSistem.findUniqueOrThrow({ where: { id } });
  const svi = await db.profilSistem.findMany({ where: { tip: s.tip }, orderBy: [{ redosled: "asc" }, { id: "asc" }] });
  const i = svi.findIndex((x) => x.id === id);
  const j = i + smer;
  if (j < 0 || j >= svi.length) return;
  [svi[i], svi[j]] = [svi[j], svi[i]];
  await db.$transaction(svi.map((x, k) => db.profilSistem.update({ where: { id: x.id }, data: { redosled: k } })));
  revalidatePath("/profili");
}

// ───────────── Okov ─────────────
export async function sacuvajOkov(metoda: string, okovPoM2: number, cene: { id: number; cena: number }[]) {
  await db.$transaction([
    db.firma.update({ where: { id: 1 }, data: { okovMetoda: metoda, okovPoM2 } }),
    ...cene.map((c) => db.okovStavka.update({ where: { id: c.id }, data: { cena: c.cena } })),
  ]);
  revalidatePath("/okov");
}

// ───────────── Modeli ─────────────
export async function sacuvajModel(m: { sifra: string; naziv: string; kategorija: string; definicija: Cvor }) {
  const sifra = m.sifra.trim().toUpperCase();
  if (!sifra || !m.naziv.trim()) throw new Error("Šifra i naziv su obavezni.");
  const postoji = await db.model.findUnique({ where: { sifra } });
  if (postoji && !postoji.korisnicki) throw new Error("Ta šifra pripada sistemskom modelu.");
  const max = await db.model.aggregate({ _max: { redosled: true } });
  await db.model.upsert({
    where: { sifra },
    update: { naziv: m.naziv.trim(), kategorija: m.kategorija, definicija: JSON.stringify(m.definicija) },
    create: {
      sifra, naziv: m.naziv.trim(), kategorija: m.kategorija, definicija: JSON.stringify(m.definicija),
      korisnicki: true, redosled: (max._max.redosled ?? 0) + 1,
    },
  });
  revalidatePath("/modeli");
}

export async function obrisiModel(id: number) {
  await db.model.delete({ where: { id, korisnicki: true } });
  revalidatePath("/modeli");
}

// ───────────── Paneli ─────────────
export type PanelUnos = { id?: number; sifra: string; naziv: string; cena: number; slika: string | null };

export async function sacuvajPanele(paneli: PanelUnos[]) {
  const sifre = paneli.map((p) => p.sifra.trim().toUpperCase());
  if (sifre.some((s) => !s)) throw new Error("Svaki panel mora imati šifru.");
  if (new Set(sifre).size !== sifre.length) throw new Error("Šifre panela moraju biti jedinstvene.");
  await db.$transaction(async (tx) => {
    const zadrzani = paneli.filter((p) => p.id).map((p) => p.id!);
    await tx.panel.deleteMany({ where: { id: { notIn: zadrzani } } });
    for (const [i, p] of paneli.entries()) {
      const data = { sifra: sifre[i], naziv: p.naziv.trim(), cena: p.cena, slika: p.slika, redosled: i };
      if (p.id) await tx.panel.update({ where: { id: p.id }, data });
      else await tx.panel.create({ data });
    }
  });
  revalidatePath("/paneli");
}
