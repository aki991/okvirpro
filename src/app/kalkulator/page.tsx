import type { Metadata } from "next";
import { db } from "@/lib/db";
import type { Cvor } from "@/lib/modeli-katalog";
import { Kalkulator } from "./Kalkulator";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const f = await db.firma.findUnique({ where: { id: 1 }, select: { naziv: true } });
  return { title: `Kalkulator cene – ${f?.naziv || "PVC i ALU stolarija"}`, description: "Izračunajte okvirnu cenu prozora i vrata i pošaljite upit." };
}

// Javna stranica: šalju se samo podaci potrebni za izbor (nazivi, modeli),
// nikad nabavne cene, marža ni podaci drugih kupaca.
export default async function JavniKalkulator() {
  const [firma, sistemi, cenovnik, modeli, paneli, boje] = await Promise.all([
    db.firma.findUniqueOrThrow({ where: { id: 1 } }),
    db.profilSistem.findMany({ orderBy: [{ redosled: "asc" }, { id: "asc" }], select: { id: true, naziv: true, tip: true } }),
    db.cenovnikStavka.findMany({ where: { kategorija: { in: ["STAKLO", "ROLETNA", "KOMARNIK", "DASKA", "OKAPNICA"] } }, orderBy: [{ redosled: "asc" }, { id: "asc" }], select: { kategorija: true, naziv: true } }),
    db.model.findMany({ orderBy: [{ redosled: "asc" }, { id: "asc" }], select: { sifra: true, naziv: true, kategorija: true, definicija: true } }),
    db.panel.findMany({ orderBy: [{ redosled: "asc" }, { id: "asc" }], select: { sifra: true, naziv: true, cena: true, slika: true } }),
    // bez procenta doplate – kupac vidi samo boju i krajnju cenu
    db.bojaProfila.findMany({ orderBy: [{ redosled: "asc" }, { id: "asc" }], select: { sifra: true, naziv: true, hex: true } }),
  ]);

  if (!firma.kalkulatorAktivan)
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div>
          <p className="text-lg font-bold">Kalkulator trenutno nije dostupan</p>
          <p className="mt-1 text-sm text-muted">Za ponudu nas kontaktirajte{firma.telefon ? ` na ${firma.telefon}` : ""}{firma.email ? ` ili ${firma.email}` : ""}.</p>
        </div>
      </div>
    );

  return (
    <Kalkulator
      firma={{ naziv: firma.naziv, logo: firma.logo, telefon: firma.telefon, email: firma.email, montazaPoM2: firma.montazaPoM2, pdvStopa: firma.pdvStopa }}
      sistemi={sistemi}
      stakla={cenovnik.filter((c) => c.kategorija === "STAKLO").map((c) => c.naziv)}
      roletne={cenovnik.filter((c) => c.kategorija === "ROLETNA").map((c) => c.naziv)}
      komarnici={cenovnik.filter((c) => c.kategorija === "KOMARNIK").map((c) => c.naziv)}
      daske={cenovnik.filter((c) => c.kategorija === "DASKA").map((c) => c.naziv)}
      okapnice={cenovnik.filter((c) => c.kategorija === "OKAPNICA").map((c) => c.naziv)}
      modeli={modeli.map((m) => ({ ...m, definicija: JSON.parse(m.definicija) as Cvor }))}
      paneli={paneli}
      boje={boje}
    />
  );
}
