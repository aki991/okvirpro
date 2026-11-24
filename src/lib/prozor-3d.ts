// 3D sklop prozora/vrata od BE92 profila (samo u pretraživaču – koristi three.js).
// Svet: X desno, Y gore, Z dubina (0 = spoljna strana rama, 92 = unutrašnja).
// Ram, krila i lajsne su sečeni pod 45° na uglovima; prečke su ravno sečene.

import * as THREE from "three";
import type { Cvor } from "./modeli-katalog";
import { BE92_KRILO, BE92_LAJSNA, BE92_PRECKA, BE92_RAM, SKLOP_BE92 as S, zaobljeniUglovi, type Kontura, type Presek } from "./profili-3d";
import { napraviRaspored, type Pravougaonik } from "./prozor-raspored";
import { jeDekor } from "@/components/ProzorRealno";

export type Prozor3DParametri = {
  definicija: Cvor;
  sirina: number;
  visina: number;
  vrsta: string; // PROZOR | VRATA
  alu?: boolean;
  mere: { prosirenjeL: number; prosirenjeD: number; podstok: number };
  dodaci: {
    roletna?: boolean;
    roletnaVisina?: number;
    /** prepust kutije ka sobi u mm (podrazumevano 50) */
    roletnaPrepust?: number;
    /** strana kaiša gledano iznutra (podrazumevano desno) */
    roletnaKais?: "L" | "D";
    komarnik?: boolean;
    daska?: string | null;
    okapnica?: string | null;
  };
  panel?: boolean;
  /** boja profila (hex); bez nje je bela (PVC) odnosno prirodni aluminijum */
  boja?: string;
};

// ───────────── geometrija profila ─────────────
function putanja<T extends THREE.Path>(p: T, k: Kontura) {
  zaobljeniUglovi(k).forEach((t, i) => {
    if (i === 0) p.moveTo(...t.ulaz);
    else p.lineTo(...t.ulaz);
    p.quadraticCurveTo(t.ugao[0], t.ugao[1], t.izlaz[0], t.izlaz[1]);
  });
  p.closePath();
  return p;
}

function izvuci(spoljna: Kontura, rupe: Kontura[], L: number) {
  const s = putanja(new THREE.Shape(), spoljna);
  for (const r of rupe) s.holes.push(putanja(new THREE.Path(), r));
  return new THREE.ExtrudeGeometry(s, { depth: L, bevelEnabled: false, curveSegments: 4 });
}

// ───────────── dekor (drvena folija) ─────────────
// Tekstura pokriva DEKOR_U × DEKOR_V mm; godovi idu duž U ose (duž profila).
const DEKOR_U = 700;
const DEKOR_V = 175;

/** UV koordinate u milimetrima duž zadate ose (godovi prate dužinu profila/kutije). */
function uvDuz(g: THREE.BufferGeometry, osa: "x" | "y" | "z", pomak = new THREE.Vector3()) {
  const p = g.getAttribute("position");
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + pomak.x;
    const y = p.getY(i) + pomak.y;
    const z = p.getZ(i) + pomak.z;
    const duz = osa === "x" ? x : osa === "y" ? y : z;
    const popr = osa === "x" ? y + z : osa === "y" ? x + z : x + y;
    uv[2 * i] = duz / DEKOR_U;
    uv[2 * i + 1] = popr / DEKOR_V;
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
}

/** Pseudo-slučajni brojevi sa semenom (ista tekstura pri svakom crtanju). */
function rng(seme: number) {
  let s = seme >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/** Tekstura drvenog dekora u boji profila: osnova, talasasti godovi i sitne pore – kao u 2D crtežu. */
function teksturaDekora(hex: string) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 256;
  const g = c.getContext("2d")!;
  // osnova je malo tamnija jer filmsko tonsko mapiranje scene posvetljava boje
  const osnova = new THREE.Color(hex).lerp(new THREE.Color("#000000"), 0.12);
  const css = (k: THREE.Color) => `#${k.getHexString()}`;
  g.fillStyle = css(osnova);
  g.fillRect(0, 0, c.width, c.height);
  const r = rng(parseInt(hex.slice(1), 16));
  const tamna = osnova.clone().lerp(new THREE.Color("#1c0f06"), 0.45);
  const svetla = osnova.clone().lerp(new THREE.Color("#fff3dc"), 0.22);
  // široke trake (različita gustina drveta)
  for (let i = 0; i < 14; i++) {
    const y = r() * c.height;
    const h = 6 + r() * 26;
    g.globalAlpha = 0.08 + r() * 0.12;
    g.fillStyle = css(r() < 0.5 ? tamna : svetla);
    g.fillRect(0, y, c.width, h);
  }
  // godovi: talasaste linije duž cele dužine (bešavno po U jer je period ceo broj talasa)
  for (let i = 0; i < 70; i++) {
    const y0 = r() * c.height;
    const amp = 1 + r() * 5;
    const talasa = 1 + Math.floor(r() * 3);
    const faza = r() * Math.PI * 2;
    g.globalAlpha = 0.12 + r() * 0.35;
    g.strokeStyle = css(r() < 0.75 ? tamna : svetla);
    g.lineWidth = 0.6 + r() * 1.8;
    g.beginPath();
    for (let x = 0; x <= c.width; x += 8) {
      const y = y0 + Math.sin((x / c.width) * Math.PI * 2 * talasa + faza) * amp;
      if (x === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
  }
  // pore
  g.fillStyle = css(tamna);
  for (let i = 0; i < 900; i++) {
    g.globalAlpha = 0.15 + r() * 0.3;
    g.fillRect(r() * c.width, r() * c.height, 3 + r() * 9, 0.8);
  }
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Kosi rez 45° na oba kraja: tačke na krajevima se pomeraju za svoju „visinu“ (y) ka unutra. */
function seci45(g: THREE.BufferGeometry, L: number) {
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const z = pos.getZ(i);
    if (z < 1e-6) pos.setZ(i, y);
    else if (z > L - 1e-6) pos.setZ(i, L - y);
  }
  pos.needsUpdate = true;
  g.computeVertexNormals();
  return g;
}

/** Postavlja geometriju profila: lokalno x → dubina (Z), y → `unutra`, z → `duz`. */
function postavi(g: THREE.BufferGeometry, pocetak: THREE.Vector3, unutra: THREE.Vector3, duz: THREE.Vector3) {
  const m = new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, 1), unutra, duz).setPosition(pocetak);
  g.applyMatrix4(m);
  g.computeVertexNormals();
  return g;
}

type Materijali = { pvc: THREE.Material; epdm: THREE.Material };

function clan(grupa: THREE.Group, p: Presek, mat: Materijali, L: number, pocetak: THREE.Vector3, unutra: THREE.Vector3, duz: THREE.Vector3, kosi: boolean) {
  const delovi: [THREE.BufferGeometry, THREE.Material][] = [[izvuci(p.spoljna, p.komore.map((k) => k.kontura), L), mat.pvc]];
  for (const z of p.zaptivke) delovi.push([izvuci(z.kontura, [], L), mat.epdm]);
  for (const [g, m] of delovi) {
    if (kosi) seci45(g, L);
    uvDuz(g, "z"); // lokalno z = dužina profila → godovi dekora idu duž profila
    const mesh = new THREE.Mesh(postavi(g, pocetak, unutra, duz), m);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    grupa.add(mesh);
  }
}

/** Okvir od 4 člana istog profila oko pravougaonika (spoljna ivica = pravougaonik). */
function okvir(grupa: THREE.Group, p: Presek, mat: Materijali, r: Pravougaonik, z: number) {
  const V = (x: number, y: number) => new THREE.Vector3(x, y, z);
  const desno = new THREE.Vector3(1, 0, 0);
  const levo = new THREE.Vector3(-1, 0, 0);
  const gore = new THREE.Vector3(0, 1, 0);
  const dole = new THREE.Vector3(0, -1, 0);
  clan(grupa, p, mat, r.w, V(r.x, r.y), gore, desno, true); // donji
  clan(grupa, p, mat, r.w, V(r.x, r.y + r.h), dole, desno, true); // gornji
  clan(grupa, p, mat, r.h, V(r.x, r.y), desno, gore, true); // levi
  clan(grupa, p, mat, r.h, V(r.x + r.w, r.y), levo, gore, true); // desni
}

const prosiri = (r: Pravougaonik, d: number): Pravougaonik => ({ x: r.x - d, y: r.y - d, w: r.w + 2 * d, h: r.h + 2 * d });

function kutija(grupa: THREE.Group, mat: THREE.Material, x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, senka = true) {
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const dz = Math.abs(z2 - z1);
  const g = new THREE.BoxGeometry(dx, dy, dz);
  // dekor: godovi duž najduže strane, UV u koordinatama sveta da se šara nastavlja preko delova
  if (mat.userData.dekor) uvDuz(g, dx >= dy && dx >= dz ? "x" : dy >= dz ? "y" : "z", new THREE.Vector3((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2));
  const m = new THREE.Mesh(g, mat);
  m.position.set((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2);
  m.castShadow = senka;
  m.receiveShadow = true;
  grupa.add(m);
  return m;
}

/** Staklo (dvostruko/troslojno) sa distancerom po obodu. */
function staklo(grupa: THREE.Group, mStaklo: THREE.Material, mDist: THREE.Material, r: Pravougaonik, z1: number, z2: number) {
  kutija(grupa, mStaklo, r.x, r.y, z1, r.x + r.w, r.y + r.h, z2, false);
  const u = S.staklo.uvlacenje;
  const a = z1 + 4;
  const b = z2 - 4;
  kutija(grupa, mDist, r.x, r.y, a, r.x + r.w, r.y + u, b, false);
  kutija(grupa, mDist, r.x, r.y + r.h - u, a, r.x + r.w, r.y + r.h, b, false);
  kutija(grupa, mDist, r.x, r.y + u, a, r.x + u, r.y + r.h - u, b, false);
  kutija(grupa, mDist, r.x + r.w - u, r.y + u, a, r.x + r.w, r.y + r.h - u, b, false);
}

/** Ručica (rozeta + poluga) na unutrašnjoj strani krila. Vraća deo koji se okreće (vrat + poluga). */
function rucica(grupa: THREE.Group, mat: THREE.Material, x: number, y: number, z: number, vodoravno: boolean, vrata: boolean, smerKvake: 1 | -1 = -1) {
  const g = new THREE.Group();
  const rozeta = new THREE.Mesh(new THREE.BoxGeometry(30, vrata ? 220 : 78, 10), mat);
  rozeta.position.z = 5;
  rozeta.castShadow = true;
  g.add(rozeta);
  // okretni deo: osa je u vratu ručice
  const yOse = vrata ? 30 : 12;
  const rucka = new THREE.Group();
  rucka.position.set(0, yOse, 0);
  const vrat = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 22, 16), mat);
  vrat.rotation.x = Math.PI / 2;
  vrat.position.set(0, 0, 20);
  rucka.add(vrat);
  // prozor: poluga visi nadole; vrata: kvaka vodoravno ka sredini krila
  const poluga = new THREE.Mesh(new THREE.BoxGeometry(18, 125, 13), mat);
  if (vrata) {
    poluga.rotation.z = Math.PI / 2;
    poluga.position.set(52 * smerKvake, 0, 34);
  } else {
    poluga.position.set(0, -40 - yOse, 34);
  }
  rucka.add(poluga);
  for (const m of rucka.children) m.castShadow = true;
  g.add(rucka);
  g.position.set(x, y, z);
  if (vodoravno) g.rotation.z = Math.PI / 2;
  grupa.add(g);
  return rucka;
}

/** Valjak duž ose X, Y ili Z. */
function valjak(grupa: THREE.Group, mat: THREE.Material, r: number, duzina: number, pos: THREE.Vector3, osa: "x" | "y" | "z") {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, duzina, 20), mat);
  if (osa === "x") m.rotation.z = Math.PI / 2;
  if (osa === "z") m.rotation.x = Math.PI / 2;
  m.position.copy(pos);
  m.castShadow = true;
  grupa.add(m);
  return m;
}

/** Tekstura mrežice komarnika (providna sa tankim nitima). */
function teksturaMreze() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  g.fillStyle = "rgba(40,44,46,0.18)";
  g.fillRect(0, 0, 64, 64);
  g.strokeStyle = "rgba(30,33,35,0.95)";
  g.lineWidth = 3;
  for (let i = 0; i < 4; i++) {
    const p = i * 16 + 8;
    g.beginPath();
    g.moveTo(p, 0);
    g.lineTo(p, 64);
    g.moveTo(0, p);
    g.lineTo(64, p);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Tekstura kaiša roletne (tkana traka sa poprečnim nitima – vidi se kad se kaiš pomera). */
function teksturaKaisa() {
  const c = document.createElement("canvas");
  c.width = 32;
  c.height = 64;
  const g = c.getContext("2d")!;
  g.fillStyle = "#bdb6a6";
  g.fillRect(0, 0, 32, 64);
  g.fillStyle = "#a59e8e";
  for (let y = 0; y < 64; y += 8) g.fillRect(0, y, 32, 3);
  g.fillStyle = "#8f887a";
  g.fillRect(0, 0, 3, 64);
  g.fillRect(29, 0, 3, 64);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Profil lamele roletne (presek 37 × 8,5 mm, blago ispupčen spolja), izvučen duž X. */
function geometrijaLamele(duzina: number) {
  const s = new THREE.Shape();
  // lokalno: x = ka spolja (−Z sveta), y = visina
  s.moveTo(0, 0);
  s.lineTo(0, 37);
  s.lineTo(5, 37);
  s.quadraticCurveTo(10, 18.5, 5, 0);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: duzina, bevelEnabled: false, curveSegments: 6 });
  g.applyMatrix4(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0)));
  g.computeVertexNormals();
  return g;
}

// ───────────── animacija ─────────────
export type StanjeKrila = "zatvoreno" | "otvoreno" | "kip";
type Nacin = "okretno" | "kip" | "klizno";

/** Upravljanje pokretnim delovima 3D modela (krila, roletna, komarnik). */
export type Prozor3DAnimacija = {
  mogucnosti: { otvaranje: boolean; kip: boolean; roletna: boolean; komarnik: boolean };
  postaviKrila(s: StanjeKrila): void;
  /** 0 = podignuta, 1 = spuštena */
  postaviRoletnu(t: number): void;
  /** 0 = podignut, 1 = spušten */
  postaviKomarnik(t: number): void;
  korak(dt: number): void;
};

/** Krak makaza: od ležišta na štoku (a) do klizača koji ide po okovnom žlebu krila (pravac u, dužina L). */
type Krak = { mesh: THREE.Mesh; klizac: THREE.Mesh; a: THREE.Vector3; u: THREE.Vector3; n: THREE.Vector3; L: number };

// ───────────── ivice krila (za okov u falcu) ─────────────
// Svaka ivica ide u krug (dole → desno → gore → levo, gledano iznutra); t = rastojanje duž ivice,
// d = rastojanje od spoljne ivice krila ka sredini.
type Ivica = "dole" | "desno" | "gore" | "levo";
const IVICE: Ivica[] = ["dole", "desno", "gore", "levo"];
const Z_OK = 89; // osa okovnog žleba krila (z)
/** koliko nadgradna kutija roletne viri ka sobi preko unutrašnjeg lica štoka (mm) */
const PREPUST_KUTIJE = 50;

type IvicaGeo = {
  u: THREE.Vector3;
  n: THREE.Vector3;
  duz: number;
  osaNormale: "x" | "y";
  tacka: (t: number, d: number) => THREE.Vector2;
};

function ivice(kr: Pravougaonik): Record<Ivica, IvicaGeo> {
  const napravi = (x0: number, y0: number, ux: number, uy: number, duz: number): IvicaGeo => ({
    u: new THREE.Vector3(ux, uy, 0),
    n: new THREE.Vector3(-uy, ux, 0), // normala ka sredini krila
    duz,
    osaNormale: ux !== 0 ? "y" : "x",
    tacka: (t, d) => new THREE.Vector2(x0 + ux * t - uy * d, y0 + uy * t + ux * d),
  });
  return {
    dole: napravi(kr.x, kr.y, 1, 0, kr.w),
    desno: napravi(kr.x + kr.w, kr.y, 0, 1, kr.h),
    gore: napravi(kr.x + kr.w, kr.y + kr.h, -1, 0, kr.w),
    levo: napravi(kr.x, kr.y + kr.h, 0, -1, kr.h),
  };
}

/** Kutija duž ivice: od t1 do t2, od d1 do d2 (ka sredini), od z1 do z2. */
function duzIvice(g: THREE.Group, mat: THREE.Material, e: IvicaGeo, t1: number, t2: number, d1: number, d2: number, z1: number, z2: number) {
  const p1 = e.tacka(t1, d1);
  const p2 = e.tacka(t2, d2);
  return kutija(g, mat, p1.x, p1.y, z1, p2.x, p2.y, z2);
}

type KriloAnim = {
  T: THREE.Group; // klizanje
  O: THREE.Group; // okretanje oko vertikalne ose šarki
  K: THREE.Group; // kip oko donje vodoravne ose
  kg: THREE.Group; // samo krilo
  rucka?: THREE.Object3D;
  uglovi: Partial<Record<Nacin, number>>; // ugao ručice za svaki način
  okretno?: number; // najveći ugao okretanja (sa znakom)
  kip?: number;
  klizno?: { smer: 1 | -1; put: number };
  pomocno: boolean; // pasivno štulp krilo – otvara se posle aktivnog, nema kip
  vrata: boolean; // kvaka se pritisne pa vrati
  krakovi: Krak[];
  sine: { g: THREE.Group; u: THREE.Vector3 }[]; // pokretni delovi okovne šine (zatvarači)
  m: Nacin | null;
  p: number;
  a: number;
  cilj: Nacin | null;
};

const glatko = (t: number) => t * t * (3 - 2 * t);
const do1 = (t: number) => Math.min(1, Math.max(0, t));
const ka = (v: number, cilj: number, korak: number) => (Math.abs(cilj - v) <= korak ? cilj : v + Math.sign(cilj - v) * korak);

const sirinaIzNaziva = (naziv: string | null | undefined, podr: number) => {
  const m = naziv?.match(/(\d{2,3})\s*mm/);
  return m ? Number(m[1]) : podr;
};

// ───────────── glavna funkcija ─────────────
export function napraviProzor3D(par: Prozor3DParametri) {
  const grupa = new THREE.Group();
  const rasp = napraviRaspored(par.definicija, par.sirina, par.visina, par.mere);
  const vrata = par.vrsta === "VRATA";

  // bela ostaje kao do sada; tamnije boje (dekor/folija) su mat sa blagim sjajem
  const obojen = !!par.boja && par.boja.toLowerCase() !== "#f6f6f1";
  const boja = obojen ? par.boja! : par.alu ? "#a7adb1" : "#f6f6f1";
  // drveni dekor (zlatni hrast, orah, mahagoni…) dobija teksturu godova, isto kao u 2D crtežu
  const dekor = obojen && jeDekor(boja);
  const tDekor = dekor ? teksturaDekora(boja) : null;
  const pvc = new THREE.MeshPhysicalMaterial({
    color: dekor ? "#ffffff" : boja,
    map: tDekor,
    roughness: dekor ? 0.62 : obojen ? 0.5 : par.alu ? 0.45 : 0.32,
    metalness: par.alu && !obojen ? 0.65 : par.alu ? 0.35 : 0,
    clearcoat: par.alu ? 0 : dekor ? 0.08 : obojen ? 0.2 : 0.35,
    clearcoatRoughness: 0.4,
    side: THREE.DoubleSide,
  });
  pvc.userData.dekor = dekor;
  /** materijal dodatka (kutija, lamele…) u boji prozora – sa dekorom ako ga prozor ima */
  const uBoji = (o: THREE.MeshStandardMaterialParameters) => {
    const m = new THREE.MeshStandardMaterial(dekor ? { ...o, color: "#ffffff", map: tDekor, metalness: 0.05, roughness: 0.6 } : o);
    m.userData.dekor = dekor;
    return m;
  };
  const epdm = new THREE.MeshStandardMaterial({ color: "#151617", roughness: 0.85, side: THREE.DoubleSide });
  const mStaklo = new THREE.MeshPhysicalMaterial({
    color: "#cfe7ec",
    roughness: 0.04,
    metalness: 0,
    transparent: true,
    opacity: 0.22,
    clearcoat: 1,
    depthWrite: false,
  });
  const mDist = new THREE.MeshStandardMaterial({ color: "#2b2f31", roughness: 0.6 });
  const mOkov = new THREE.MeshStandardMaterial({ color: "#e9eaea", metalness: 0.55, roughness: 0.3 });
  const mPanel = new THREE.MeshPhysicalMaterial({ color: "#f3f3ef", roughness: 0.5, clearcoat: 0.2 });
  const mDodatak = new THREE.MeshStandardMaterial({ color: "#dfe2e1", metalness: 0.35, roughness: 0.45 });
  const mMreza = new THREE.MeshStandardMaterial({ color: "#2e3335", transparent: true, opacity: 0.38, side: THREE.DoubleSide, depthWrite: false });
  const mat: Materijali = { pvc, epdm };

  // Ram
  okvir(grupa, BE92_RAM, mat, rasp.ram, 0);

  // Prečke
  for (const pr of rasp.precke) {
    const L = pr.do - pr.od;
    if (pr.smer === "V") clan(grupa, BE92_PRECKA, mat, L, new THREE.Vector3(pr.osa, pr.od, 0), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), false);
    else clan(grupa, BE92_PRECKA, mat, L, new THREE.Vector3(pr.od, pr.osa, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0), false);
  }

  // šarke: poklopci u boji profila (bele na belom prozoru), osovina od metala
  const mSarka = new THREE.MeshStandardMaterial({ color: obojen ? boja : "#eeeeea", roughness: 0.35, metalness: 0.1 });
  // okov u falcu: pocinkovani čelik (srebrn), prenosnici malo tamniji
  const mCelik = new THREE.MeshStandardMaterial({ color: "#b9bec2", metalness: 0.85, roughness: 0.32 });
  const mCelikT = new THREE.MeshStandardMaterial({ color: "#8f969b", metalness: 0.8, roughness: 0.4 });

  // Polja
  const K = S.krilo;
  const zOsa = K.pomakZ + K.dubina + 6; // osa šarki je malo ispred unutrašnjeg lica krila
  const krila: (KriloAnim & { polje: (typeof rasp.polja)[number] })[] = [];
  for (const p of rasp.polja) {
    if (!p.krilo) {
      // fiksno staklo u štoku/prečki (iznad peraje), lajsna na adapteru sa unutrašnje strane
      const st = prosiri(p.svetlo, S.fiks.staklo);
      if (vrata && par.panel) kutija(grupa, mPanel, st.x, st.y, S.staklo.zFiks + 6, st.x + st.w, st.y + st.h, S.staklo.zFiks + S.staklo.debljina - 6);
      else staklo(grupa, mStaklo, mDist, st, S.staklo.zFiks, S.staklo.zFiks + S.staklo.debljina);
      okvir(grupa, BE92_LAJSNA, mat, prosiri(p.svetlo, S.fiks.lajsna), S.lajsnaFiks.z);
      continue;
    }
    const kr = p.krilo;
    const o = p.otvaranje;
    // krilo se gradi u sopstvenoj grupi (u koordinatama sveta), pa se okači o ose šarki
    const kg = new THREE.Group();
    okvir(kg, BE92_KRILO, mat, kr, K.pomakZ);
    const st = prosiri(kr, -K.podStakla);
    const z1 = K.pomakZ + S.staklo.zKrilo;
    const krVrata = o === "VRATA_L" || o === "VRATA_D";
    if (krVrata && par.panel) kutija(kg, mPanel, st.x, st.y, z1 + 6, st.x + st.w, st.y + st.h, z1 + S.staklo.debljina - 6);
    else staklo(kg, mStaklo, mDist, st, z1, z1 + S.staklo.debljina);
    okvir(kg, BE92_LAJSNA, mat, prosiri(kr, -K.sedisteLajsne), K.pomakZ + K.xLajsne);

    // ručica: suprotno od šarki; kip – gore na sredini; pomoćno štulp krilo nema ručicu
    const zR = K.pomakZ + K.dubina;
    const yR = kr.y + (krVrata ? Math.min(1050, kr.h / 2) : kr.h / 2);
    let rucka: THREE.Object3D | undefined;
    let ruckaSmer: 1 | -1 = 1;
    if (o === "KIP") {
      rucka = rucica(kg, mOkov, kr.x + kr.w / 2, kr.y + kr.h - 40, zR, true, false);
      ruckaSmer = -1;
    } else if (o === "ON_L" || o === "VRATA_L" || o === "PSK_L" || o === "HST_L") {
      rucka = rucica(kg, mOkov, kr.x + kr.w - 38, yR, zR, false, krVrata);
      ruckaSmer = -1; // poluga se okreće ka šarkama (levo)
    } else if (o === "ON_D" || o === "VRATA_D" || o === "PSK_D" || o === "HST_D") {
      rucka = rucica(kg, mOkov, kr.x + 38, yR, zR, false, krVrata, 1);
      ruckaSmer = 1;
    }

    const levo = o === "ON_L" || o === "O_L" || o === "VRATA_L";
    const desno = o === "ON_D" || o === "O_D" || o === "VRATA_D";
    const pomocno = o === "O_L" || o === "O_D";
    const ax = levo ? kr.x - 4 : kr.x + kr.w + 4;
    const ky = kr.y - 4;

    // T (klizanje) → O (okretanje, osa x=ax, z=zOsa) → K (kip, osa y=ky, z=zOsa) → krilo
    const T = new THREE.Group();
    const O = new THREE.Group();
    O.position.set(ax, 0, zOsa);
    const Kg = new THREE.Group();
    Kg.position.set(-ax, ky, 0);
    kg.position.set(0, -ky, -zOsa);
    Kg.add(kg);
    O.add(Kg);
    T.add(O);
    grupa.add(T);

    const a: KriloAnim & { polje: typeof p } = {
      polje: p,
      T,
      O,
      K: Kg,
      kg,
      rucka,
      uglovi: {},
      pomocno,
      vrata: krVrata,
      krakovi: [],
      sine: [],
      m: null,
      p: 0,
      a: 0,
      cilj: null,
    };
    const pola = Math.PI / 2;
    if (levo || desno) {
      a.okretno = (levo ? -1 : 1) * (krVrata ? 1.62 : 1.5);
      // prozor: ručica vodoravno; vrata: kvaka se pritisne nadole (~35°)
      a.uglovi.okretno = krVrata ? -ruckaSmer * 0.6 : ruckaSmer * pola;
    }
    if (o === "ON_L" || o === "ON_D" || o === "KIP" || o === "PSK_L" || o === "PSK_D") {
      // vrh krila ide ka unutra ~12 cm (kao pravi kip)
      a.kip = Math.min(0.2, Math.asin(Math.min(1, 120 / kr.h)));
      a.uglovi.kip = o === "KIP" ? ruckaSmer * pola : ruckaSmer * Math.PI;
    }
    if (o.startsWith("PSK") || o.startsWith("HST")) {
      a.klizno = { smer: o.endsWith("_L") ? -1 : 1, put: kr.w * 0.85 };
      a.uglovi.klizno = ruckaSmer * Math.PI;
    }
    krila.push(a);

    // ── šarke ──
    if (krVrata && (levo || desno)) {
      // vrata: 3 cilindrične šarke sa pločicama na štoku i krilu
      const sg = levo ? 1 : -1;
      for (const yc of [kr.y + 250, kr.y + kr.h / 2 + 100, kr.y + kr.h - 250]) {
        kutija(grupa, mOkov, ax - sg * 30, yc - 50, S.dubinaRama, ax - sg * 4, yc + 50, zOsa);
        valjak(grupa, mOkov, 10, 105, new THREE.Vector3(ax, yc, zOsa), "y");
        kutija(kg, mOkov, ax + sg * 4, yc - 45, K.pomakZ + K.dubina, ax + sg * 34, yc + 45, zOsa + 4);
      }
    } else if (levo || desno) {
      // prozor: donja (ugaona) i gornja šarka, poklopci u boji profila
      const sg = levo ? 1 : -1;
      for (const yc of [kr.y + 60, kr.y + kr.h - 60]) {
        kutija(grupa, mSarka, ax - sg * 18, yc - 28, S.dubinaRama, ax - sg * 3, yc + 28, zOsa + 4);
        valjak(grupa, mSarka, 7, 60, new THREE.Vector3(ax, yc, zOsa), "y");
        valjak(grupa, mOkov, 3.5, 66, new THREE.Vector3(ax, yc, zOsa), "y");
        kutija(kg, mSarka, ax + sg * 3, yc - 22, K.pomakZ + K.dubina, ax + sg * 48, yc + 22, zOsa + 3);
      }
    } else if (o === "KIP") {
      // samo kip: dve vodoravne šarke dole
      for (const xc of [kr.x + 90, kr.x + kr.w - 90]) {
        kutija(grupa, mSarka, xc - 28, ky - 18, S.dubinaRama, xc + 28, ky - 3, zOsa + 4);
        valjak(grupa, mSarka, 7, 60, new THREE.Vector3(xc, ky, zOsa), "x");
        kutija(kg, mSarka, xc - 22, ky + 3, K.pomakZ + K.dubina, xc + 22, ky + 48, zOsa + 3);
      }
    }

    // ── okov u falcu ──
    // Prostor između ivice krila i štoka: d = 1,5 … 22 mm od spoljne ivice krila ka sredini,
    // z ≈ 81 … 97 (okovni žleb krila, osa 89). Kad je krilo zatvoreno, sve je skriveno iza preklopa krila.
    const stranaRucke: Ivica | null =
      o === "KIP" ? "gore" : o === "ON_L" || o === "VRATA_L" || o === "PSK_L" || o === "HST_L" ? "desno" : o === "ON_D" || o === "VRATA_D" || o === "PSK_D" || o === "HST_D" ? "levo" : null;
    const tRucke = stranaRucke === "desno" ? yR - kr.y : stranaRucke === "levo" ? kr.y + kr.h - yR : kr.w / 2;
    const iv = ivice(kr);
    const ivicaStulpa: Ivica | null = p.stulp === "desno" ? "desno" : p.stulp === "levo" ? "levo" : null;
    for (const ime of IVICE) {
      if (ime === ivicaStulpa) continue;
      const e = iv[ime];
      // pokretni deo šine (zatvarači) – pomera se duž ivice kad se okrene ručica
      const pomicno = new THREE.Group();
      kg.add(pomicno);
      a.sine.push({ g: pomicno, u: e.u.clone() });
      // ugaoni prenosnici na krajevima i šina između
      duzIvice(kg, mCelikT, e, 22, 62, 17.5, 22, Z_OK - 9, Z_OK + 9);
      duzIvice(kg, mCelikT, e, e.duz - 62, e.duz - 22, 17.5, 22, Z_OK - 9, Z_OK + 9);
      duzIvice(kg, mCelik, e, 62, e.duz - 62, 19.5, 22, Z_OK - 8, Z_OK + 8);
      if (ime === stranaRucke) {
        if (krVrata) {
          // brava sa jezičkom i rezom
          duzIvice(kg, mCelikT, e, tRucke - 130, tRucke + 130, 12, 22, 70, 100);
          duzIvice(kg, mCelik, e, tRucke - 12, tRucke + 12, 5, 12, Z_OK - 6, Z_OK + 6);
          duzIvice(kg, mCelik, e, tRucke + 70, tRucke + 95, 6, 12, Z_OK - 7, Z_OK + 7);
        } else {
          // kremona (prenosnik ručice) i blokada pogrešnog položaja ručice
          duzIvice(kg, mCelikT, e, tRucke - 110, tRucke + 110, 15, 22, Z_OK - 10, Z_OK + 10);
          duzIvice(kg, mDist, e, tRucke + 125, tRucke + 155, 14, 22, Z_OK - 6, Z_OK + 6);
        }
      }
      // gljivasti zatvarači na šini + prihvatnici na štoku
      const n = Math.max(1, Math.ceil((e.duz - 200) / 700));
      for (let i = 0; i < n; i++) {
        const t = 100 + ((e.duz - 200) * (i + 0.5)) / n;
        if (ime === stranaRucke && Math.abs(t - tRucke) < 160) continue;
        const c = e.tacka(t, 15.5);
        valjak(pomicno, mCelik, 4, 7, new THREE.Vector3(c.x, c.y, Z_OK), e.osaNormale);
        const gl = e.tacka(t, 11.5);
        valjak(pomicno, mCelik, 6.5, 3, new THREE.Vector3(gl.x, gl.y, Z_OK), e.osaNormale);
        // prihvatnik: telo na falcu štoka + kuka iza glave zatvarača
        duzIvice(grupa, mCelik, e, t - 29, t + 1, 1.5, 8, 80, 95);
        duzIvice(grupa, mCelik, e, t - 29, t + 1, 8, 13.5, 95.5, 99);
      }
    }
    // podizač krila: rampa na štoku i točkić na krilu, dole na strani ručice
    if ((levo || desno) && stranaRucke) {
      const e = iv.dole;
      const t = stranaRucke === "desno" ? e.duz - 100 : 100;
      duzIvice(grupa, mCelikT, e, t - 25, t + 25, 1.5, 9, 80, 96);
      const c = e.tacka(t, 15.5);
      valjak(kg, mDist, 4.5, 14, new THREE.Vector3(c.x, c.y, Z_OK), "z");
    }

    // ── makaze (kip): ležište na štoku, krak i klizač u okovnom žlebu krila ──
    const makaze = (ime: Ivica, tA: number, smer: 1 | -1, L: number) => {
      const e = iv[ime];
      const A = e.tacka(tA, 14);
      const a3 = new THREE.Vector3(A.x, A.y, Z_OK);
      // ležište makaza na štoku
      duzIvice(grupa, mCelikT, e, tA - 30, tA + 30, 1.5, 10, 80, 97);
      const krakM = new THREE.Mesh(new THREE.BoxGeometry(1, 4, 12), mCelik);
      const klizac = new THREE.Mesh(new THREE.BoxGeometry(34, 6, 16), mCelikT);
      krakM.castShadow = klizac.castShadow = true;
      grupa.add(krakM, klizac);
      a.krakovi.push({ mesh: krakM, klizac, a: a3, u: e.u.clone().multiplyScalar(smer), n: e.n.clone(), L });
    };
    if (o === "ON_L" || o === "ON_D") {
      // gore, kod šarki; krak klizi ka sredini krila
      const L = Math.min(600, Math.max(250, kr.w * 0.55));
      if (levo) makaze("gore", kr.w - 40, -1, L);
      else makaze("gore", 40, 1, L);
    } else if (o === "KIP") {
      // dve bočne makaze pri vrhu
      const L = Math.min(350, Math.max(150, kr.h * 0.45));
      makaze("levo", 40, 1, L);
      makaze("desno", kr.h - 40, -1, L);
    }
  }

  // Štulp: lažna prečka 176030 (34 × 96 mm) na spoju krila – ide sa pomoćnim (pasivnim) krilom
  const L = S.lazna;
  for (const s of rasp.stulpovi) {
    const par2 = krila.filter((k) => k.polje.stulp && k.polje.krilo && (Math.abs(k.polje.krilo.x + k.polje.krilo.w - 4 - s.x) < 1 || Math.abs(k.polje.krilo.x + 4 - s.x) < 1));
    const pasivno = par2.find((k) => k.pomocno) ?? par2.find((k) => k.polje.stulp === "desno") ?? par2[0];
    if (pasivno) pasivno.pomocno = true;
    kutija(pasivno?.kg ?? grupa, pvc, s.x - L.sirina / 2, s.y + 30, K.pomakZ, s.x + L.sirina / 2, s.y + s.h - 30, K.pomakZ + L.dubina);
  }
  // pasivno krilo nema kip
  for (const k of krila) if (k.pomocno) delete k.kip;

  // Proširenja i podštok
  const { prosirenjeL: pl, prosirenjeD: pd, podstok: ps } = par.mere;
  const W = par.sirina;
  const H = par.visina;
  if (pl > 0) kutija(grupa, pvc, 0, ps, 6, pl, H, 86);
  if (pd > 0) kutija(grupa, pvc, W - pd, ps, 6, W, H, 86);
  if (ps > 0) kutija(grupa, pvc, 0, 0, 10, W, ps, 82);

  const imaKomarnik = !!par.dodaci.komarnik;

  // Roletna: kutija iznad, vodilice sa spoljne strane, lamele, kaiš i namotač unutra – u boji prozora
  let roletna: { dMin: number; dMax: number; d: number; cilj: number; postavi: (d: number) => void } | null = null;
  if (par.dodaci.roletna) {
    const rh = par.dodaci.roletnaVisina ?? 180;
    const mRol = obojen ? uBoji({ color: boja, metalness: 0.3, roughness: 0.5 }) : mDodatak;
    const mKapa = uBoji({ color: obojen ? boja : "#cfd3d2", roughness: 0.55, metalness: 0.2 });
    // nadgradna kutija je dublja od štoka i viri ka sobi (revizioni poklopac je iznutra odozdo)
    const prepust = Math.max(0, par.dodaci.roletnaPrepust ?? PREPUST_KUTIJE);
    const zUn = S.dubinaRama + prepust;
    const zPred = Math.min(-50, zUn - rh);
    kutija(grupa, mRol, 0, H, zPred, W, H + rh, zUn);
    // bočne kape kutije
    kutija(grupa, mKapa, -4, H, zPred - 2, 0, H + rh + 2, zUn + 2);
    kutija(grupa, mKapa, W, H, zPred - 2, W + 4, H + rh + 2, zUn + 2);
    // revizioni poklopac na donjoj strani prepusta (sa fugom oko njega)
    kutija(grupa, mDist, 6, H - 0.6, S.dubinaRama + 3, W - 6, H, zUn - 3, false);
    kutija(grupa, mRol, 9, H - 1.6, S.dubinaRama + 6, W - 9, H - 0.4, zUn - 6);
    // vodilice: sa komarnikom su dvokanalne (dublje) – roletna spolja, komarnik do prozora
    const dubV = imaKomarnik ? 46 : 26;
    kutija(grupa, mRol, 0, ps, -dubV, 26, H, 0);
    kutija(grupa, mRol, W - 26, ps, -dubV, W, H, 0);
    const zLam = imaKomarnik ? -30 : -9; // unutrašnje lice lamele

    // lamele (instancirane) + završna lamela sa gumom
    const mLam = uBoji({ color: obojen ? boja : "#eef0ee", roughness: 0.5, metalness: obojen ? 0.15 : 0.05, side: THREE.DoubleSide });
    const sirL = W - 2 * 16;
    const n = Math.ceil((H - ps) / 37) + 2;
    const gLam = geometrijaLamele(sirL);
    if (dekor) uvDuz(gLam, "x"); // godovi duž lamele
    const lamele = new THREE.InstancedMesh(gLam, mLam, n);
    lamele.castShadow = true;
    lamele.receiveShadow = true;
    lamele.frustumCulled = false;
    grupa.add(lamele);
    const zavrsna = new THREE.Group();
    kutija(zavrsna, uBoji({ color: obojen ? boja : "#d9dcdb", metalness: 0.45, roughness: 0.4 }), 16, 6, zLam - 11, W - 16, 44, zLam);
    kutija(zavrsna, epdm, 18, 0, zLam - 9, W - 18, 6, zLam - 2);
    // zaustavljači na vrhu završne lamele (da ne uđe u kutiju)
    for (const xs of [W * 0.2, W * 0.8]) kutija(zavrsna, epdm, xs - 12, 44, zLam - 14, xs + 12, 58, zLam - 1);
    grupa.add(zavrsna);

    // kaiš: izlazi kroz uvodnik sa četkicama na dnu prepusta kutije i ide do namotača
    // (unutra, na izabranoj strani). Kaiš je standardne sivo-bež boje; uvodnik i namotač su beli, kao ručica.
    const xK = par.dodaci.roletnaKais === "L" ? 12 : W - 12;
    const zK = S.dubinaRama + Math.max(prepust / 2, 12); // bez prepusta uvodnik ide uz unutrašnje lice kutije
    const mNam = new THREE.MeshPhysicalMaterial({ color: "#f2f2ef", roughness: 0.35, clearcoat: 0.3 });
    kutija(grupa, mNam, xK - 15, H - 8, zK - 12, xK + 15, H, zK + 12); // uvodnik
    kutija(grupa, epdm, xK - 10, H - 8.5, zK - 2, xK + 10, H - 7, zK + 2); // četkice / prorez
    const yN = ps + Math.max(140, Math.min(950, (H - ps) * 0.42));
    const hN = 170;
    const zZid = S.dubinaRama + 1; // namotač je pričvršćen uz štok/zid
    const dubN = Math.max(24, (zK - zZid) * 2);// kaiš ulazi u sredinu namotača
    const nam = new THREE.Group();
    kutija(nam, mNam, -20, -hN / 2, 0, 20, hN / 2, dubN);
    kutija(nam, mNam, -17, -hN / 2 + 4, dubN, 17, hN / 2 - 4, dubN + 3);
    kutija(nam, epdm, -10, hN / 2 - 2, dubN / 2 - 3, 10, hN / 2 + 0.5, dubN / 2 + 3); // prorez za kaiš
    valjak(nam, mDist, 5, 4, new THREE.Vector3(0, -hN / 2 + 26, dubN + 4), "z"); // dugme za otpuštanje
    nam.position.set(xK, yN, zZid);
    grupa.add(nam);
    const duzK = H - 8 - (yN + hN / 2);
    const tKais = teksturaKaisa();
    tKais.repeat.set(1, duzK / 22);
    const kais = new THREE.Mesh(new THREE.PlaneGeometry(16, duzK), new THREE.MeshStandardMaterial({ map: tKais, roughness: 0.9, side: THREE.DoubleSide }));
    kais.position.set(xK, yN + hN / 2 + duzK / 2, zK);
    grupa.add(kais);

    const mat4 = new THREE.Matrix4();
    const r = {
      dMin: 30,
      dMax: H - ps,
      d: 30,
      cilj: 30,
      postavi(d: number) {
        // kaiš se pomera dok se roletna diže/spušta
        tKais.offset.y += (r.d - d) / 22;
        r.d = d;
        const dno = H - d;
        zavrsna.position.set(0, dno, 0);
        let i = 0;
        for (; i < n; i++) {
          const yb = dno + 44 + i * 37;
          if (yb >= H) break;
          mat4.makeTranslation(16, yb, zLam);
          lamele.setMatrixAt(i, mat4);
        }
        lamele.count = i;
        lamele.instanceMatrix.needsUpdate = true;
      },
    };
    r.postavi(30);
    roletna = r;
  }

  // Komarnik (rolo): kaseta gore i vodilice; mrežica se odmotava nadole.
  // Uz roletnu ide u njenu kutiju i dvokanalne vodilice.
  let komarnik: { t: number; cilj: number; brzina: number; postavi: (t: number) => void } | null = null;
  if (imaKomarnik) {
    const mMrezaT = mMreza.clone() as THREE.MeshStandardMaterial;
    const tMreza = teksturaMreze();
    mMrezaT.map = tMreza;
    mMrezaT.opacity = 1;
    mMrezaT.color.set("#ffffff");
    let x1: number, x2: number, vrhM: number, dnoM: number, zM: number;
    if (par.dodaci.roletna) {
      x1 = 16;
      x2 = W - 16;
      vrhM = H;
      dnoM = ps;
      zM = -10;
    } else {
      const r = prosiri(rasp.svetlo, 30);
      const kH = 55;
      kutija(grupa, mDodatak, r.x, r.y + r.h - kH, -52, r.x + r.w, r.y + r.h, 0); // kaseta
      kutija(grupa, mDodatak, r.x, r.y, -24, r.x + 24, r.y + r.h - kH, 0);
      kutija(grupa, mDodatak, r.x + r.w - 24, r.y, -24, r.x + r.w, r.y + r.h - kH, 0);
      x1 = r.x + 12;
      x2 = r.x + r.w - 12;
      vrhM = r.y + r.h - kH;
      dnoM = r.y;
      zM = -12;
    }
    const mreza = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mMrezaT);
    mreza.position.set((x1 + x2) / 2, vrhM, zM);
    mreza.visible = false;
    grupa.add(mreza);
    const letva = new THREE.Group();
    const hL = 28;
    kutija(letva, mDodatak, x1 + 8, -hL, zM - 9, x2 - 8, 0, zM + 9);
    kutija(letva, epdm, (x1 + x2) / 2 - 30, -hL - 12, zM - 14, (x1 + x2) / 2 + 30, -hL + 4, zM - 6); // jezičak za povlačenje
    grupa.add(letva);
    const hMax = vrhM - dnoM - hL;
    const k = {
      t: 0,
      cilj: 0,
      brzina: 600 / Math.max(300, hMax),
      postavi(t: number) {
        k.t = t;
        const h = Math.max(0.5, t * hMax);
        mreza.visible = t > 0.002;
        mreza.scale.set(x2 - x1, h, 1);
        mreza.position.y = vrhM - h / 2;
        tMreza.repeat.set((x2 - x1) / 12, h / 12);
        letva.position.y = vrhM - t * hMax;
      },
    };
    k.postavi(0);
    komarnik = k;
  }

  // Okapnica (spolja) i daska (unutra) ispod pozicije
  if (par.dodaci.okapnica) {
    const d = sirinaIzNaziva(par.dodaci.okapnica, 150);
    const ok = kutija(grupa, mDodatak, -25, -8, -d, W + 25, 0, 12);
    ok.rotation.x = -0.06;
  }
  if (par.dodaci.daska) {
    const d = sirinaIzNaziva(par.dodaci.daska, 200);
    kutija(grupa, mPanel, -40, -20, S.dubinaRama - 10, W + 40, 0, S.dubinaRama - 10 + d);
  }

  // ── upravljanje pokretima ──
  const BRZINA_KRILA = 0.75; // deo puta u sekundi
  const BRZINA_RUCKE = Math.PI * 2; // rad/s
  const v1 = new THREE.Vector3();
  const v2 = new THREE.Vector3();

  const prikaziKrilo = (k: KriloAnim) => {
    const e = glatko(k.pomocno ? do1((k.p - 0.45) / 0.55) : k.p);
    k.T.position.set(0, 0, 0);
    k.O.rotation.y = 0;
    k.K.rotation.x = 0;
    if (k.m === "okretno" && k.okretno) k.O.rotation.y = k.okretno * e;
    else if (k.m === "kip" && k.kip) k.K.rotation.x = k.kip * e;
    else if (k.m === "klizno" && k.klizno) {
      // podizanje/odmicanje od rama, pa klizanje u stranu
      k.T.position.z = 75 * glatko(do1(k.p / 0.25));
      k.T.position.x = k.klizno.smer * k.klizno.put * glatko(do1((k.p - 0.25) / 0.75));
    }
    // kvaka na vratima se pritisne, a kad krenu da se otvaraju – pusti
    if (k.rucka) k.rucka.rotation.z = k.vrata ? k.a * (1 - glatko(do1(k.p / 0.2))) : k.a;
    // zatvarači se pomeraju duž ivica dok se okreće ručica (zatvoreno = iza prihvatnika)
    const pun = Math.abs(k.uglovi.okretno ?? k.uglovi.kip ?? k.uglovi.klizno ?? Math.PI / 2) || 1;
    const s = 16 * Math.min(1.5, Math.abs(k.a) / (k.vrata ? pun : Math.PI / 2));
    for (const sn of k.sine) sn.g.position.copy(sn.u).multiplyScalar(s);
    if (k.krakovi.length) postaviMakaze(k);
  };

  // makaze: na kipu je ležište na štoku nepomično, a klizač ide po žlebu krila tako da krak
  // ostane iste dužine; inače (zatvoreno/okretno) makaze leže u falcu i idu sa krilom
  const naKrilu = (k: KriloAnim, t: THREE.Vector3, izlaz: THREE.Vector3) => grupa.worldToLocal(k.kg.localToWorld(izlaz.copy(t)));
  const P0 = new THREE.Vector3();
  const U = new THREE.Vector3();
  const N = new THREE.Vector3();
  const A = new THREE.Vector3();
  const B = new THREE.Vector3();
  const pom = new THREE.Vector3();
  const mBaza = new THREE.Matrix4();
  const orijentisi = (m: THREE.Object3D, x: THREE.Vector3, n: THREE.Vector3) => {
    const y = pom.copy(n).addScaledVector(x, -n.dot(x)).normalize();
    const z = v2.crossVectors(x, y);
    mBaza.makeBasis(x, y, z);
    m.quaternion.setFromRotationMatrix(mBaza);
  };
  const postaviMakaze = (k: KriloAnim) => {
    grupa.updateMatrixWorld(true);
    for (const kr of k.krakovi) {
      naKrilu(k, kr.a, P0);
      naKrilu(k, v1.copy(kr.a).add(kr.u), U).sub(P0).normalize();
      naKrilu(k, v1.copy(kr.a).add(kr.n), N).sub(P0).normalize();
      if (k.m === "kip" && k.p > 0) {
        A.copy(kr.a);
        const w = v1.subVectors(P0, A);
        const b = U.dot(w);
        const t = -b + Math.sqrt(Math.max(0, b * b - (w.lengthSq() - kr.L * kr.L)));
        B.copy(P0).addScaledVector(U, t);
      } else {
        A.copy(P0);
        B.copy(P0).addScaledVector(U, kr.L);
      }
      const smer = v1.subVectors(B, A);
      const len = smer.length();
      smer.normalize();
      kr.mesh.scale.set(Math.max(1, len), 1, 1);
      kr.mesh.position.addVectors(A, B).multiplyScalar(0.5);
      orijentisi(kr.mesh, smer, N);
      kr.klizac.position.copy(B);
      orijentisi(kr.klizac, U, N);
    }
  };
  for (const k of krila) prikaziKrilo(k);

  const ciljZa = (k: KriloAnim, s: StanjeKrila): Nacin | null => {
    if (s === "zatvoreno") return null;
    if (s === "kip") return k.kip ? "kip" : null;
    return k.okretno ? "okretno" : k.klizno ? "klizno" : k.kip ? "kip" : null;
  };

  const anim: Prozor3DAnimacija = {
    mogucnosti: {
      otvaranje: krila.some((k) => k.okretno || k.klizno || k.kip),
      kip: krila.some((k) => k.kip),
      roletna: !!roletna,
      komarnik: !!komarnik,
    },
    postaviKrila(s) {
      for (const k of krila) k.cilj = ciljZa(k, s);
    },
    postaviRoletnu(t) {
      if (roletna) roletna.cilj = roletna.dMin + do1(t) * (roletna.dMax - roletna.dMin);
    },
    postaviKomarnik(t) {
      if (komarnik) komarnik.cilj = do1(t);
    },
    korak(dt) {
      dt = Math.min(dt, 0.1);
      for (const k of krila) {
        const staro = [k.p, k.a, k.m];
        if (k.p > 0 && k.m !== k.cilj) {
          // prvo zatvori krilo, pa tek onda okreni ručicu
          k.p = Math.max(0, k.p - dt * BRZINA_KRILA);
        } else if (k.m !== k.cilj) {
          const ugao = k.cilj ? k.uglovi[k.cilj] ?? 0 : 0;
          k.a = k.rucka ? ka(k.a, ugao, dt * BRZINA_RUCKE) : ugao;
          if (k.a === ugao) k.m = k.cilj;
        } else if (k.cilj) {
          k.p = Math.min(1, k.p + dt * BRZINA_KRILA);
        }
        if (staro[0] !== k.p || staro[1] !== k.a || staro[2] !== k.m) prikaziKrilo(k);
      }
      if (roletna && roletna.d !== roletna.cilj) roletna.postavi(ka(roletna.d, roletna.cilj, dt * 420));
      if (komarnik && komarnik.t !== komarnik.cilj) komarnik.postavi(ka(komarnik.t, komarnik.cilj, dt * komarnik.brzina));
    },
  };

  return { grupa, anim };
}

/** Oslobađa memoriju svih geometrija i materijala u grupi. */
export function oslobodi(grupa: THREE.Object3D) {
  const materijali = new Set<THREE.Material>();
  grupa.traverse((o) => {
    const m = o as THREE.Mesh;
    m.geometry?.dispose();
    const mat = m.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(mat)) mat.forEach((x) => materijali.add(x));
    else if (mat) materijali.add(mat);
  });
  materijali.forEach((m) => {
    (m as THREE.MeshStandardMaterial).map?.dispose();
    m.dispose();
  });
}
