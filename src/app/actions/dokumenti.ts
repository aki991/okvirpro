"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function sacuvajAvans(id: number, avans: number | null, datum: string | null) {
  if (avans !== null && avans < 0) throw new Error("Avans ne može biti negativan.");
  await db.ponuda.update({ where: { id }, data: { avans, avansDatum: datum ? new Date(datum) : new Date() } });
  revalidatePath("/avansi");
  revalidatePath(`/avansi/${id}`);
}

export async function sacuvajRacun(id: number, p: { bezPdv: boolean; datum: string; valutaDana: number }) {
  await db.ponuda.update({
    where: { id },
    data: { racunBezPdv: p.bezPdv, racunDatum: new Date(p.datum), racunValutaDana: Math.max(0, Math.round(p.valutaDana)) },
  });
  revalidatePath(`/racuni/${id}`);
  revalidatePath("/racuni");
}

// ───────────── Reklamacije ─────────────
async function sledeciBrojReklamacije() {
  const god = new Date().getFullYear();
  const posl = await db.reklamacija.findFirst({ where: { broj: { startsWith: `REK-${god}-` } }, orderBy: { broj: "desc" } });
  const n = posl ? Number(posl.broj.split("-")[2]) + 1 : 1;
  return `REK-${god}-${String(n).padStart(4, "0")}`;
}

export async function novaReklamacija(ponudaId: number, opis: string, datum: string) {
  if (!opis.trim()) throw new Error("Opis reklamacije je obavezan.");
  const r = await db.reklamacija.create({
    data: { broj: await sledeciBrojReklamacije(), ponudaId, opis: opis.trim(), datum: datum ? new Date(datum) : new Date() },
  });
  revalidatePath("/reklamacije");
  return r.id;
}

export async function azurirajReklamaciju(id: number, p: { opis: string; status: string; resenje: string }) {
  await db.reklamacija.update({ where: { id }, data: { opis: p.opis.trim(), status: p.status, resenje: p.resenje } });
  revalidatePath("/reklamacije");
  revalidatePath(`/reklamacije/${id}`);
}

export async function obrisiReklamaciju(id: number) {
  await db.reklamacija.delete({ where: { id } });
  revalidatePath("/reklamacije");
}
