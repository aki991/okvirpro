"use client";

import { useTransition } from "react";
import { CheckCircle2, Copy, Undo2 } from "lucide-react";
import { kopirajPonudu, promeniStatus } from "@/app/actions/ponude";

export function StatusAkcije({ id, status }: { id: number; status: string }) {
  const [radi, start] = useTransition();
  return (
    <>
      <button type="button" className="btn-secondary" disabled={radi} onClick={() => start(() => kopirajPonudu(id))}>
        <Copy size={16} /> Kopiraj
      </button>
      {status === "NACRT" ? (
        <button type="button" className="btn bg-success text-white hover:opacity-90" disabled={radi} onClick={() => start(() => promeniStatus(id, "POTVRDJENO"))}>
          <CheckCircle2 size={16} /> Potvrdi ponudu
        </button>
      ) : (
        <button type="button" className="btn-secondary" disabled={radi} onClick={() => start(() => promeniStatus(id, "NACRT"))}>
          <Undo2 size={16} /> Vrati u nacrt
        </button>
      )}
    </>
  );
}
