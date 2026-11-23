export const STATUSI: Record<string, { n: string; c: string }> = {
  NACRT: { n: "Nacrt", c: "bg-stone-100 text-stone-600" },
  POTVRDJENO: { n: "Potvrđeno", c: "bg-emerald-50 text-emerald-700" },
  REALIZOVANO: { n: "Realizovano", c: "bg-sky-50 text-sky-700" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUSI[status] ?? { n: status, c: "bg-stone-100 text-stone-600" };
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.c}`}>{s.n}</span>;
}
