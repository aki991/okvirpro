"use client";

import { ROLETNA_PREPUST, ROLETNA_VISINA } from "@/lib/proracun";

/** Visina kutije i prepust ka sobi – dva polja u istom redu. Prazno polje = podrazumevana mera. */
export function RoletnaMere({
  id,
  visina,
  prepust,
  onVisina,
  onPrepust,
}: {
  id: string;
  visina: number | null | undefined;
  prepust: number | null | undefined;
  onVisina: (v: number | null) => void;
  onPrepust: (v: number | null) => void;
}) {
  const polje = (
    oznaka: string,
    sufiks: string,
    vrednost: number | null | undefined,
    podr: number,
    min: number,
    max: number,
    onChange: (v: number | null) => void,
    kljuc: string,
  ) => (
    <div className="flex min-w-0 flex-1 items-center gap-1.5 first:flex-[1.15]">
      <label className="whitespace-nowrap text-xs text-muted" htmlFor={`${id}-${kljuc}`}>{oznaka}</label>
      <div className="relative min-w-0 flex-1">
        <input
          id={`${id}-${kljuc}`}
          className="input !py-1.5 !pl-2 !pr-8 text-right font-semibold [appearance:textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={5}
          placeholder={String(podr)}
          value={vrednost ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        />
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted">{sufiks}</span>
      </div>
    </div>
  );
  return (
    <div className="mt-2 flex items-center gap-2">
      {polje("Visina kutije", "mm", visina, ROLETNA_VISINA.podrazumevano, ROLETNA_VISINA.min, ROLETNA_VISINA.max, onVisina, "v")}
      {polje("Prepust", "mm", prepust, ROLETNA_PREPUST.podrazumevano, ROLETNA_PREPUST.min, ROLETNA_PREPUST.max, onPrepust, "p")}
    </div>
  );
}
