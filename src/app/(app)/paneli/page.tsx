import { db } from "@/lib/db";
import { PaneliForma } from "./PaneliForma";

export const dynamic = "force-dynamic";

export default async function Paneli() {
  const paneli = await db.panel.findMany({ orderBy: [{ redosled: "asc" }, { id: "asc" }] });
  return <PaneliForma paneli={paneli} />;
}
