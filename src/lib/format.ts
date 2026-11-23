export const eur = (n: number) =>
  n.toLocaleString("sr-RS", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

export const rsd = (n: number) => n.toLocaleString("sr-RS", { maximumFractionDigits: 0 }) + " RSD";

export const datum = (d: Date | string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("sr-RS", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

/** Parsira broj iz unosa, prihvata i zarez kao decimalni separator. */
export const broj = (v: string | number | null | undefined): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
};
