"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { sacuvajKlijenta, type KlijentUnos } from "@/app/actions/klijenti";

export const prazanKlijent: KlijentUnos = { naziv: "", tipLica: "FIZICKO", adresa: "", email: "", telefon: "", pib: "", maticniBroj: "" };

/** Polja klijenta – koristi se i u modalu i u formi ponude. */
export function KlijentPolja({ k, set }: { k: KlijentUnos; set: (k: KlijentUnos) => void }) {
  const p = (polje: keyof KlijentUnos) => ({ value: k[polje], onChange: (e: React.ChangeEvent<HTMLInputElement>) => set({ ...k, [polje]: e.target.value }) });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="flex gap-5 sm:col-span-2">
        {[
          ["FIZICKO", "Fizičko lice"],
          ["PRAVNO", "Pravno lice"],
        ].map(([v, n]) => (
          <label key={v} className="flex items-center gap-2 text-sm">
            <input type="radio" checked={k.tipLica === v} onChange={() => set({ ...k, tipLica: v })} className="accent-[var(--brand)]" />
            {n}
          </label>
        ))}
      </div>
      <div className="sm:col-span-2">
        <label className="label">{k.tipLica === "PRAVNO" ? "Naziv firme" : "Ime i prezime"}</label>
        <input className="input" {...p("naziv")} />
      </div>
      {k.tipLica === "PRAVNO" && (
        <>
          <div>
            <label className="label">PIB</label>
            <input className="input" {...p("pib")} />
          </div>
          <div>
            <label className="label">Matični broj</label>
            <input className="input" {...p("maticniBroj")} />
          </div>
        </>
      )}
      <div className="sm:col-span-2">
        <label className="label">Adresa</label>
        <input className="input" {...p("adresa")} />
      </div>
      <div>
        <label className="label">Email</label>
        <input className="input" type="email" {...p("email")} />
      </div>
      <div>
        <label className="label">Telefon</label>
        <input className="input" placeholder="+381…" {...p("telefon")} />
      </div>
    </div>
  );
}

export function KlijentModal({ id, pocetno, onZatvori }: { id: number | null; pocetno: KlijentUnos; onZatvori: () => void }) {
  const [k, setK] = useState(pocetno);
  const [greska, setGreska] = useState("");
  const [radi, setRadi] = useState(false);

  const snimi = async (e: React.FormEvent) => {
    e.preventDefault();
    setRadi(true);
    setGreska("");
    try {
      await sacuvajKlijenta(id, k);
      onZatvori();
    } catch (err) {
      setGreska(err instanceof Error ? err.message : "Čuvanje nije uspelo.");
      setRadi(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onZatvori}>
      <form onSubmit={snimi} className="card w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-lg font-bold">{id ? "Izmena klijenta" : "Novi klijent"}</h2>
          <button type="button" onClick={onZatvori} className="rounded p-1 hover:bg-background" aria-label="Zatvori">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">
          <KlijentPolja k={k} set={setK} />
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-line px-6 py-4">
          {greska && <p className="mr-auto text-sm text-danger">{greska}</p>}
          <button type="button" className="btn-secondary" onClick={onZatvori}>Otkaži</button>
          <button className="btn-primary" disabled={radi}>Sačuvaj</button>
        </div>
      </form>
    </div>
  );
}
