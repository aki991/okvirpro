"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { napraviPlan, ucitajProizvodnju } from "@/lib/proizvodnja";
import { MIN_OSTATAK } from "@/lib/krojenje";

/** Knjiži utrošak krojne liste: skida šipke i ostatke iz magacina, vraća nove ostatke. Jednom po nalogu. */
export async function proknjiziUtrosak(ponudaId: number) {
  const p = await ucitajProizvodnju(ponudaId);
  if (!p) throw new Error("Ponuda ne postoji.");
  if (p.ponuda.utrosakProknjizen) throw new Error("Utrošak je već proknjižen.");
  if (p.ponuda.status === "NACRT") throw new Error("Potvrdi ponudu pre knjiženja utroška.");

  const plan = await napraviPlan(p);
  if (plan.some((x) => x.greska)) throw new Error(plan.find((x) => x.greska)!.greska);

  await db.$transaction(async (tx) => {
    for (const pr of plan) {
      // magacin vodi samo bele profile; profil u boji se poručuje posebno za nalog
      if (pr.bojaSifra) continue;
      if (pr.punihSipki) await tx.profilStavka.update({ where: { id: pr.profilStavkaId }, data: { puneSipke: { decrement: pr.punihSipki } } });
      const iskorisceni = pr.sipke.filter((s) => s.izvor === "OSTATAK").map((s) => s.ostatakId!);
      if (iskorisceni.length) {
        const obrisano = await tx.ostatak.deleteMany({ where: { id: { in: iskorisceni } } });
        if (obrisano.count !== iskorisceni.length) throw new Error("Stanje ostataka se promenilo – osveži stranu i pokušaj ponovo.");
      }
      const novi = pr.sipke.filter((s) => s.ostatak >= MIN_OSTATAK).map((s) => ({ profilStavkaId: pr.profilStavkaId, duzina: Math.round(s.ostatak) }));
      if (novi.length) await tx.ostatak.createMany({ data: novi });
    }
    await tx.ponuda.update({ where: { id: ponudaId }, data: { utrosakProknjizen: true, krojnaLista: JSON.stringify(plan) } });
  });

  revalidatePath("/", "layout");
}

export type MagacinUnos = { profilStavkaId: number; puneSipke: number; ostaci: { id?: number; duzina: number }[] };

/** Ručno ažuriranje stanja magacina. */
export async function sacuvajMagacin(redovi: MagacinUnos[]) {
  await db.$transaction(async (tx) => {
    for (const r of redovi) {
      await tx.profilStavka.update({ where: { id: r.profilStavkaId }, data: { puneSipke: Math.round(r.puneSipke) } });
      const zadrzani = r.ostaci.filter((o) => o.id).map((o) => o.id!);
      await tx.ostatak.deleteMany({ where: { profilStavkaId: r.profilStavkaId, id: { notIn: zadrzani } } });
      const novi = r.ostaci.filter((o) => !o.id && o.duzina > 0);
      if (novi.length) await tx.ostatak.createMany({ data: novi.map((o) => ({ profilStavkaId: r.profilStavkaId, duzina: Math.round(o.duzina) })) });
    }
  });
  revalidatePath("/magacin");
}
