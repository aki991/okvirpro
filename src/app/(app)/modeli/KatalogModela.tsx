"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { Cvor } from "@/lib/modeli-katalog";
import { PageHeader } from "@/components/PageHeader";
import { ModelCrtez } from "@/components/ModelCrtez";
import { obrisiModel } from "@/app/actions/sifarnici";
import { NoviModel, type ModelZaIzmenu } from "./NoviModel";

export type ModelPrikaz = {
  id: number;
  sifra: string;
  naziv: string;
  kategorija: string;
  korisnicki: boolean;
  definicija: Cvor;
};

const KARTICE = [
  { k: "PROZOR", n: "Prozori" },
  { k: "VRATA", n: "Vrata" },
  { k: "MOJI", n: "Moji modeli" },
];

export function KatalogModela({ modeli }: { modeli: ModelPrikaz[] }) {
  const [kartica, setKartica] = useState("PROZOR");
  const [editor, setEditor] = useState<ModelZaIzmenu | null | "novi">(null);
  const [, start] = useTransition();

  const lista = modeli.filter((m) => (kartica === "MOJI" ? m.korisnicki : m.kategorija === kartica && !m.korisnicki));

  return (
    <>
      <PageHeader
        naslov="Katalog modela"
        opis="Tipovi prozora i vrata koji se biraju u ponudi"
        akcije={
          <button type="button" className="btn-primary" onClick={() => setEditor("novi")}>
            <Plus size={16} /> Kreiraj novi model
          </button>
        }
      />
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 inline-flex rounded-lg border border-line bg-surface p-1">
          {KARTICE.map((k) => (
            <button
              key={k.k}
              type="button"
              onClick={() => setKartica(k.k)}
              className={`rounded-md px-4 py-1.5 text-sm font-semibold transition ${kartica === k.k ? "bg-brand text-white" : "text-muted hover:text-foreground"}`}
            >
              {k.n}
              <span className="ml-1.5 text-xs opacity-70">
                {modeli.filter((m) => (k.k === "MOJI" ? m.korisnicki : m.kategorija === k.k && !m.korisnicki)).length}
              </span>
            </button>
          ))}
        </div>

        {lista.length === 0 ? (
          <div className="card px-6 py-16 text-center text-sm text-muted">
            {kartica === "MOJI" ? "Još nemaš svoje modele. Klikni „Kreiraj novi model“." : "Nema modela u ovoj kategoriji."}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 2xl:grid-cols-6">
            {lista.map((m) => (
              <div key={m.id} className="card group relative flex flex-col p-4">
                <div className="flex aspect-square items-center justify-center rounded-lg bg-background p-4">
                  <ModelCrtez
                    definicija={m.definicija}
                    sirina={m.kategorija === "VRATA" ? 1000 : 1200}
                    visina={m.kategorija === "VRATA" ? 2100 : 1400}
                    className="max-h-full max-w-full"
                  />
                </div>
                <p className="mt-3 text-sm font-semibold leading-snug">{m.naziv}</p>
                <p className="font-mono text-xs text-muted">{m.sifra}</p>
                {m.korisnicki && (
                  <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                    <button
                      type="button"
                      className="rounded-md bg-white p-1.5 shadow hover:text-brand"
                      onClick={() => setEditor({ sifra: m.sifra, naziv: m.naziv, kategorija: m.kategorija, definicija: m.definicija })}
                      aria-label="Izmeni model"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      className="rounded-md bg-white p-1.5 shadow hover:text-danger"
                      onClick={() => confirm(`Obrisati model ${m.sifra}?`) && start(() => obrisiModel(m.id))}
                      aria-label="Obriši model"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {editor && (
        <NoviModel
          pocetni={editor === "novi" ? null : editor}
          onZatvori={(sacuvano) => {
            setEditor(null);
            if (sacuvano) setKartica("MOJI");
          }}
        />
      )}
    </>
  );
}
