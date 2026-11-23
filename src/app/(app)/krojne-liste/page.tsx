import { CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ListaDokumenata } from "@/components/ListaDokumenata";
import { potvrdjenePonude } from "@/lib/proizvodnja";

export const dynamic = "force-dynamic";

export default async function KrojneListe() {
  const ponude = await potvrdjenePonude();
  return (
    <>
      <PageHeader naslov="Krojne liste" opis="Optimizacija sečenja šipki po nalogu" />
      <div className="p-4 sm:p-6 lg:p-8">
        <ListaDokumenata
          redovi={ponude
            .filter((p) => p.stavke.some((s) => s.vrsta === "PROZOR" || s.vrsta === "VRATA"))
            .map((p) => ({
              id: p.id,
              broj: p.broj,
              kupac: p.klijent.naziv,
              adresa: p.klijent.adresa,
              rok: p.rokIsporuke,
              oznaka: p.utrosakProknjizen ? (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 size={12} /> Proknjiženo
                </span>
              ) : null,
            }))}
          naslov={(b) => `Krojna lista br. ${b}`}
          href={(id) => `/krojne-liste/${id}`}
          akcija="Otvori krojnu listu"
        />
      </div>
    </>
  );
}
