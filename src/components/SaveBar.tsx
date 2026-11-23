"use client";

import { Check, Loader2, Save } from "lucide-react";

export type SaveState = "idle" | "saving" | "saved" | "error";

/** Dugme „Sačuvaj“ sa stanjem čuvanja. */
export function SaveButton({ state, onClick, label = "Sačuvaj" }: { state: SaveState; onClick: () => void; label?: string }) {
  return (
    <button type="button" className="btn-primary" onClick={onClick} disabled={state === "saving"}>
      {state === "saving" ? <Loader2 size={16} className="animate-spin" /> : state === "saved" ? <Check size={16} /> : <Save size={16} />}
      {state === "saved" ? "Sačuvano" : state === "error" ? "Greška – pokušaj ponovo" : label}
    </button>
  );
}

/** Pomoćna funkcija: pokreće akciju i vodi stanje. */
export async function sacuvaj(set: (s: SaveState) => void, fn: () => Promise<unknown>) {
  set("saving");
  try {
    await fn();
    set("saved");
    setTimeout(() => set("idle"), 1800);
  } catch (e) {
    console.error(e);
    set("error");
  }
}
