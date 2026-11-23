"use client";

import { X } from "lucide-react";
import type { Kontekst } from "@/lib/proracun";
import { ModelCrtez } from "@/components/ModelCrtez";

export function ModelBirac({
  modeli,
  kategorija,
  izabran,
  onIzaberi,
  onZatvori,
}: {
  modeli: Kontekst["modeli"];
  kategorija: "PROZOR" | "VRATA";
  izabran: string | null;
  onIzaberi: (sifra: string) => void;
  onZatvori: () => void;
}) {
  const lista = modeli.filter((m) => m.kategorija === kategorija);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onZatvori}>
      <div className="card flex max-h-[88vh] w-full max-w-5xl flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-lg font-bold">Katalog modela – {kategorija === "VRATA" ? "vrata" : "prozori"}</h2>
          <button type="button" onClick={onZatvori} className="rounded p-1 hover:bg-background" aria-label="Zatvori">
            <X size={18} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 overflow-y-auto p-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {lista.map((m) => (
            <button
              key={m.sifra}
              type="button"
              onClick={() => {
                onIzaberi(m.sifra);
                onZatvori();
              }}
              className={`flex flex-col items-center rounded-lg border p-3 text-center transition hover:border-brand hover:bg-brand-soft/40 ${izabran === m.sifra ? "border-brand bg-brand-soft/50 ring-2 ring-brand/20" : "border-line"}`}
            >
              <div className="flex aspect-square w-full items-center justify-center p-2">
                <ModelCrtez definicija={m.definicija} sirina={kategorija === "VRATA" ? 1000 : 1200} visina={kategorija === "VRATA" ? 2100 : 1400} className="max-h-full max-w-full" />
              </div>
              <span className="mt-2 line-clamp-2 text-xs font-semibold leading-tight">{m.naziv}</span>
              <span className="font-mono text-[10px] text-muted">{m.sifra}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
