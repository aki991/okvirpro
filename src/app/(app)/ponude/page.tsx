import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/PageHeader";
import { ListaPonuda } from "./ListaPonuda";

export const dynamic = "force-dynamic";

export default async function Ponude() {
  const ponude = await db.ponuda.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, broj: true, status: true, izvor: true, pregledano: true, ukupnoZaNaplatu: true, createdAt: true, klijent: { select: { naziv: true } } },
  });
  return (
    <>
      <PageHeader
        naslov="Ponude"
        opis="Pregled i upravljanje ponudama"
        akcije={
          <Link href="/ponude/nova" className="btn-primary">
            <Plus size={16} /> Kreiraj ponudu
          </Link>
        }
      />
      <div className="p-4 sm:p-6 lg:p-8">
        <ListaPonuda ponude={ponude.map((p) => ({ ...p, kupac: p.klijent.naziv }))} />
      </div>
    </>
  );
}
