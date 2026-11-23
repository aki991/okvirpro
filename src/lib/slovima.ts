// Iznos slovima na srpskom (latinica), za ugovore i račune.

const JED = ["", "jedan", "dva", "tri", "četiri", "pet", "šest", "sedam", "osam", "devet"];
const NAEST = ["deset", "jedanaest", "dvanaest", "trinaest", "četrnaest", "petnaest", "šesnaest", "sedamnaest", "osamnaest", "devetnaest"];
const DES = ["", "", "dvadeset", "trideset", "četrdeset", "pedeset", "šezdeset", "sedamdeset", "osamdeset", "devedeset"];
const STO = ["", "sto", "dvesta", "trista", "četiristo", "petsto", "šeststo", "sedamsto", "osamsto", "devetsto"];

function doHiljadu(n: number, zenski = false): string {
  const s = Math.floor(n / 100);
  const ost = n % 100;
  const delovi: string[] = [];
  if (s) delovi.push(STO[s]);
  if (ost >= 10 && ost < 20) delovi.push(NAEST[ost - 10]);
  else {
    const d = Math.floor(ost / 10);
    const j = ost % 10;
    if (d) delovi.push(DES[d]);
    if (j) delovi.push(zenski && j === 1 ? "jedna" : zenski && j === 2 ? "dve" : JED[j]);
  }
  return delovi.join(" ");
}

/** Oblik reči po broju: 1 → jednina, 2-4 → paukal, ostalo → množina (11-14 su množina). */
function oblik(n: number, jedan: string, dva: string, pet: string) {
  const d = n % 100;
  if (d >= 11 && d <= 14) return pet;
  const j = n % 10;
  if (j === 1) return jedan;
  if (j >= 2 && j <= 4) return dva;
  return pet;
}

export function slovima(iznos: number): string {
  const n = Math.floor(Math.abs(iznos));
  if (n === 0) return "nula";
  const mil = Math.floor(n / 1_000_000);
  const hilj = Math.floor((n % 1_000_000) / 1000);
  const ost = n % 1000;
  const delovi: string[] = [];
  if (mil) delovi.push(mil === 1 ? "milion" : `${doHiljadu(mil)} ${oblik(mil, "milion", "miliona", "miliona")}`);
  if (hilj) delovi.push(hilj === 1 ? "hiljadu" : `${doHiljadu(hilj, true)} ${oblik(hilj, "hiljada", "hiljade", "hiljada")}`);
  if (ost) delovi.push(doHiljadu(ost));
  return delovi.join(" ");
}

/** npr. "dve hiljade petsto evra i 50/100" */
export function iznosSlovima(iznos: number, valuta: "EUR" | "RSD") {
  const ceo = Math.floor(iznos);
  const pare = Math.round((iznos - ceo) * 100);
  const naziv = valuta === "EUR" ? oblik(ceo, "evro", "evra", "evra") : oblik(ceo, "dinar", "dinara", "dinara");
  return `${slovima(ceo)} ${naziv}${pare ? ` i ${pare}/100` : ""}`;
}
