"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Info } from "lucide-react";
import type { Presek } from "@/lib/profili-3d";
import { PresekSvg } from "./PresekSvg";

// three.js radi samo u pretraživaču – učitava se tek na klijentu
const Profil3D = dynamic(() => import("./Profil3D").then((m) => m.Profil3D), {
  ssr: false,
  loading: () => <div className="card flex h-[480px] items-center justify-center text-sm text-muted sm:h-[600px]">Učitavam 3D model…</div>,
});

const KRATKO: Record<string, string> = { "BE92-RAM": "Ram", "BE92-KRILO": "Krilo", "BE92-LAJSNA": "Lajsna", "BE92-PRECKA": "Prečka" };

export function ProfilPrikaz({ profili }: { profili: Presek[] }) {
  const [izabran, setIzabran] = useState(0);
  const p = profili[izabran];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold">
            {p.naziv} <span className="font-mono text-sm font-semibold text-muted">art. {p.artikal}</span>
          </h2>
          <p className="text-sm text-muted">{p.opis}</p>
        </div>
        <div className="inline-flex rounded-lg border border-line bg-surface p-1" role="tablist">
          {profili.map((x, i) => (
            <button
              key={x.sifra}
              type="button"
              role="tab"
              aria-selected={i === izabran}
              onClick={() => setIzabran(i)}
              className={`rounded-md px-4 py-1.5 text-sm font-semibold transition ${i === izabran ? "bg-brand text-white" : "text-muted hover:text-foreground"}`}
            >
              {KRATKO[x.sifra] ?? x.sifra}
            </button>
          ))}
        </div>
      </div>

      <Profil3D p={p} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="card p-5">
          <h3 className="font-bold">Poprečni presek (mm)</h3>
          <p className="mb-3 text-sm text-muted">
            Brojevi označavaju komore. Crno su EPDM zaptivke{p.celik ? ", crveno čelično ojačanje (kao u katalogu)" : ""}.
          </p>
          <div className="mx-auto max-w-2xl">
            <PresekSvg p={p} />
          </div>
        </section>

        <section className="space-y-4">
          <div className="card p-5">
            <h3 className="mb-2 font-bold">Tehnički podaci</h3>
            <dl className="space-y-1.5 text-sm">
              {p.kote.map((k) => (
                <div key={k.naziv} className="flex justify-between gap-3 border-b border-line/60 pb-1.5 last:border-0">
                  <dt className="text-muted">{k.naziv}</dt>
                  <dd className="text-right font-semibold">{k.vrednost}</dd>
                </div>
              ))}
            </dl>
            <h3 className="mb-1 mt-4 font-bold">Komore</h3>
            <ol className="space-y-0.5 text-sm text-muted">
              {p.komore.map((k) => <li key={k.naziv}>{k.naziv}</li>)}
            </ol>
            {p.zaptivke.length > 0 && (
              <>
                <h3 className="mb-1 mt-4 font-bold">Zaptivke</h3>
                <ul className="space-y-0.5 text-sm text-muted">
                  {p.zaptivke.map((z) => <li key={z.naziv}>{z.naziv}</li>)}
                </ul>
              </>
            )}
          </div>
          <div className="card flex gap-3 bg-accent-soft/60 p-4 text-xs leading-relaxed">
            <Info size={16} className="mt-0.5 shrink-0 text-accent" />
            <p>
              Preseci su nacrtani po katalogu Lyctum „PVC profili za prozore i vrata“ (Salamander bluEvolution 92, str. 35–37): spoljne kote i oblik su iz
              crteža u katalogu, a unutrašnje komore su očitane sa crteža (±1 mm). Za tačnost u desetinu milimetra potreban je DXF od proizvođača.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
