"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Building2, ChevronDown, Mail, MapPin, Pencil, Phone, Plus, Search, Trash2, User } from "lucide-react";
import type { Klijent } from "@prisma/client";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { obrisiKlijenta } from "@/app/actions/klijenti";
import { datum, eur } from "@/lib/format";
import { KlijentModal, prazanKlijent } from "./KlijentForma";

type PonudaKratko = { id: number; broj: string; status: string; ukupnoZaNaplatu: number; createdAt: Date };

export function ListaKlijenata({ klijenti }: { klijenti: (Klijent & { ponude: PonudaKratko[] })[] }) {
  const [pretraga, setPretraga] = useState("");
  const [modal, setModal] = useState<{ id: number | null; k: typeof prazanKlijent } | null>(null);
  const [otvoren, setOtvoren] = useState<number | null>(null);
  const [, start] = useTransition();

  const lista = useMemo(() => {
    const q = pretraga.trim().toLowerCase();
    if (!q) return klijenti;
    return klijenti.filter((k) => [k.naziv, k.adresa, k.email, k.telefon, k.pib].some((x) => x.toLowerCase().includes(q)));
  }, [klijenti, pretraga]);

  const obrisi = (k: Klijent) => {
    if (!confirm(`Obrisati klijenta „${k.naziv}“?`)) return;
    start(async () => {
      try {
        await obrisiKlijenta(k.id);
      } catch (e) {
        alert(e instanceof Error ? e.message : "Brisanje nije uspelo.");
      }
    });
  };

  return (
    <>
      <PageHeader
        naslov="Klijenti"
        opis={`${klijenti.length} u bazi`}
        akcije={
          <button type="button" className="btn-primary" onClick={() => setModal({ id: null, k: prazanKlijent })}>
            <Plus size={16} /> Dodaj klijenta
          </button>
        }
      />
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="relative mb-4 max-w-md">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input pl-9" placeholder="Pretraga po imenu, adresi, telefonu, PIB-u…" value={pretraga} onChange={(e) => setPretraga(e.target.value)} />
        </div>

        {lista.length === 0 ? (
          <div className="card px-6 py-16 text-center text-sm text-muted">
            {klijenti.length ? "Nema rezultata pretrage." : "Još nema klijenata. Dodaj prvog ili ga unesi direktno u novoj ponudi."}
          </div>
        ) : (
          <div className="card divide-y divide-line">
            {lista.map((k) => (
              <div key={k.id}>
                <div className="flex flex-wrap items-center gap-4 px-5 py-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                    {k.tipLica === "PRAVNO" ? <Building2 size={18} /> : <User size={18} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      {k.naziv}
                      {k.pib && <span className="ml-2 text-xs font-normal text-muted">PIB {k.pib}</span>}
                    </p>
                    <p className="mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-muted">
                      {k.adresa && <span className="flex items-center gap-1"><MapPin size={13} />{k.adresa}</span>}
                      <span className="flex items-center gap-1"><Mail size={13} />{k.email || "Nema email"}</span>
                      {k.telefon && <span className="flex items-center gap-1"><Phone size={13} />{k.telefon}</span>}
                    </p>
                  </div>
                  <button type="button" className="btn-secondary !px-3 !py-1.5" onClick={() => setOtvoren(otvoren === k.id ? null : k.id)}>
                    Ponude ({k.ponude.length})
                    <ChevronDown size={14} className={`transition ${otvoren === k.id ? "rotate-180" : ""}`} />
                  </button>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-muted hover:bg-background hover:text-brand"
                    onClick={() => setModal({ id: k.id, k: { naziv: k.naziv, tipLica: k.tipLica, adresa: k.adresa, email: k.email, telefon: k.telefon, pib: k.pib, maticniBroj: k.maticniBroj } })}
                    aria-label="Uredi klijenta"
                  >
                    <Pencil size={16} />
                  </button>
                  <button type="button" className="rounded-lg p-2 text-muted hover:bg-background hover:text-danger" onClick={() => obrisi(k)} aria-label="Obriši klijenta">
                    <Trash2 size={16} />
                  </button>
                </div>
                {otvoren === k.id && (
                  <div className="bg-background/60 px-5 py-3 pl-[76px]">
                    {k.ponude.length === 0 ? (
                      <p className="text-sm text-muted">
                        Nema ponuda. <Link href={`/ponude/nova?klijent=${k.id}`} className="font-semibold text-brand">Napravi ponudu →</Link>
                      </p>
                    ) : (
                      <table className="w-full text-sm">
                        <tbody>
                          {k.ponude.map((p) => (
                            <tr key={p.id} className="border-b border-line/60 last:border-0">
                              <td className="py-1.5">
                                <Link href={`/ponude/${p.id}`} className="font-mono font-semibold text-brand hover:underline">{p.broj}</Link>
                              </td>
                              <td className="py-1.5 text-muted">{datum(p.createdAt)}</td>
                              <td className="py-1.5"><StatusBadge status={p.status} /></td>
                              <td className="py-1.5 text-right font-semibold">{eur(p.ukupnoZaNaplatu)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && <KlijentModal id={modal.id} pocetno={modal.k} onZatvori={() => setModal(null)} />}
    </>
  );
}
