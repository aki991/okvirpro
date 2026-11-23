import { db } from "@/lib/db";
import { ucitajKontekst } from "@/lib/kontekst";
import { PageHeader } from "@/components/PageHeader";
import { PonudaEditor } from "../editor/PonudaEditor";
import { novaStavka } from "../editor/tipovi";

export const dynamic = "force-dynamic";

export default async function NovaPonuda({ searchParams }: { searchParams: Promise<{ klijent?: string }> }) {
  const { klijent } = await searchParams;
  const [k, klijenti] = await Promise.all([
    ucitajKontekst(),
    db.klijent.findMany({ orderBy: { naziv: "asc" }, select: { id: true, naziv: true, adresa: true, telefon: true } }),
  ]);
  const rok = new Date();
  rok.setDate(rok.getDate() + 15);

  return (
    <>
      <PageHeader naslov="Nova ponuda" />
      <PonudaEditor
        k={k}
        klijenti={klijenti}
        pocetno={{
          id: null,
          broj: null,
          klijentId: klijent ? Number(klijent) : null,
          rokIsporuke: rok.toISOString().slice(0, 10),
          opcije: { bezPdv: false, montazaUCenu: false, bezMontaze: false },
          stavke: [
            novaStavka({
              sistemId: k.sistemi[0]?.id ?? null,
              staklo: k.cenovnik.find((c) => c.kategorija === "STAKLO")?.naziv ?? null,
              marza: k.marza,
            }),
          ],
        }}
      />
    </>
  );
}
