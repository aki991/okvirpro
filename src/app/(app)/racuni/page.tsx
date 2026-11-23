import { PageHeader } from "@/components/PageHeader";
import { ListaDokumenata } from "@/components/ListaDokumenata";
import { potvrdjenePonude } from "@/lib/proizvodnja";
import { eur } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Racuni() {
  const ponude = await potvrdjenePonude();
  return (
    <>
      <PageHeader naslov="Računi" opis="Fakture za potvrđene ponude, u dinarima" />
      <div className="p-4 sm:p-6 lg:p-8">
        <ListaDokumenata
          redovi={ponude.map((p) => ({
            id: p.id,
            broj: p.broj,
            kupac: p.klijent.naziv,
            adresa: "",
            rok: null,
            oznaka: <span className="ml-2 text-sm font-normal text-muted">· Iznos: {eur(p.ukupnoZaNaplatu)}</span>,
          }))}
          naslov={(b) => `Račun za nalog: ${b}`}
          href={(id) => `/racuni/${id}`}
          akcija="Otvori račun"
        />
      </div>
    </>
  );
}
