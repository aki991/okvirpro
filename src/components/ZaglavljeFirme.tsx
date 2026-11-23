import type { Firma } from "@prisma/client";
import { LogoMark } from "./Logo";

/** Zaglavlje dokumenata (ponuda, ugovor, račun). */
export function ZaglavljeFirme({ firma, children }: { firma: Firma; children?: React.ReactNode }) {
  const red = (l: string, v: string) => v && (
    <p>
      <span className="text-muted">{l}:</span> {v}
    </p>
  );
  return (
    <div className="flex flex-col-reverse gap-4 border-b-2 border-brand pb-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="flex gap-4">
        {firma.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={firma.logo} alt="" className="h-16 w-16 object-contain" />
        ) : (
          <LogoMark size={56} />
        )}
        <div>
          <p className="text-xl font-extrabold">{firma.naziv || "Naziv firme"}</p>
          <p className="text-sm text-muted">{[firma.adresa, firma.mesto].filter(Boolean).join(", ")}</p>
          <div className="mt-2 grid grid-cols-2 gap-x-6 text-[11px] leading-relaxed">
            {red("PIB", firma.pib)}
            {red("Matični broj", firma.maticniBroj)}
            {red("Email", firma.email)}
            {red("Telefon", firma.telefon)}
            {red("Web", firma.web)}
            {red("Račun", firma.tekuciRacun)}
          </div>
        </div>
      </div>
      <div className="sm:text-right">{children}</div>
    </div>
  );
}
