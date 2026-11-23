"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export type KlijentUnos = {
  naziv: string;
  tipLica: string;
  adresa: string;
  email: string;
  telefon: string;
  pib: string;
  maticniBroj: string;
};

export async function sacuvajKlijenta(id: number | null, k: KlijentUnos) {
  if (!k.naziv.trim()) throw new Error("Ime ili naziv firme je obavezno.");
  const data = { ...k, naziv: k.naziv.trim() };
  const rez = id ? await db.klijent.update({ where: { id }, data }) : await db.klijent.create({ data });
  revalidatePath("/klijenti");
  return rez.id;
}

export async function obrisiKlijenta(id: number) {
  const n = await db.ponuda.count({ where: { klijentId: id } });
  if (n > 0) throw new Error(`Klijent ima ${n} ponuda i ne može se obrisati.`);
  await db.klijent.delete({ where: { id } });
  revalidatePath("/klijenti");
}
