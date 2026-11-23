import { db } from "@/lib/db";
import type { Cvor } from "@/lib/modeli-katalog";
import { KatalogModela } from "./KatalogModela";

export const dynamic = "force-dynamic";

export default async function Modeli() {
  const modeli = await db.model.findMany({ orderBy: [{ redosled: "asc" }, { id: "asc" }] });
  return (
    <KatalogModela
      modeli={modeli.map((m) => ({
        id: m.id,
        sifra: m.sifra,
        naziv: m.naziv,
        kategorija: m.kategorija,
        korisnicki: m.korisnicki,
        definicija: JSON.parse(m.definicija) as Cvor,
      }))}
    />
  );
}
