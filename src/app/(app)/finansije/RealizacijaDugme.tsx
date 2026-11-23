"use client";

import { useTransition } from "react";
import { CheckCircle2, Clock } from "lucide-react";
import { promeniStatus } from "@/app/actions/ponude";

export function RealizacijaDugme({ id, status }: { id: number; status: string }) {
  const [radi, start] = useTransition();
  const realizovano = status === "REALIZOVANO";
  return (
    <button
      type="button"
      disabled={radi}
      title={realizovano ? "Vrati u čekanje" : "Označi kao naplaćeno / realizovano"}
      onClick={() => start(() => promeniStatus(id, realizovano ? "POTVRDJENO" : "REALIZOVANO"))}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
        realizovano ? "bg-sky-50 text-sky-700 hover:bg-sky-100" : "bg-accent-soft text-accent hover:bg-amber-100"
      }`}
    >
      {realizovano ? <CheckCircle2 size={12} /> : <Clock size={12} />}
      {realizovano ? "Realizovano" : "Čekanje"}
    </button>
  );
}
