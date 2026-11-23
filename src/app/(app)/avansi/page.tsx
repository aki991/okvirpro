import { PageHeader } from "@/components/PageHeader";
import { ListaDokumenata } from "@/components/ListaDokumenata";
import { potvrdjenePonude } from "@/lib/proizvodnja";
import { eur } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Avansi() {
  const ponude = await potvrdjenePonude();
  const ukupnoAvansa = ponude.reduce((a, p) => a + (p.avans ?? 0), 0);
  return (
    <>
      <PageHeader naslov="Avansni ugovori" opis={`Ugovori o kapari · ukupno primljeno ${eur(ukupnoAvansa)}`} />
      <div className="p-4 sm:p-6 lg:p-8">
        <ListaDokumenata
          redovi={ponude.map((p) => ({
            id: p.id,
            broj: p.broj,
            kupac: p.klijent.naziv,
            adresa: "",
            rok: null,
            oznaka: p.avans ? (
              <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">Avans: {eur(p.avans)}</span>
            ) : (
              <span className="ml-2 text-xs font-normal text-muted">bez avansa</span>
            ),
          }))}
          naslov={(b) => `Ugovor o avansu: ${b}`}
          href={(id) => `/avansi/${id}`}
          akcija="Otvori ugovor"
        />
      </div>
    </>
  );
}
