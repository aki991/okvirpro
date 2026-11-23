import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ucitajKontekst } from "@/lib/kontekst";
import { PageHeader } from "@/components/PageHeader";
import type { Vrsta } from "@/lib/proracun";
import { PonudaEditor } from "../../editor/PonudaEditor";
import type { StavkaForma } from "../../editor/tipovi";

export const dynamic = "force-dynamic";

export default async function IzmeniPonudu({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ponuda = await db.ponuda.findUnique({ where: { id: Number(id) }, include: { stavke: { orderBy: { redosled: "asc" } } } });
  if (!ponuda) notFound();

  const [k, klijenti] = await Promise.all([
    ucitajKontekst(),
    db.klijent.findMany({ orderBy: { naziv: "asc" }, select: { id: true, naziv: true, adresa: true, telefon: true } }),
  ]);

  const stavke: StavkaForma[] = ponuda.stavke.map((s) => ({
    kljuc: `db${s.id}`,
    vrsta: s.vrsta as Vrsta,
    sirina: String(s.sirina),
    visina: String(s.visina),
    kolicina: String(s.kolicina),
    sistemId: s.sistemId,
    staklo: s.staklo,
    materijal: s.materijal,
    marza: String(s.marza),
    rucnaCena: s.rucnaCena === null ? "" : String(s.rucnaCena),
    rucno: s.rucnaCena !== null,
    modelSifra: s.modelSifra,
    panelSifra: s.panelSifra,
    rukohvat: s.rukohvat,
    boja: s.boja,
    roletna: s.roletna,
    roletnaVisina: s.roletnaVisina,
    roletnaPrepust: s.roletnaPrepust,
    roletnaKais: s.roletnaKais,
    komarnik: s.komarnik,
    daska: s.daska,
    okapnica: s.okapnica,
    elektroPrihvatnik: s.elektroPrihvatnik,
    automat: s.automat,
    podstok: s.podstok,
    prosirenjeL: s.prosirenjeL,
    prosirenjeD: s.prosirenjeD,
    podstokMm: s.podstokMm,
    prosirenjeLMm: s.prosirenjeLMm,
    prosirenjeDMm: s.prosirenjeDMm,
    spojL: s.spojL,
    spojD: s.spojD,
    napomena: s.napomena,
    otvorena: false,
  }));

  return (
    <>
      <PageHeader naslov={`Izmena ponude ${ponuda.broj}`} opis="Cene se preračunavaju po trenutnim cenovnicima" />
      <PonudaEditor
        k={k}
        klijenti={klijenti}
        pocetno={{
          id: ponuda.id,
          broj: ponuda.broj,
          klijentId: ponuda.klijentId,
          rokIsporuke: ponuda.rokIsporuke ? ponuda.rokIsporuke.toISOString().slice(0, 10) : "",
          opcije: { bezPdv: ponuda.bezPdv, montazaUCenu: ponuda.montazaUCenu, bezMontaze: ponuda.bezMontaze },
          stavke,
        }}
      />
    </>
  );
}
