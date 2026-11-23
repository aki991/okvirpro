import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import { datum } from "@/lib/format";

export type DokumentRed = {
  id: number;
  broj: string;
  kupac: string;
  adresa: string;
  rok: Date | null;
  oznaka?: React.ReactNode;
};

/** Lista dokumenata vezanih za potvrđene ponude (radni nalozi, krojne liste, porudžbenice…). */
export function ListaDokumenata({
  redovi,
  naslov,
  href,
  akcija,
  prazno = "Nema potvrđenih ponuda. Dokumenti se prave automatski kad potvrdiš ponudu.",
}: {
  redovi: DokumentRed[];
  naslov: (broj: string) => string;
  href: (id: number) => string;
  akcija: string;
  prazno?: string;
}) {
  if (redovi.length === 0) return <div className="card px-6 py-16 text-center text-sm text-muted">{prazno}</div>;
  return (
    <div className="space-y-3">
      {redovi.map((r) => (
        <Link key={r.id} href={href(r.id)} className="card group flex items-center gap-4 px-5 py-4 transition hover:border-brand">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
            <FileText size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              {naslov(r.broj)} {r.oznaka}
            </p>
            <p className="text-sm text-muted">
              Kupac: {r.kupac}
              {r.adresa && ` · ${r.adresa}`}
              {r.rok && ` · Rok: ${datum(r.rok)}`}
            </p>
          </div>
          <span className="flex items-center gap-1 text-sm font-semibold text-brand">
            {akcija} <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
          </span>
        </Link>
      ))}
    </div>
  );
}
