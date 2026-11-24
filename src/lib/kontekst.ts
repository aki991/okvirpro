import "server-only";
import { db } from "./db";
import type { Kontekst } from "./proracun";
import type { Cvor } from "./modeli-katalog";

/** Učitava sve cenovnike potrebne za proračun ponude. */
export async function ucitajKontekst(): Promise<Kontekst> {
  const [firma, sistemi, cenovnik, okovSistemi, modeli, paneli, boje] = await Promise.all([
    db.firma.findUniqueOrThrow({ where: { id: 1 } }),
    db.profilSistem.findMany({
      orderBy: [{ redosled: "asc" }, { id: "asc" }],
      include: { stavke: { orderBy: { redosled: "asc" } }, pribor: { orderBy: [{ redosled: "asc" }, { id: "asc" }] } },
    }),
    db.cenovnikStavka.findMany({ orderBy: [{ redosled: "asc" }, { id: "asc" }] }),
    db.okovSistem.findMany({ orderBy: [{ redosled: "asc" }, { id: "asc" }], include: { stavke: { orderBy: { redosled: "asc" } } } }),
    db.model.findMany({ orderBy: [{ redosled: "asc" }, { id: "asc" }] }),
    db.panel.findMany({ orderBy: [{ redosled: "asc" }, { id: "asc" }] }),
    db.bojaProfila.findMany({ orderBy: [{ redosled: "asc" }, { id: "asc" }] }),
  ]);
  const os = okovSistemi.map((o) => ({
    id: o.id,
    naziv: o.naziv,
    metoda: o.metoda,
    poM2: o.poM2,
    stavke: o.stavke.map((x) => ({ kljuc: x.kljuc, grupa: x.grupa, naziv: x.naziv, cena: x.cena, poMetru: x.poMetru })),
  }));
  return {
    sistemi: sistemi.map((s) => ({
      id: s.id,
      naziv: s.naziv,
      tip: s.tip,
      stavke: s.stavke.map((p) => ({
        kljuc: p.kljuc, naziv: p.naziv, duzinaSipke: p.duzinaSipke, unutrasnjaVisina: p.unutrasnjaVisina,
        sirinaOdbitak: p.sirinaOdbitak, cena: p.cena, poKomadu: p.poKomadu,
      })),
      okovSistemId: s.okovSistemId,
      pribor: s.pribor.map((p) => ({ naziv: p.naziv, osnova: p.osnova, faktor: p.faktor, cena: p.cena })),
    })),
    cenovnik: cenovnik.map((c) => ({ kategorija: c.kategorija, naziv: c.naziv, cena: c.cena })),
    okovSistemi: os,
    // rezervno (ako profil nema okovni sistem): prvi okovni sistem
    okov: os[0]?.stavke ?? [],
    okovMetoda: os[0]?.metoda ?? firma.okovMetoda,
    okovPoM2: os[0]?.poM2 ?? firma.okovPoM2,
    modeli: modeli.map((m) => ({ sifra: m.sifra, naziv: m.naziv, kategorija: m.kategorija, definicija: JSON.parse(m.definicija) as Cvor })),
    paneli: paneli.map((p) => ({ sifra: p.sifra, naziv: p.naziv, cena: p.cena })),
    boje: boje.map((b) => ({ sifra: b.sifra, naziv: b.naziv, hex: b.hex, doplata: b.doplata })),
    pdvStopa: firma.pdvStopa,
    montazaPoM2: firma.montazaPoM2,
    marza: firma.marza,
  };
}
