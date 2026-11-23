import type { PonudaStavka } from "@prisma/client";
import type { StavkaUlaz, Vrsta } from "./proracun";

/** Pretvara sačuvanu stavku ponude u ulaz za motor proračuna. */
export function izBaze(s: PonudaStavka): StavkaUlaz {
  return {
    vrsta: s.vrsta as Vrsta,
    sirina: s.sirina,
    visina: s.visina,
    kolicina: s.kolicina,
    sistemId: s.sistemId,
    staklo: s.staklo,
    materijal: s.materijal,
    marza: s.marza,
    rucnaCena: s.rucnaCena,
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
  };
}

export const profilnaVrsta = (v: string) => v === "PROZOR" || v === "VRATA";
