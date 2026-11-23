// Provera motora proračuna na primerima potvrđenim u referentnoj aplikaciji.
// Pokretanje: npx tsx scripts/proveri-proracun.ts
import { izracunaj, zbir, type Kontekst, type StavkaUlaz } from "../src/lib/proracun";
import { MODELI } from "../src/lib/modeli-katalog";

const k: Kontekst = {
  sistemi: [
    {
      id: 1, naziv: "PVC test", tip: "PVC",
      stavke: [
        ["RAM", 45, null, 12.5], ["KRILO_PROZORA", 56, null, 14.2], ["KRILO_VRATA", 88, null, 18.5],
        ["CELIK_RAMA", null, null, 4.5], ["CELIK_KRILA", null, null, 5.2], ["CELIK_KRILA_VRATA", null, null, 7.8],
        ["LAJSNA", null, null, 2.8], ["PRECKA", null, 42, 11.5], ["PRAG", 20, null, 9.5],
        ["PROSIRENJE", 40, null, 8.5], ["PODSTOK", 30, null, 3.5], ["POKLOPAC_STULPA", null, null, 0.5],
      ].map(([kljuc, ui, sir, cena]) => ({
        kljuc: kljuc as string, naziv: kljuc as string, duzinaSipke: 6500, unutrasnjaVisina: ui as number | null,
        sirinaOdbitak: sir as number | null, cena: cena as number, poKomadu: false,
      })),
    },
    {
      id: 2, naziv: "ALU test", tip: "ALU",
      stavke: [
        ["RAM", 42, null, 24.5], ["KRILO_PROZORA", 52, null, 28.2], ["LAJSNA", null, null, 4.2],
        ["PRECKA", null, 40, 22.5], ["PROSIRENJE", 40, null, 15], ["PODSTOK", 30, null, 6],
      ].map(([kljuc, ui, sir, cena]) => ({
        kljuc: kljuc as string, naziv: kljuc as string, duzinaSipke: 6500, unutrasnjaVisina: ui as number | null,
        sirinaOdbitak: sir as number | null, cena: cena as number, poKomadu: false,
      })),
    },
  ],
  cenovnik: [{ kategorija: "STAKLO", naziv: "4-16-4", cena: 28 }],
  okov: [], okovMetoda: "DETALJNO", okovPoM2: 0,
  modeli: MODELI, paneli: [], pdvStopa: 20, montazaPoM2: 12, marza: 50,
  boje: [{ sifra: "BELA", naziv: "Bela", hex: "#f6f6f1", doplata: 0 }, { sifra: "ORAH", naziv: "Orah", hex: "#6b4a33", doplata: 15 }],
};

const osnova: StavkaUlaz = {
  vrsta: "PROZOR", sirina: 1200, visina: 1400, kolicina: 1, sistemId: 1, staklo: "4-16-4", materijal: null,
  marza: 50, rucnaCena: null, modelSifra: "P-FIX", panelSifra: null, rukohvat: null, elektroPrihvatnik: false,
  automat: false, podstok: true, prosirenjeL: true, prosirenjeD: false, spojL: true, spojD: false, napomena: "",
};

let greske = 0;
const ocekuj = (opis: string, dobijeno: number, ocekivano: number, tol = 0.02) => {
  const ok = Math.abs(dobijeno - ocekivano) <= tol;
  if (!ok) greske++;
  console.log(`${ok ? "✔" : "✘"} ${opis}: ${dobijeno} (očekivano ${ocekivano})`);
};

const r = izracunaj(k, osnova);
const mera = (el: string) => r.rezovi.find((x) => x.element.startsWith(el))?.mera ?? -1;
ocekuj("Ram Š", mera("Širina rama (gore/dole)"), 1166);
ocekuj("Ram V", mera("Visina rama"), 1376);
ocekuj("Proširenje levo", mera("Proširenje levo"), 1370);
ocekuj("Podštok", mera("Podštok"), 1200);
ocekuj("Fiks lajsna Š", mera("Fiks lajsna Š"), 1070);
ocekuj("Fiks lajsna V", mera("Fiks lajsna V"), 1280);
ocekuj("Staklo Š", r.staklo[0].sirina, 1062);
ocekuj("Staklo V", r.staklo[0].visina, 1272);
ocekuj("Čelik rama Š", r.celik.find((x) => x.element === "Čelik rama Š")!.mera, 1046);
ocekuj("Cena stavke (bez PDV)", r.cenaKom, 226.65, 0.02);

const z = zbir(k, [{ r, kolicina: 1 }], { bezPdv: false, montazaUCenu: false, bezMontaze: false });
ocekuj("PDV", z.pdv, 45.33);
ocekuj("Montaža", z.montaza, 20.16);
ocekuj("Ukupno za naplatu", z.ukupnoZaNaplatu, 292.13, 0.02);

// ── Krila, štulp, prečke (mere iz referentnih radnih naloga)
const nalog = (opis: string, s: Partial<StavkaUlaz>, ocek: Record<string, number>, staklo?: [number, number][]) => {
  const x = izracunaj(k, { ...osnova, podstok: false, prosirenjeL: false, spojL: false, ...s });
  console.log(`\n${opis}`);
  for (const [el, m] of Object.entries(ocek)) {
    const nadjen = [...x.rezovi, ...x.celik].find((y) => y.element.startsWith(el));
    ocekuj(`  ${el}`, nadjen?.mera ?? -1, m, 0);
  }
  staklo?.forEach(([sw, sh], i) => {
    ocekuj(`  staklo ${i + 1} Š`, x.staklo[i]?.sirina ?? -1, sw, 0);
    ocekuj(`  staklo ${i + 1} V`, x.staklo[i]?.visina ?? -1, sh, 0);
  });
  return x;
};

nalog("P-JK-L 1200×1400", { modelSifra: "P-JK-L" }, {
  "Širina rama (gore/dole)": 1206, "Visina rama": 1406, "Krilo Š": 1132, "Krilo V": 1332,
  "Krilo lajsna Š": 1014, "Krilo lajsna V": 1214, "Čelik rama Š": 1086, "Čelik krilo Š": 972, "Čelik krilo V": 1172,
}, [[1006, 1206]]);

nalog("P-BV-JK 1200×1400 sa podštokom", { modelSifra: "P-BV-JK", podstok: true }, {
  "Visina rama": 1376, "Krilo V": 1302, "Krilo lajsna V": 1184, "Čelik krilo V": 1142,
}, [[1006, 1176]]);

const stulp = nalog("P-DK-STULP-L 1280×1340, proširenje L+D", { modelSifra: "P-DK-STULP-L", sirina: 1280, visina: 1340, prosirenjeL: true, prosirenjeD: true }, {
  "Širina rama (gore/dole)": 1206, "Visina rama": 1346, "Proširenje levo": 1340, "Glavno krilo Š": 566, "Glavno krilo V": 1272,
  "Pomoćno krilo Š": 566, "Štulp (lažna prečka)": 1202, "Glavno krilo lajsna Š": 448, "Glavno krilo lajsna V": 1154,
  "Čelik glavno krilo Š": 406, "Čelik glavno krilo V": 1112,
}, [[440, 1146], [440, 1146]]);
ocekuj("  poklopac štulpa (kom)", stulp.komadi.find((x) => x.naziv === "POKLOPAC_STULPA")?.kom ?? -1, 2, 0);

nalog("P-DK-STULP-R 1200×1000", { modelSifra: "P-DK-STULP-R", sirina: 1200, visina: 1000 }, {
  "Glavno krilo Š": 566, "Glavno krilo V": 932, "Štulp (lažna prečka)": 862, "Čelik rama V": 886,
}, [[440, 806], [440, 806]]);

// 3-krilni: referenca daje 563/563/565 – naša podela po osi prečke daje ±1 mm
const tk = izracunaj(k, { ...osnova, podstok: false, spojL: false, modelSifra: "P-TK-DK-JK", sirina: 1860, visina: 2100, prosirenjeL: true, prosirenjeD: true });
console.log("\nP-TK-DK-JK 1860×2100 (tolerancija 1 mm)");
const tm = (el: string) => tk.rezovi.find((y) => y.element === el)?.mera ?? -1;
ocekuj("  Vertikalna prečka", tm("Vertikalna prečka"), 2010, 0);
ocekuj("  Čelik prečke", tk.celik.find((y) => y.element === "Čelik prečke")?.mera ?? -1, 2010, 0);
ocekuj("  Glavno krilo Š", tm("Glavno krilo Š"), 563, 1);
ocekuj("  Krilo Š (jednokrilno)", tm("Krilo Š"), 565, 1);
ocekuj("  Krilo V", tm("Krilo V"), 2032, 0);
ocekuj("  Štulp", tm("Štulp (lažna prečka)"), 1962, 0);

nalog("ALU P-FIX-V2 3000×4000, proširenje D", { modelSifra: "P-FIX-V2", sistemId: 2, sirina: 3000, visina: 4000, prosirenjeD: true }, {
  "Širina rama (gore/dole)": 2960, "Visina rama": 4000, "Proširenje desno": 4000, "Vertikalna prečka": 3916, "Fiks lajsna V": 3916,
}, [[1410, 3908], [681, 3908], [681, 3908]]);

// ── Ručne mere opcija i ugao sečenja
{
  const x = izracunaj(k, { ...osnova, modelSifra: "P-JK-L", podstok: true, podstokMm: 50, prosirenjeL: true, prosirenjeLMm: 60, prosirenjeD: true });
  const m = (el: string) => x.rezovi.find((y) => y.element.startsWith(el));
  console.log("\nRučne mere: podštok 50, proširenje L 60, D podrazumevano 40 (1200×1400)");
  ocekuj("  Ram Š = 1200 − 60 − 40 + 6", m("Širina rama")?.mera ?? -1, 1106, 0);
  ocekuj("  Ram V = 1400 − 50 + 6", m("Visina rama")?.mera ?? -1, 1356, 0);
  ocekuj("  Proširenje levo = 1350", m("Proširenje levo")?.mera ?? -1, 1350, 0);
  console.log(`  oznake: ${m("Proširenje levo")?.element} | ${m("Podštok")?.element}`);
  const ugao = (el: string) => (m(el)?.ugao === "45" ? 45 : m(el)?.ugao === "90" ? 90 : -1);
  ocekuj("  ugao rama", ugao("Širina rama"), 45, 0);
  ocekuj("  ugao krila", ugao("Krilo Š"), 45, 0);
  ocekuj("  ugao lajsne", ugao("Krilo lajsna"), 45, 0);
  ocekuj("  ugao podštoka", ugao("Podštok"), 90, 0);
  ocekuj("  ugao proširenja", ugao("Proširenje levo"), 90, 0);
  ocekuj("  ugao čelika", x.celik[0]?.ugao === "90" ? 90 : -1, 90, 0);
  const y = izracunaj(k, { ...osnova, modelSifra: "P-FIX-V", podstok: false, prosirenjeL: false });
  ocekuj("  ugao prečke", y.rezovi.find((r) => r.kljuc === "PRECKA")?.ugao === "90" ? 90 : -1, 90, 0);
}

// ── Boja profila (doplata na profile, bez čelika)
{
  const bela = izracunaj(k, { ...osnova, modelSifra: "P-JK-L", podstok: false, prosirenjeL: false, boja: "BELA" });
  const orah = izracunaj(k, { ...osnova, modelSifra: "P-JK-L", podstok: false, prosirenjeL: false, boja: "ORAH" });
  const profili = bela.troskovi.filter((t) => !/^(CELIK|Staklo|Okov)/.test(t.naziv)).reduce((a, t) => a + t.iznos, 0);
  console.log("\nBoja: Orah +15% na profile");
  ocekuj("  bela = bez doplate", bela.troskovi.some((t) => t.naziv.startsWith("Doplata")) ? 1 : 0, 0, 0);
  ocekuj("  orah – bela (nabavna)", Math.round((orah.trosakKom - bela.trosakKom) * 100) / 100, Math.round(profili * 0.15 * 100) / 100, 0.02);
}

// ── Dodaci uz poziciju
{
  const kd: Kontekst = { ...k, cenovnik: [...k.cenovnik, { kategorija: "ROLETNA", naziv: "R", cena: 35 }, { kategorija: "KOMARNIK", naziv: "K", cena: 22 }, { kategorija: "DASKA", naziv: "D", cena: 10 }, { kategorija: "OKAPNICA", naziv: "O", cena: 9 }] };
  const bez = izracunaj(kd, { ...osnova, podstok: false, prosirenjeL: false });
  const sa = izracunaj(kd, { ...osnova, podstok: false, prosirenjeL: false, roletna: "R", komarnik: "K", daska: "D", okapnica: "O" });
  // roletna sa kutijom 180: 1,2 × 1,58 × 35 = 66,36; komarnik 1,68 × 22 = 36,96; daska + okapnica 1,2 × 19 = 22,8 → 126,12
  console.log("\nDodaci (roletna sa kutijom 180 mm, komarnik, daska, okapnica)");
  ocekuj("  nabavna razlika", Math.round((sa.trosakKom - bez.trosakKom) * 100) / 100, 126.12, 0.01);
  const sa250 = izracunaj(kd, { ...osnova, podstok: false, prosirenjeL: false, roletna: "R", roletnaVisina: 250 });
  // 1,2 × 1,65 × 35 = 69,30
  ocekuj("  roletna sa kutijom 250 mm", Math.round((sa250.trosakKom - bez.trosakKom) * 100) / 100, 69.3, 0.01);
}

// ── Optimizacija sečenja (primeri iz referentne krojne liste)
import { optimizuj } from "../src/lib/krojenje";
{
  const a = optimizuj([{ oznaka: "P1H", mera: 1070 }], 6500, []);
  ocekuj("Nova šipka, 1 komad → ostatak", a.sipke[0].ostatak, 5416, 0);
  const b = optimizuj([{ oznaka: "P1V", mera: 1376 }, { oznaka: "P1H", mera: 1166 }, { oznaka: "P1H", mera: 1166 }], 6500, []);
  ocekuj("Nova šipka, 3 komada → ostatak", b.sipke[0].ostatak, 2770, 0);
  const c = optimizuj([{ oznaka: "P1V", mera: 1280 }], 6500, [{ id: 1, duzina: 5416 }]);
  ocekuj("Ostatak iz magacina → ostatak", c.sipke[0].ostatak, 4132, 0);
  ocekuj("Koristi ostatak, ne novu šipku", c.sipke.filter((s) => s.izvor === "NOVA").length, 0, 0);
  const d = optimizuj(Array.from({ length: 8 }, (_, i) => ({ oznaka: `P${i}`, mera: 1500 })), 6500, [{ id: 1, duzina: 450 }]);
  ocekuj("8 × 1500 mm → 2 nove šipke", d.sipke.filter((s) => s.izvor === "NOVA").length, 2, 0);
}

console.log(greske ? `\n${greske} provera nije prošlo.` : "\nSve provere su prošle.");
process.exit(greske ? 1 : 0);
