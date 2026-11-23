import type { Prozor3DParametri } from "./prozor-3d";
import { PODRAZUMEVANI_MODEL } from "./modeli-katalog";
import { mereOpcija, prepustRoletne, stranaKaisa, visinaRoletne, type Kontekst, type StavkaUlaz } from "./proracun";

/** Parametri za 3D prikaz stavke (null za stavke koje nisu prozor/vrata). */
export function parametri3D(s: StavkaUlaz, k: Kontekst): Prozor3DParametri | null {
  if (s.vrsta !== "PROZOR" && s.vrsta !== "VRATA") return null;
  if (!s.sirina || !s.visina || s.sirina < 300 || s.visina < 300) return null;
  const vrata = s.vrsta === "VRATA";
  const model = k.modeli.find((m) => m.sifra === s.modelSifra) ?? k.modeli.find((m) => m.sifra === PODRAZUMEVANI_MODEL[vrata ? "VRATA" : "PROZOR"]);
  const sistem = k.sistemi.find((x) => x.id === s.sistemId) ?? k.sistemi[0];
  const mo = mereOpcija(s, sistem);
  return {
    definicija: model?.definicija ?? { tip: "polje", otvaranje: "FIKS" },
    sirina: s.sirina,
    visina: s.visina,
    vrsta: s.vrsta,
    alu: sistem?.tip === "ALU",
    boja: k.boje.find((b) => b.sifra === (s.boja ?? "BELA"))?.hex,
    mere: { prosirenjeL: mo.prosirenjeL, prosirenjeD: mo.prosirenjeD, podstok: mo.podstok },
    dodaci: {
      roletna: !!s.roletna,
      roletnaVisina: s.roletna ? visinaRoletne(s.roletnaVisina) : undefined,
      roletnaPrepust: prepustRoletne(s.roletnaPrepust),
      roletnaKais: stranaKaisa(s.roletnaKais),
      komarnik: !!s.komarnik,
      daska: s.daska ?? null,
      okapnica: s.okapnica ?? null,
    },
    panel: vrata && !!s.panelSifra,
  };
}
