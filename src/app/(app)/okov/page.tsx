import { db } from "@/lib/db";
import { OkovForma } from "./OkovForma";

export const dynamic = "force-dynamic";

export default async function Okov() {
  const sistemi = await db.okovSistem.findMany({
    orderBy: [{ redosled: "asc" }, { id: "asc" }],
    include: {
      stavke: { orderBy: { redosled: "asc" } },
      profilSistemi: { select: { naziv: true, tip: true }, orderBy: [{ redosled: "asc" }, { id: "asc" }] },
    },
  });
  // profili bez dodeljenog okova koriste prvi okovni sistem
  const bezOkova = await db.profilSistem.findMany({ where: { okovSistemId: null }, select: { naziv: true, tip: true } });
  if (sistemi[0]) sistemi[0].profilSistemi.push(...bezOkova);
  return <OkovForma sistemi={sistemi} />;
}
