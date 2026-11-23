"use server";

// Akcije javnog kalkulatora. Proračun se radi samo na serveru, tako da nabavne cene
// i marža nikad ne stižu do pretraživača kupca – kupac dobija samo krajnju cenu.

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { ucitajKontekst } from "@/lib/kontekst";
import { izracunaj, prepustRoletne, stranaKaisa, visinaRoletne, zbir, type Kontekst, type StavkaUlaz, type Vrsta } from "@/lib/proracun";

export type JavnaStavka = {
  vrsta: string;
  sirina: number;
  visina: number;
  kolicina: number;
  sistemId: number | null;
  staklo: string | null;
  modelSifra: string | null;
  panelSifra: string | null;
  materijal: string | null;
  boja?: string | null;
  roletna?: string | null;
  roletnaVisina?: number | null;
  roletnaPrepust?: number | null;
  roletnaKais?: string | null;
  komarnik?: string | null;
  daska?: string | null;
  okapnica?: string | null;
};

export type JavniRezultat = {
  stavke: { cenaKomSaPdv: number; ukupnoSaPdv: number; greska?: string }[];
  ukupnoSaPdv: number;
  montaza: number;
  ukupno: number;
};

const DOZVOLJENE: Vrsta[] = ["PROZOR", "VRATA", "ROLETNA", "KOMARNIK"];
const MAX_STAVKI = 20;
const r2 = (n: number) => Math.round(n * 100) / 100;

function cisti(k: Kontekst, s: JavnaStavka, marza: number): { ulaz: StavkaUlaz; greska?: string } {
  const vrsta = (DOZVOLJENE.includes(s.vrsta as Vrsta) ? s.vrsta : "PROZOR") as Vrsta;
  const ceo = (n: unknown, min: number, max: number) => Math.min(max, Math.max(min, Math.round(Number(n) || 0)));
  const sirina = ceo(s.sirina, 0, 10000);
  const visina = ceo(s.visina, 0, 10000);
  let greska: string | undefined;
  if (sirina < 300 || visina < 300) greska = "Najmanja mera je 300 mm.";
  if (sirina > 6000 || visina > 6000) greska = "Za mere preko 6000 mm kontaktirajte nas.";

  const profilna = vrsta === "PROZOR" || vrsta === "VRATA";
  const sistem = k.sistemi.find((x) => x.id === s.sistemId) ?? k.sistemi[0];
  const staklo = k.cenovnik.find((c) => c.kategorija === "STAKLO" && c.naziv === s.staklo)?.naziv ?? k.cenovnik.find((c) => c.kategorija === "STAKLO")?.naziv ?? null;
  const model = k.modeli.find((m) => m.sifra === s.modelSifra && m.kategorija === vrsta);
  const panel = vrsta === "VRATA" ? k.paneli.find((p) => p.sifra === s.panelSifra) : undefined;
  const kat = vrsta === "ROLETNA" ? "ROLETNA" : vrsta === "KOMARNIK" ? "KOMARNIK" : null;
  const materijal = kat ? (k.cenovnik.find((c) => c.kategorija === kat && c.naziv === s.materijal) ?? k.cenovnik.find((c) => c.kategorija === kat))?.naziv ?? null : null;
  // dodatak važi samo ako postoji u cenovniku (ne prihvatamo proizvoljan tekst)
  const dodatak = (kategorija: string, naziv: string | null | undefined) =>
    profilna && naziv ? k.cenovnik.find((c) => c.kategorija === kategorija && c.naziv === naziv)?.naziv ?? null : null;

  return {
    greska,
    ulaz: {
      vrsta,
      sirina,
      visina,
      kolicina: ceo(s.kolicina, 1, 50),
      sistemId: profilna ? sistem?.id ?? null : null,
      staklo: profilna ? staklo : null,
      materijal,
      marza,
      rucnaCena: null,
      modelSifra: profilna ? model?.sifra ?? null : null,
      panelSifra: panel?.sifra ?? null,
      rukohvat: null,
      // boja samo iz liste boja (ne prihvatamo proizvoljan tekst); bela = bez doplate
      boja: profilna && s.boja && s.boja !== "BELA" ? k.boje.find((b) => b.sifra === s.boja)?.sifra ?? null : null,
      roletna: dodatak("ROLETNA", s.roletna),
      roletnaVisina: dodatak("ROLETNA", s.roletna) ? visinaRoletne(Number(s.roletnaVisina)) : null,
      roletnaPrepust: dodatak("ROLETNA", s.roletna) ? prepustRoletne(s.roletnaPrepust == null ? null : Number(s.roletnaPrepust)) : null,
      roletnaKais: dodatak("ROLETNA", s.roletna) ? stranaKaisa(s.roletnaKais) : null,
      komarnik: dodatak("KOMARNIK", s.komarnik),
      daska: dodatak("DASKA", s.daska),
      okapnica: dodatak("OKAPNICA", s.okapnica),
      elektroPrihvatnik: false,
      automat: false,
      podstok: false,
      prosirenjeL: false,
      prosirenjeD: false,
      spojL: false,
      spojD: false,
      napomena: "",
    },
  };
}

async function proracunaj(stavke: JavnaStavka[]) {
  const firma = await db.firma.findUniqueOrThrow({ where: { id: 1 } });
  if (!firma.kalkulatorAktivan) throw new Error("Kalkulator trenutno nije dostupan.");
  if (!Array.isArray(stavke) || stavke.length === 0) throw new Error("Dodajte bar jednu stavku.");
  if (stavke.length > MAX_STAVKI) throw new Error(`Najviše ${MAX_STAVKI} stavki po upitu.`);
  const k = await ucitajKontekst();
  const ociscene = stavke.map((s) => cisti(k, s, firma.marza));
  const rez = ociscene.map((o) => ({ o, r: izracunaj(k, o.ulaz) }));
  const z = zbir(k, rez.map(({ o, r }) => ({ r, kolicina: o.ulaz.kolicina })), { bezPdv: false, montazaUCenu: false, bezMontaze: false });
  return { firma, k, rez, z };
}

export async function izracunajJavno(stavke: JavnaStavka[]): Promise<JavniRezultat> {
  const { k, rez, z } = await proracunaj(stavke);
  const pdv = 1 + k.pdvStopa / 100;
  return {
    stavke: rez.map(({ o, r }) => {
      const greska = o.greska ?? r.greska;
      const cena = greska ? 0 : r2(r.cenaKom * pdv);
      return { cenaKomSaPdv: cena, ukupnoSaPdv: r2(cena * o.ulaz.kolicina), greska };
    }),
    ukupnoSaPdv: z.ukupnoSaPdv,
    montaza: z.montaza,
    ukupno: z.ukupnoZaNaplatu,
  };
}

export type Kontakt = { ime: string; telefon: string; email: string; adresa: string; napomena: string; website?: string };

/** Šalje upit: pravi klijenta i ponudu u statusu Nacrt sa oznakom „sa sajta“. */
export async function posaljiUpit(kontakt: Kontakt, stavke: JavnaStavka[]): Promise<{ ok: true; poruka: string }> {
  // zamka za botove: skriveno polje koje ljudi ne popunjavaju
  if (kontakt.website) return { ok: true, poruka: "Hvala!" };

  const ime = kontakt.ime?.trim().slice(0, 120) ?? "";
  const telefon = kontakt.telefon?.trim().slice(0, 40) ?? "";
  const email = kontakt.email?.trim().slice(0, 120) ?? "";
  if (!ime) throw new Error("Unesite ime i prezime.");
  if (!telefon && !email) throw new Error("Unesite telefon ili email da bismo vas kontaktirali.");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Email adresa nije ispravna.");

  const { firma, rez, z } = await proracunaj(stavke);
  const losa = rez.find(({ o, r }) => o.greska || r.greska);
  if (losa) throw new Error(losa.o.greska ?? losa.r.greska);

  const god = new Date().getFullYear();
  const rok = new Date();
  rok.setDate(rok.getDate() + 15);

  await db.$transaction(async (tx) => {
    const posl = await tx.ponuda.findFirst({ where: { broj: { startsWith: `P-${god}-` } }, orderBy: { broj: "desc" } });
    const broj = `P-${god}-${String(posl ? Number(posl.broj.split("-")[2]) + 1 : 1).padStart(4, "0")}`;
    const klijent = await tx.klijent.create({ data: { naziv: ime, telefon, email, adresa: kontakt.adresa?.trim().slice(0, 200) ?? "" } });
    await tx.ponuda.create({
      data: {
        broj,
        klijentId: klijent.id,
        status: "NACRT",
        izvor: "SAJT",
        pregledano: false,
        napomenaKupca: kontakt.napomena?.trim().slice(0, 2000) ?? "",
        rokIsporuke: rok,
        ukupnoBezPdv: z.ukupnoBezPdv,
        pdv: z.pdv,
        montaza: z.montaza,
        ukupnoZaNaplatu: z.ukupnoZaNaplatu,
        trosakMaterijala: z.trosakMaterijala,
        stavke: {
          create: rez.map(({ o, r }, i) => ({
            ...o.ulaz,
            redosled: i,
            cenaKom: r.cenaKom,
            trosakKom: r.trosakKom,
          })),
        },
      },
    });
  });

  revalidatePath("/ponude");
  revalidatePath("/");
  return { ok: true, poruka: firma.kalkulatorPoruka };
}
