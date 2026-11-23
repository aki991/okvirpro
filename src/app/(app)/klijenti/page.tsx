import { db } from "@/lib/db";
import { ListaKlijenata } from "./ListaKlijenata";

export const dynamic = "force-dynamic";

export default async function Klijenti() {
  const klijenti = await db.klijent.findMany({
    orderBy: { naziv: "asc" },
    include: { ponude: { select: { id: true, broj: true, status: true, ukupnoZaNaplatu: true, createdAt: true }, orderBy: { createdAt: "desc" } } },
  });
  return <ListaKlijenata klijenti={klijenti} />;
}
