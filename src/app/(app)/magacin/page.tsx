import { db } from "@/lib/db";
import { MagacinForma } from "./MagacinForma";

export const dynamic = "force-dynamic";

export default async function Magacin() {
  const sistemi = await db.profilSistem.findMany({
    orderBy: [{ redosled: "asc" }, { id: "asc" }],
    include: {
      stavke: {
        where: { poKomadu: false, duzinaSipke: { not: null } },
        orderBy: { redosled: "asc" },
        include: { ostaci: { orderBy: { duzina: "desc" } } },
      },
    },
  });
  return (
    <MagacinForma
      sistemi={sistemi.map((s) => ({
        id: s.id,
        naziv: s.naziv,
        tip: s.tip,
        stavke: s.stavke.map((p) => ({
          id: p.id,
          naziv: p.naziv,
          duzinaSipke: p.duzinaSipke!,
          puneSipke: p.puneSipke,
          ostaci: p.ostaci.map((o) => ({ id: o.id, duzina: o.duzina })),
        })),
      }))}
    />
  );
}
