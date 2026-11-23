"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { Box, X } from "lucide-react";
import type { Prozor3DParametri } from "@/lib/prozor-3d";

const Scena = dynamic(() => import("./Prozor3DScena"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-sm text-muted">Učitavam 3D model…</div>,
});

/** Dugme „3D prikaz“ koje otvara 3D model pozicije u prozoru preko cele strane. */
export function Prozor3DDugme({ par, naslov, className }: { par: Prozor3DParametri; naslov: string; className?: string }) {
  const [otvoreno, setOtvoreno] = useState(false);

  useEffect(() => {
    if (!otvoreno) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOtvoreno(false);
    window.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [otvoreno]);

  return (
    <>
      <button type="button" onClick={() => setOtvoreno(true)} className={className ?? "btn-secondary !py-1.5"}>
        <Box size={15} /> 3D prikaz
      </button>
      {/* Portal na <body>: modal ne sme biti unutar kartice stavke, jer njen „sticky“ deo pravi
          poseban sloj (stacking context) i elementi forme bi se iscrtavali preko 3D prikaza. */}
      {otvoreno && createPortal(
        <div className="no-print fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-2 sm:p-6" onClick={() => setOtvoreno(false)}>
          <div className="card flex h-full max-h-[900px] w-full max-w-6xl flex-col overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-bold">{naslov}</p>
                <p className="text-xs text-muted">3D model od profila Salamander bluEvolution 92 · mere u razmeri</p>
              </div>
              <button type="button" onClick={() => setOtvoreno(false)} className="rounded p-1.5 hover:bg-background" aria-label="Zatvori">
                <X size={20} />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <Scena par={par} />
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
