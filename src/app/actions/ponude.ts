"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ucitajKontekst } from "@/lib/kontekst";
import { izracunaj, prepustRoletne, stranaKaisa, visinaRoletne, zbir, type Opcije, type StavkaUlaz } from "@/lib/proracun";
import type { KlijentUnos } from "./klijenti";

export type PonudaUnos = {
  klijentId: number | null; // postojeći
  noviKlijent: KlijentUnos | null; // ili novi
  rokIsporuke: string | null; // YYYY-MM-DD
  opcije: Opcije;
  stavke: StavkaUlaz[];
};

const profilna = (v: string) => v === "PROZOR" || v === "VRATA";

async function sledeciBroj() {
  const god = new Date().getFullYear();
  const poslednja = await db.ponuda.findFirst({ where: { broj: { startsWith: `P-${god}-` } }, orderBy: { broj: "desc" } });
  const n = poslednja ? Number(poslednja.broj.split("-")[2]) + 1 : 1;
  return `P-${god}-${String(n).padStart(4, "0")}`;
}

/** Čuva ponudu. Cene se uvek ponovo računaju na serveru. */
export async function sacuvajPonudu(id: number | null, u: PonudaUnos) {
  if (u.stavke.length === 0) throw new Error("Ponuda mora imati bar jednu stavku.");

  let klijentId = u.klijentId;
  if (!klijentId) {
    if (!u.noviKlijent?.naziv.trim()) throw new Error("Unesi ime kupca ili izaberi postojećeg.");
    const k = await db.klijent.create({ data: { ...u.noviKlijent, naziv: u.noviKlijent.naziv.trim() } });
    klijentId = k.id;
  }

  const kontekst = await ucitajKontekst();
  const rezultati = u.stavke.map((s) => ({ s, r: izracunaj(kontekst, s) }));
  const z = zbir(kontekst, rezultati.map(({ s, r }) => ({ r, kolicina: s.kolicina })), u.opcije);

  const stavke = rezultati.map(({ s, r }, i) => ({
    redosled: i,
    vrsta: s.vrsta,
    sirina: s.sirina,
    visina: s.visina,
    kolicina: Math.max(1, Math.round(s.kolicina)),
    sistemId: s.vrsta === "PROZOR" || s.vrsta === "VRATA" ? s.sistemId : null,
    staklo: s.staklo,
    materijal: s.materijal,
    marza: s.marza,
    rucnaCena: s.rucnaCena,
    modelSifra: s.modelSifra,
    panelSifra: s.vrsta === "VRATA" ? s.panelSifra : null,
    rukohvat: s.vrsta === "VRATA" ? s.rukohvat : null,
    boja: profilna(s.vrsta) && s.boja && s.boja !== "BELA" ? s.boja : null,
    roletna: profilna(s.vrsta) ? s.roletna ?? null : null,
    roletnaVisina: profilna(s.vrsta) && s.roletna ? visinaRoletne(s.roletnaVisina) : null,
    roletnaPrepust: profilna(s.vrsta) && s.roletna ? prepustRoletne(s.roletnaPrepust) : null,
    roletnaKais: profilna(s.vrsta) && s.roletna ? stranaKaisa(s.roletnaKais) : null,
    komarnik: profilna(s.vrsta) ? s.komarnik ?? null : null,
    daska: profilna(s.vrsta) ? s.daska ?? null : null,
    okapnica: profilna(s.vrsta) ? s.okapnica ?? null : null,
    elektroPrihvatnik: s.vrsta === "VRATA" && s.elektroPrihvatnik,
    automat: s.vrsta === "VRATA" && s.automat,
    podstok: s.podstok,
    prosirenjeL: s.prosirenjeL,
    prosirenjeD: s.prosirenjeD,
    // čuva se samo ručno uneta mera; null = podrazumevano iz sistema
    podstokMm: s.podstok && s.podstokMm && s.podstokMm > 0 ? s.podstokMm : null,
    prosirenjeLMm: s.prosirenjeL && s.prosirenjeLMm && s.prosirenjeLMm > 0 ? s.prosirenjeLMm : null,
    prosirenjeDMm: s.prosirenjeD && s.prosirenjeDMm && s.prosirenjeDMm > 0 ? s.prosirenjeDMm : null,
    spojL: s.spojL,
    spojD: s.spojD,
    napomena: s.napomena,
    cenaKom: r.cenaKom,
    trosakKom: r.trosakKom,
  }));

  const podaci = {
    klijentId,
    rokIsporuke: u.rokIsporuke ? new Date(u.rokIsporuke) : null,
    bezPdv: u.opcije.bezPdv,
    montazaUCenu: u.opcije.montazaUCenu,
    bezMontaze: u.opcije.bezMontaze,
    ukupnoBezPdv: z.ukupnoBezPdv,
    pdv: z.pdv,
    montaza: z.montaza,
    ukupnoZaNaplatu: z.ukupnoZaNaplatu,
    trosakMaterijala: z.trosakMaterijala,
  };

  let ponudaId: number;
  if (id) {
    const p = await db.ponuda.findUniqueOrThrow({ where: { id } });
    if (p.utrosakProknjizen) throw new Error("Utrošak za ovu ponudu je već proknjižen – izmena nije dozvoljena.");
    await db.$transaction([
      db.ponudaStavka.deleteMany({ where: { ponudaId: id } }),
      db.ponuda.update({ where: { id }, data: { ...podaci, stavke: { create: stavke } } }),
    ]);
    ponudaId = id;
  } else {
    const p = await db.ponuda.create({ data: { ...podaci, broj: await sledeciBroj(), stavke: { create: stavke } } });
    ponudaId = p.id;
  }

  revalidatePath("/", "layout");
  redirect(`/ponude/${ponudaId}`);
}

export async function promeniStatus(id: number, status: "NACRT" | "POTVRDJENO" | "REALIZOVANO") {
  await db.ponuda.update({ where: { id }, data: { status, realizovanoAt: status === "REALIZOVANO" ? new Date() : null } });
  revalidatePath("/", "layout");
}

export async function obrisiPonudu(id: number) {
  const p = await db.ponuda.findUniqueOrThrow({ where: { id } });
  if (p.utrosakProknjizen) throw new Error("Utrošak je proknjižen u magacinu – ponuda se ne može obrisati.");
  await db.ponuda.delete({ where: { id } });
  revalidatePath("/", "layout");
}

export async function kopirajPonudu(id: number) {
  const p = await db.ponuda.findUniqueOrThrow({ where: { id }, include: { stavke: true } });
  const nova = await db.ponuda.create({
    data: {
      broj: await sledeciBroj(),
      klijentId: p.klijentId,
      rokIsporuke: p.rokIsporuke,
      bezPdv: p.bezPdv,
      montazaUCenu: p.montazaUCenu,
      bezMontaze: p.bezMontaze,
      ukupnoBezPdv: p.ukupnoBezPdv,
      pdv: p.pdv,
      montaza: p.montaza,
      ukupnoZaNaplatu: p.ukupnoZaNaplatu,
      trosakMaterijala: p.trosakMaterijala,
      stavke: { create: p.stavke.map(({ id: _id, ponudaId: _p, ...s }) => s) },
    },
  });
  revalidatePath("/", "layout");
  redirect(`/ponude/${nova.id}/izmeni`);
}
