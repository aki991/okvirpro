import { db } from "@/lib/db";
import { PodesavanjaForma } from "./PodesavanjaForma";

export const dynamic = "force-dynamic";

export default async function Podesavanja() {
  const [firma, cenovnik, boje] = await Promise.all([
    db.firma.findUniqueOrThrow({ where: { id: 1 } }),
    db.cenovnikStavka.findMany({ orderBy: [{ redosled: "asc" }, { id: "asc" }] }),
    db.bojaProfila.findMany({ orderBy: [{ redosled: "asc" }, { id: "asc" }] }),
  ]);
  return <PodesavanjaForma firma={firma} cenovnik={cenovnik} boje={boje} />;
}
