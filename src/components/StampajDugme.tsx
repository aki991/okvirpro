"use client";

import { Printer } from "lucide-react";

export function StampajDugme({ label = "Štampaj / Sačuvaj PDF" }: { label?: string }) {
  return (
    <button type="button" className="btn-primary" onClick={() => window.print()}>
      <Printer size={16} /> {label}
    </button>
  );
}
