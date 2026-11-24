"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpDown, CheckCircle2, Copy, Eye, FileSignature, Globe, MoreHorizontal, Pencil, Receipt, Search, Trash2, Undo2 } from "lucide-react";
import { StatusBadge, STATUSI } from "@/components/StatusBadge";
import { kopirajPonudu, obrisiPonudu, promeniStatus } from "@/app/actions/ponude";
import { datum, eur } from "@/lib/format";

type Red = { id: number; broj: string; kupac: string; status: string; izvor: string; pregledano: boolean; ukupnoZaNaplatu: number; createdAt: Date };

const PO_STRANI = 15;

function Meni({ p, onZatvori }: { p: Red; onZatvori: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [, start] = useTransition();

  useEffect(() => {
    const klik = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && onZatvori();
    document.addEventListener("mousedown", klik);
    return () => document.removeEventListener("mousedown", klik);
  }, [onZatvori]);

  const potvrdjena = p.status !== "NACRT";
  const stavka = "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-background";

  return (
    <div ref={ref} className="absolute right-2 top-10 z-20 w-56 overflow-hidden rounded-lg border border-line bg-white py-1 shadow-lg">
      <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-muted">Akcije</p>
      <Link href={`/ponude/${p.id}`} className={stavka}><Eye size={15} /> Pogledaj detalje</Link>
      <Link href={`/ponude/${p.id}/izmeni`} className={stavka}><Pencil size={15} /> Izmeni ponudu</Link>
      <button type="button" className={stavka} onClick={() => start(() => kopirajPonudu(p.id))}><Copy size={15} /> Kopiraj ponudu</button>
      {potvrdjena ? (
        <button type="button" className={stavka} onClick={() => { start(() => promeniStatus(p.id, "NACRT")); onZatvori(); }}>
          <Undo2 size={15} /> Vrati u nacrt
        </button>
      ) : (
        <button type="button" className={`${stavka} text-success`} onClick={() => { start(() => promeniStatus(p.id, "POTVRDJENO")); onZatvori(); }}>
          <CheckCircle2 size={15} /> Potvrdi ponudu
        </button>
      )}
      {potvrdjena && (
        <>
          <button type="button" className={`${stavka} text-brand`} onClick={() => router.push(`/avansi/${p.id}`)}><FileSignature size={15} /> Ugovor o avansu</button>
          <button type="button" className={`${stavka} text-brand`} onClick={() => router.push(`/racuni/${p.id}`)}><Receipt size={15} /> Račun (faktura)</button>
        </>
      )}
      <div className="my-1 border-t border-line" />
      <button
        type="button"
        className={`${stavka} text-danger`}
        onClick={() => {
          if (!confirm(`Obrisati ponudu ${p.broj}? Ovo se ne može poništiti.`)) return;
          start(async () => {
            try {
              await obrisiPonudu(p.id);
            } catch (e) {
              alert(e instanceof Error ? e.message : "Brisanje nije uspelo.");
            }
          });
          onZatvori();
        }}
      >
        <Trash2 size={15} /> Obriši
      </button>
    </div>
  );
}

export function ListaPonuda({ ponude }: { ponude: Red[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("SVE");
  const [rastuce, setRastuce] = useState(false);
  const [strana, setStrana] = useState(0);
  const [meni, setMeni] = useState<number | null>(null);

  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    const f = ponude.filter((p) => (status === "SVE" || p.status === status) && (!t || p.broj.toLowerCase().includes(t) || p.kupac.toLowerCase().includes(t)));
    return rastuce ? [...f].reverse() : f;
  }, [ponude, q, status, rastuce]);

  const brojStrana = Math.max(1, Math.ceil(lista.length / PO_STRANI));
  const vidljive = lista.slice(strana * PO_STRANI, (strana + 1) * PO_STRANI);

  if (ponude.length === 0)
    return (
      <div className="card px-6 py-16 text-center">
        <p className="font-semibold">Još nema ponuda</p>
        <p className="mt-1 text-sm text-muted">Klikni „Kreiraj ponudu“ da napraviš prvu.</p>
      </div>
    );

  return (
    <div className="card">
      <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input pl-9" placeholder="Broj ponude ili kupac…" value={q} onChange={(e) => { setQ(e.target.value); setStrana(0); }} />
        </div>
        <select className="input w-full sm:w-44" value={status} onChange={(e) => { setStatus(e.target.value); setStrana(0); }}>
          <option value="SVE">Svi statusi</option>
          {Object.entries(STATUSI).map(([k, v]) => <option key={k} value={k}>{v.n}</option>)}
        </select>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
            <th className="px-3 py-3 text-left font-semibold sm:px-5">
              <button type="button" className="flex items-center gap-1" onClick={() => setRastuce((r) => !r)}>
                Broj ponude <ArrowUpDown size={13} />
              </button>
            </th>
            <th className="px-3 py-3 text-left font-semibold">Kupac</th>
            <th className="px-3 py-3 font-semibold">Iznos (EUR)</th>
            <th className="hidden px-3 py-3 font-semibold sm:table-cell">Status</th>
            <th className="hidden px-3 py-3 font-semibold md:table-cell">Kreirano</th>
            <th className="w-12" />
          </tr>
        </thead>
        <tbody>
          {vidljive.map((p) => (
            <tr key={p.id} className="relative border-b border-line/60 last:border-0 hover:bg-background/60">
              <td className="px-5 py-3 text-left">
                <Link href={`/ponude/${p.id}`} className="font-mono font-semibold text-brand hover:underline">{p.broj}</Link>
                {p.izvor === "SAJT" && (
                  <span
                    className={`ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      p.pregledano ? "bg-sky-50 text-sky-700" : "bg-accent text-white"
                    }`}
                  >
                    <Globe size={10} /> {p.pregledano ? "sa sajta" : "novo sa sajta"}
                  </span>
                )}
              </td>
              <td className="px-3 py-3 text-left">{p.kupac}</td>
              <td className="px-3 py-3 font-semibold tabular-nums">{eur(p.ukupnoZaNaplatu)}</td>
              <td className="hidden px-3 py-3 sm:table-cell"><StatusBadge status={p.status} /></td>
              <td className="hidden px-3 py-3 text-muted md:table-cell">{datum(p.createdAt)}</td>
              <td className="relative px-3 py-3">
                <button type="button" className="rounded-md p-1.5 hover:bg-white" onClick={() => setMeni(meni === p.id ? null : p.id)} aria-label="Akcije">
                  <MoreHorizontal size={17} />
                </button>
                {meni === p.id && <Meni p={p} onZatvori={() => setMeni(null)} />}
              </td>
            </tr>
          ))}
          {vidljive.length === 0 && (
            <tr><td colSpan={6} className="px-5 py-10 text-center text-muted">Nema ponuda za izabrani filter.</td></tr>
          )}
        </tbody>
      </table>

      {brojStrana > 1 && (
        <div className="flex items-center justify-end gap-2 border-t border-line p-3 text-sm">
          <span className="mr-2 text-muted">Strana {strana + 1} od {brojStrana}</span>
          <button type="button" className="btn-secondary !py-1.5" disabled={strana === 0} onClick={() => setStrana((s) => s - 1)}>Prethodna</button>
          <button type="button" className="btn-secondary !py-1.5" disabled={strana >= brojStrana - 1} onClick={() => setStrana((s) => s + 1)}>Sledeća</button>
        </div>
      )}
    </div>
  );
}
