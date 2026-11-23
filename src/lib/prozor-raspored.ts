// Raspored elemenata prozora u ravni (mm) za 3D prikaz.
// X = desno, Y = gore, ishodište = donji levi ugao cele pozicije (sa proširenjima i podštokom).
// Ista pravila podele kao u proračunu: osa prečke na proporcionalnom mestu, štulp bez prečke.

import type { Cvor, Otvaranje } from "./modeli-katalog";
import { SKLOP_BE92 } from "./profili-3d";

export type Pravougaonik = { x: number; y: number; w: number; h: number };

export type Polje3D = {
  otvaranje: Otvaranje;
  svetlo: Pravougaonik; // svetli otvor polja (od ivice usne rama/prečke)
  krilo?: Pravougaonik; // spoljna mera krila
  stulp?: "levo" | "desno"; // strana na kojoj je štulp
};

export type Precka3D = { smer: "V" | "H"; osa: number; od: number; do: number };

export type Raspored = {
  ukupno: Pravougaonik;
  ram: Pravougaonik;
  svetlo: Pravougaonik;
  polja: Polje3D[];
  precke: Precka3D[];
  stulpovi: { x: number; y: number; h: number }[];
};

const S = SKLOP_BE92;

export function napraviRaspored(
  definicija: Cvor,
  sirina: number,
  visina: number,
  mere: { prosirenjeL: number; prosirenjeD: number; podstok: number },
): Raspored {
  const ram: Pravougaonik = {
    x: mere.prosirenjeL,
    y: mere.podstok,
    w: sirina - mere.prosirenjeL - mere.prosirenjeD,
    h: visina - mere.podstok,
  };
  const svetlo: Pravougaonik = { x: ram.x + S.usnaRama, y: ram.y + S.usnaRama, w: ram.w - 2 * S.usnaRama, h: ram.h - 2 * S.usnaRama };
  const r: Raspored = { ukupno: { x: 0, y: 0, w: sirina, h: visina }, ram, svetlo, polja: [], precke: [], stulpovi: [] };

  const obidji = (c: Cvor, o: Pravougaonik) => {
    if (c.tip === "polje") {
      const p: Polje3D = { otvaranje: c.otvaranje, svetlo: o };
      if (c.otvaranje !== "FIKS") {
        const d = S.preklopKrila;
        p.krilo = { x: o.x - d, y: o.y - d, w: o.w + 2 * d, h: o.h + 2 * d };
      }
      r.polja.push(p);
      return;
    }
    const uk = c.delovi.reduce((s, d) => s + d.udeo, 0);
    // štulp: dva krila dele otvor, sudaraju se na sredini (preklop 8 mm)
    if (c.stulp && c.smer === "V" && c.delovi.length === 2 && c.delovi.every((d) => d.sadrzaj.tip === "polje")) {
      const xm = o.x + (o.w * c.delovi[0].udeo) / uk;
      const d = S.preklopKrila;
      const [a, b] = c.delovi.map((x) => x.sadrzaj as { tip: "polje"; otvaranje: Otvaranje });
      r.polja.push({
        otvaranje: a.otvaranje,
        svetlo: { x: o.x, y: o.y, w: xm - o.x, h: o.h },
        krilo: { x: o.x - d, y: o.y - d, w: xm - o.x + d + 4, h: o.h + 2 * d },
        stulp: "desno",
      });
      r.polja.push({
        otvaranje: b.otvaranje,
        svetlo: { x: xm, y: o.y, w: o.x + o.w - xm, h: o.h },
        krilo: { x: xm - 4, y: o.y - d, w: o.x + o.w - xm + d + 4, h: o.h + 2 * d },
        stulp: "levo",
      });
      r.stulpovi.push({ x: xm, y: o.y - d, h: o.h + 2 * d });
      return;
    }
    const n = c.delovi.length;
    const pola = S.sirinaPrecke / 2;
    if (c.smer === "V") {
      // delovi s leva na desno
      let pos = o.x;
      c.delovi.forEach((d, i) => {
        const deo = (o.w * d.udeo) / uk;
        const pre = i > 0 ? pola : 0;
        const posle = i < n - 1 ? pola : 0;
        // prečka posle dela; krajevi idu do poda falca susednog profila
        if (i < n - 1) r.precke.push({ smer: "V", osa: pos + deo, od: o.y - S.podFalca, do: o.y + o.h + S.podFalca });
        obidji(d.sadrzaj, { x: pos + pre, y: o.y, w: deo - pre - posle, h: o.h });
        pos += deo;
      });
    } else {
      // delovi odozgo nadole (kao na crtežu modela: prvi deo je gore)
      let pos = o.y + o.h;
      c.delovi.forEach((d, i) => {
        const deo = (o.h * d.udeo) / uk;
        const gore = i > 0 ? pola : 0;
        const dole = i < n - 1 ? pola : 0;
        if (i < n - 1) r.precke.push({ smer: "H", osa: pos - deo, od: o.x - S.podFalca, do: o.x + o.w + S.podFalca });
        obidji(d.sadrzaj, { x: o.x, y: pos - deo + dole, w: o.w, h: deo - gore - dole });
        pos -= deo;
      });
    }
  };
  obidji(definicija, svetlo);
  return r;
}
