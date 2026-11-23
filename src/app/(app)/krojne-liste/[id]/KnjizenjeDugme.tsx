"use client";

import { useState, useTransition } from "react";
import { BookCheck, CheckCircle2, Loader2 } from "lucide-react";
import { proknjiziUtrosak } from "@/app/actions/magacin";

export function KnjizenjeDugme({ id, proknjizeno, nacrt }: { id: number; proknjizeno: boolean; nacrt: boolean }) {
  const [radi, start] = useTransition();
  const [greska, setGreska] = useState("");

  if (proknjizeno)
    return (
      <span className="btn border border-emerald-200 bg-emerald-50 text-emerald-700">
        <CheckCircle2 size={16} /> Utrošak proknjižen
      </span>
    );

  return (
    <div className="flex items-center gap-2">
      {greska && <span className="text-sm text-danger">{greska}</span>}
      <button
        type="button"
        className="btn-secondary"
        disabled={radi || nacrt}
        title={nacrt ? "Ponuda mora biti potvrđena" : undefined}
        onClick={() => {
          if (!confirm("Proknjižiti utrošak? Cele šipke i iskorišćeni ostaci se skidaju iz magacina, a novi ostaci (>400 mm) se vraćaju. Knjiženje je moguće samo jednom.")) return;
          setGreska("");
          start(async () => {
            try {
              await proknjiziUtrosak(id);
            } catch (e) {
              setGreska(e instanceof Error ? e.message : "Knjiženje nije uspelo.");
            }
          });
        }}
      >
        {radi ? <Loader2 size={16} className="animate-spin" /> : <BookCheck size={16} />} Proknjiži utrošak
      </button>
    </div>
  );
}
