import { db } from "@/lib/db";
import { OkovForma } from "./OkovForma";

export const dynamic = "force-dynamic";

export default async function Okov() {
  const [firma, stavke] = await Promise.all([
    db.firma.findUniqueOrThrow({ where: { id: 1 }, select: { okovMetoda: true, okovPoM2: true } }),
    db.okovStavka.findMany({ orderBy: { redosled: "asc" } }),
  ]);
  return <OkovForma metoda={firma.okovMetoda} poM2={firma.okovPoM2} stavke={stavke} />;
}
