import "server-only";
import { db } from "./db";
import { DODACI, mereOpcija, visinaRoletne, type OkovRez } from "./proracun";
import type { PlanProfila } from "./krojenje";
import { napraviPlan, type Proizvodnja } from "./proizvodnja";
import { profilnaVrsta } from "./stavka";

// Trebovanje materijala za ceo nalog: sve što magacin treba da izda proizvodnji, sabrano po artiklu
// (sve količine su već pomnožene brojem komada pozicije).

export type RedProfila = {
  sistem: string;
  profil: string;
  boja?: string;
  celik: boolean;
  duzinaSipke: number;
  komada: number; // komada za sečenje
  metara: number; // neto metara (zbir mera)
  noveSipke: number; // celih šipki za izdavanje
  ostaci: number[]; // dužine ostataka iz magacina koji se koriste
  naStanju: number | null; // null = magacin ne vodi (profil u boji)
  nedostaje: number; // šipki za poručivanje
  iskoriscenje: number; // %
};

export type RedArtikla = { naziv: string; kolicina: number; jedinica: string; pozicije: number[]; napomena?: string };
export type RedStakla = { vrsta: string; sirina: number; visina: number; kom: number; m2: number; pozicije: number[] };
export type RedDodatka = { vrsta: string; opis: string; sirina: number; visina: number | null; kom: number; kolicina: number; jedinica: string; pozicije: number[] };

export type Trebovanje = {
  profili: RedProfila[];
  staklo: RedStakla[];
  paneli: RedArtikla[];
  okov: RedArtikla[];
  pribor: RedArtikla[];
  dodaci: RedDodatka[];
  potrosni: RedArtikla[];
  greske: string[];
  proknjizeno: boolean;
};

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Dodaje količinu artiklu (isti naziv + jedinica se sabiraju). */
function sabiraj(lista: RedArtikla[], naziv: string, kolicina: number, jedinica: string, poz: number, napomena?: string) {
  if (kolicina <= 0) return;
  const r = lista.find((x) => x.naziv === naziv && x.jedinica === jedinica);
  if (r) {
    r.kolicina = r2(r.kolicina + kolicina);
    if (!r.pozicije.includes(poz)) r.pozicije.push(poz);
  } else lista.push({ naziv, kolicina: r2(kolicina), jedinica, pozicije: [poz], napomena });
}

// Pravila za procenu potrošnog materijala (nije u cenovniku – samo za trebovanje)
export const POTROSNI = {
  podmetaciPoStaklu: 6, // staklarski podmetači (klinovi) po staklu, +2 za staklo veće od 1,5 m²
  vijakCelikaNaMm: 300, // vijak za pričvršćivanje čelika na svakih 30 cm (+1 po komadu)
  ankerNaMm: 700, // montažni anker / pločica na svakih 70 cm obima rama
  penaMetaraPoDozi: 12, // PUR pena 750 ml ≈ 12 m spoja
  silikonMetaraPoTubi: 12, // silikon/akril 310 ml ≈ 12 m spoja (spolja i iznutra)
} as const;

export async function napraviTrebovanje(p: Proizvodnja): Promise<Trebovanje> {
  const { ponuda, pozicije, k } = p;
  const proknjizeno = ponuda.utrosakProknjizen && !!ponuda.krojnaLista;
  const plan: PlanProfila[] = proknjizeno ? JSON.parse(ponuda.krojnaLista!) : await napraviPlan(p);
  const stanja = await db.profilStavka.findMany({ where: { id: { in: plan.map((x) => x.profilStavkaId) } }, select: { id: true, puneSipke: true } });

  // ── profili i čelik (iz optimizacije sečenja) ──
  const profili: RedProfila[] = plan.map((pr) => {
    const naStanju = pr.bojaSifra ? null : stanja.find((x) => x.id === pr.profilStavkaId)?.puneSipke ?? 0;
    const ukupnaDuzina = pr.sipke.reduce((a, s) => a + s.duzina, 0);
    const neto = pr.sipke.reduce((a, s) => a + s.komadi.reduce((b, x) => b + x.mera, 0), 0);
    return {
      sistem: pr.sistem,
      profil: pr.profil,
      boja: pr.boja,
      celik: pr.kljuc ? pr.kljuc.startsWith("CELIK") : /čelik/i.test(pr.profil),
      duzinaSipke: pr.duzinaSipke,
      komada: pr.sipke.reduce((a, s) => a + s.komadi.length, 0),
      metara: pr.metara,
      noveSipke: pr.punihSipki,
      ostaci: pr.sipke.filter((s) => s.izvor === "OSTATAK").map((s) => s.duzina),
      naStanju,
      // posle knjiženja šipke su već skinute sa stanja – nedostaje samo ako je stanje otišlo u minus
      nedostaje: naStanju === null ? pr.punihSipki : proknjizeno ? Math.max(0, -naStanju) : Math.max(0, pr.punihSipki - naStanju),
      iskoriscenje: ukupnaDuzina ? (neto / ukupnaDuzina) * 100 : 0,
    };
  });
  const greske = plan.filter((x) => x.greska).map((x) => `${x.profil}: ${x.greska}`);

  const staklo: RedStakla[] = [];
  const paneli: RedArtikla[] = [];
  const okov: RedArtikla[] = [];
  const pribor: RedArtikla[] = [];
  const dodaci: RedDodatka[] = [];
  const potrosni: RedArtikla[] = [];
  // ako nalog ima više okovnih/profilnih sistema, isti naziv artikla se razdvaja po sistemu
  const nazivOkova = nazivPoIzvoru(pozicije.flatMap((x) => x.r.okov));
  const nazivPribora = nazivPoIzvoru(pozicije.flatMap((x) => x.r.pribor ?? []));

  for (const { s, poz, r } of pozicije) {
    const n = s.kolicina;
    const profilna = profilnaVrsta(s.vrsta);

    // ── samostalne stavke (roletna, komarnik, daska, okapnica) ──
    if (!profilna) {
      const m2 = s.vrsta === "ROLETNA" || s.vrsta === "KOMARNIK";
      dodaci.push({
        vrsta: s.vrsta === "ROLETNA" ? "Roletna" : s.vrsta === "KOMARNIK" ? "Komarnik" : s.vrsta === "DASKA" ? "Unutrašnja daska" : "Spoljna okapnica",
        opis: s.materijal ?? "",
        sirina: s.sirina,
        visina: m2 ? s.visina : null,
        kom: n,
        kolicina: r2(m2 ? ((s.sirina * s.visina) / 1e6) * n : (s.sirina / 1000) * n),
        jedinica: m2 ? "m²" : "m",
        pozicije: [poz],
      });
      continue;
    }

    // ── staklo (grupisano po vrsti i meri) i paneli ──
    for (const g of r.staklo) {
      if (g.opis.endsWith("(panel)")) continue;
      const vrsta = s.staklo ?? "Staklo";
      const kom = g.kom * n;
      const red = staklo.find((x) => x.vrsta === vrsta && x.sirina === g.sirina && x.visina === g.visina);
      if (red) {
        red.kom += kom;
        red.m2 = r2(red.m2 + ((g.sirina * g.visina) / 1e6) * kom);
        if (!red.pozicije.includes(poz)) red.pozicije.push(poz);
      } else staklo.push({ vrsta, sirina: g.sirina, visina: g.visina, kom, m2: r2(((g.sirina * g.visina) / 1e6) * kom), pozicije: [poz] });
      const m2 = (g.sirina * g.visina) / 1e6;
      sabiraj(potrosni, "Staklarski podmetači (klinovi)", (POTROSNI.podmetaciPoStaklu + (m2 > 1.5 ? 2 : 0)) * kom, "kom", poz);
    }
    if (s.panelSifra) {
      const panel = k.paneli.find((x) => x.sifra === s.panelSifra);
      sabiraj(paneli, `Panel ${panel?.naziv ?? s.panelSifra}`, n, "kom", poz);
    }

    // ── okov i sitni delovi ──
    for (const o of r.okov) sabiraj(okov, nazivOkova(o), o.kolicina * n, o.jedinica, poz);
    for (const o of r.pribor ?? []) sabiraj(pribor, nazivPribora(o), o.kolicina * n, o.jedinica, poz);
    for (const x of r.komadi) sabiraj(okov, x.naziv, x.kom * n, "kom", poz);
    if (s.rukohvat) sabiraj(okov, `Rukohvat ${s.rukohvat}`, n, "kom", poz);
    if (s.elektroPrihvatnik) sabiraj(okov, "Elektro prihvatnik", n, "kom", poz);
    if (s.automat) sabiraj(okov, "Automat / pumpa", n, "kom", poz);

    // ── dodaci uz poziciju ──
    for (const d of DODACI) {
      const mat = s[d.polje];
      if (!mat) continue;
      if (d.polje === "roletna") {
        const kutija = visinaRoletne(s.roletnaVisina);
        const vis = s.visina + kutija;
        dodaci.push({
          vrsta: "Roletna",
          opis: `${mat} (kutija ${kutija} mm, kaiš ${s.roletnaKais === "L" ? "levo" : "desno"})`,
          sirina: s.sirina,
          visina: vis,
          kom: n,
          kolicina: r2(((s.sirina * vis) / 1e6) * n),
          jedinica: "m²",
          pozicije: [poz],
        });
      } else if (d.jedinica === "m²") {
        dodaci.push({ vrsta: d.naziv, opis: mat, sirina: s.sirina, visina: s.visina, kom: n, kolicina: r2(((s.sirina * s.visina) / 1e6) * n), jedinica: "m²", pozicije: [poz] });
      } else {
        dodaci.push({ vrsta: d.naziv, opis: mat, sirina: s.sirina, visina: null, kom: n, kolicina: r2((s.sirina / 1000) * n), jedinica: "m", pozicije: [poz] });
      }
    }

    // ── potrošni materijal (procena) ──
    for (const c of r.celik) sabiraj(potrosni, "Vijci za čelično ojačanje", (Math.ceil(c.mera / POTROSNI.vijakCelikaNaMm) + 1) * c.kom * n, "kom", poz);
    const mo = mereOpcija(s, k.sistemi.find((x) => x.id === s.sistemId));
    const obimMm = 2 * (s.sirina - mo.prosirenjeL - mo.prosirenjeD) + 2 * (s.visina - mo.podstok);
    sabiraj(potrosni, "Montažni ankeri / pločice", Math.ceil(obimMm / POTROSNI.ankerNaMm) * n, "kom", poz);
    sabiraj(potrosni, "__obim", (obimMm / 1000) * n, "m", poz);
  }

  // PUR pena i silikon se računaju iz ukupnog obima (zaokružuje se na cele doze/tube)
  const obim = potrosni.find((x) => x.naziv === "__obim");
  if (obim) {
    potrosni.splice(potrosni.indexOf(obim), 1);
    potrosni.push({ naziv: "PUR pena 750 ml", kolicina: Math.ceil(obim.kolicina / POTROSNI.penaMetaraPoDozi), jedinica: "kom", pozicije: obim.pozicije, napomena: `${r2(obim.kolicina)} m spoja` });
    potrosni.push({ naziv: "Silikon / akril 310 ml", kolicina: Math.ceil((2 * obim.kolicina) / POTROSNI.silikonMetaraPoTubi), jedinica: "kom", pozicije: obim.pozicije, napomena: "spolja i iznutra" });
  }

  staklo.sort((a, b) => a.vrsta.localeCompare(b.vrsta) || b.sirina * b.visina - a.sirina * a.visina);
  return { profili, staklo, paneli, okov, pribor, dodaci, potrosni, greske, proknjizeno };
}

/** Naziv artikla sa sistemom u zagradi – samo kad nalog ima artikle iz više sistema. */
export function nazivPoIzvoru(svi: OkovRez[]) {
  const vise = new Set(svi.map((o) => o.izvor ?? "")).size > 1;
  return (o: OkovRez) => (vise && o.izvor ? `${o.naziv} – ${o.izvor}` : o.naziv);
}
