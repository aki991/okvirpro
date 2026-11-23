import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { ListaDokumenata } from "@/components/ListaDokumenata";
import { potvrdjenePonude } from "@/lib/proizvodnja";
import { PORUDZBENICE, uPorudzbenici, type VrstaPorudzbenice } from "../vrste";

export const dynamic = "force-dynamic";

export default async function ListaPorudzbenica({ params }: { params: Promise<{ vrsta: string }> }) {
  const { vrsta } = await params;
  const def = PORUDZBENICE[vrsta as VrstaPorudzbenice];
  if (!def) notFound();
  const ponude = (await potvrdjenePonude()).filter((p) => p.stavke.some((s) => uPorudzbenici(vrsta as VrstaPorudzbenice, s)));

  return (
    <>
      <PageHeader naslov={`Porudžbenice: ${def.naslov}`} opis="Specifikacije za dobavljače po potvrđenim ponudama" />
      <div className="p-4 sm:p-6 lg:p-8">
        <ListaDokumenata
          redovi={ponude.map((p) => ({ id: p.id, broj: p.broj, kupac: p.klijent.naziv, adresa: "", rok: p.rokIsporuke }))}
          naslov={(b) => `${def.dokument} br. ${b}`}
          href={(id) => `/porudzbenice/${vrsta}/${id}`}
          akcija="Otvori specifikaciju"
          prazno="Nema potvrđenih ponuda sa stavkama ove vrste."
        />
      </div>
    </>
  );
}
