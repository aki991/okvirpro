import { Hammer } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

// Privremena strana za module koji još nisu napravljeni.
export default async function UIzradi({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const naziv = slug[slug.length - 1].replace(/-/g, " ");
  return (
    <>
      <PageHeader naslov={naziv.charAt(0).toUpperCase() + naziv.slice(1)} />
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Hammer className="text-accent" size={32} />
          <p className="font-semibold">Modul je u izradi</p>
          <p className="max-w-md text-sm text-muted">Pogledaj redosled u docs/SPECIFIKACIJA.md.</p>
        </div>
      </div>
    </>
  );
}
