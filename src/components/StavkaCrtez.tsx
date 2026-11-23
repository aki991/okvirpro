import type { PonudaStavka } from "@prisma/client";
import { mereOpcija, type Kontekst } from "@/lib/proracun";
import { PODRAZUMEVANI_MODEL } from "@/lib/modeli-katalog";
import { ElementCrtez } from "./ElementCrtez";

/** Crtež sačuvane stavke (sa kotama i opcijama) – za ponudu, radni nalog i sl. */
export function StavkaCrtez({ s, k, className }: { s: PonudaStavka; k: Kontekst; className?: string }) {
  const profilna = s.vrsta === "PROZOR" || s.vrsta === "VRATA";
  const vrata = s.vrsta === "VRATA";
  const model = profilna
    ? k.modeli.find((m) => m.sifra === s.modelSifra) ?? k.modeli.find((m) => m.sifra === PODRAZUMEVANI_MODEL[vrata ? "VRATA" : "PROZOR"])
    : undefined;
  const sistem = k.sistemi.find((x) => x.id === s.sistemId);
  const mo = mereOpcija(s, sistem);
  return (
    <ElementCrtez
      definicija={profilna ? model?.definicija ?? { tip: "polje", otvaranje: "FIKS" } : null}
      sirina={s.sirina}
      visina={s.visina}
      vrsta={s.vrsta}
      boja={profilna ? k.boje.find((b) => b.sifra === (s.boja ?? "BELA"))?.hex : undefined}
      opcije={{
        podstok: s.podstok,
        prosirenjeL: s.prosirenjeL,
        prosirenjeD: s.prosirenjeD,
        spojL: s.spojL,
        spojD: s.spojD,
        roletna: s.roletna,
        roletnaVisina: s.roletnaVisina,
        roletnaKais: s.roletnaKais,
        komarnik: s.komarnik,
        daska: s.daska,
        okapnica: s.okapnica,
        panel: vrata && s.panelSifra ? k.paneli.find((p) => p.sifra === s.panelSifra)?.naziv ?? s.panelSifra : null,
      }}
      prosirenjeLMm={mo.prosirenjeL}
      prosirenjeDMm={mo.prosirenjeD}
      podstokMm={mo.podstok}
      className={className}
    />
  );
}
