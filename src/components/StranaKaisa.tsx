"use client";

/** Izbor strane kaiša roletne (gledano iznutra); null = desno. */
export function StranaKaisa({ vrednost, onChange }: { vrednost: string | null | undefined; onChange: (v: "L" | "D") => void }) {
  const izabrana = vrednost === "L" ? "L" : "D";
  return (
    <div className="mt-2 flex items-center gap-2">
      <span className="whitespace-nowrap text-xs text-muted">Kaiš (iznutra)</span>
      <div className="inline-flex flex-1 rounded-lg border border-line bg-white p-0.5">
        {(
          [
            ["L", "Levo"],
            ["D", "Desno"],
          ] as const
        ).map(([k, n]) => (
          <button
            key={k}
            type="button"
            aria-pressed={izabrana === k}
            onClick={() => onChange(k)}
            className={`flex-1 rounded-md px-2 py-1 text-xs font-semibold transition ${izabrana === k ? "bg-accent text-white" : "text-muted hover:text-foreground"}`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
