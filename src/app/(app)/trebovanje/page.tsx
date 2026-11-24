import { PageHeader } from "@/components/PageHeader";
import { ListaDokumenata } from "@/components/ListaDokumenata";
import { potvrdjenePonude } from "@/lib/proizvodnja";

export const dynamic = "force-dynamic";

export default async function Trebovanja() {
  const ponude = await potvrdjenePonude();
  return (
    <>
      <PageHeader naslov="Trebovanje" opis="Materijal koji magacin izdaje proizvodnji, po potvrđenim ponudama" />
      <div className="p-4 sm:p-6 lg:p-8">
        <ListaDokumenata
          redovi={ponude.map((p) => ({
            id: p.id,
            broj: p.broj,
            kupac: p.klijent.naziv,
            adresa: p.klijent.adresa,
            rok: p.rokIsporuke,
            oznaka: <span className="ml-1 text-xs font-normal text-muted">({p.stavke.reduce((a, s) => a + s.kolicina, 0)} kom)</span>,
          }))}
          naslov={(b) => `Trebovanje za nalog ${b}`}
          href={(id) => `/trebovanje/${id}`}
          akcija="Otvori trebovanje"
        />
      </div>
    </>
  );
}
