import { PrismaClient } from "@prisma/client";
import { MODELI } from "../src/lib/modeli-katalog";

const db = new PrismaClient();

const PVC_STAVKE: [string, string, number | null, number | null, number | null, number, boolean?][] = [
  // kljuc, naziv, duzinaSipke, unutrasnjaVisina, sirinaOdbitak, cena, poKomadu
  ["RAM", "Ram", 6500, 45, null, 12.5],
  ["KRILO_PROZORA", "Krilo prozora", 6500, 56, null, 14.2],
  ["KRILO_VRATA", "Krilo vrata", 6500, 88, null, 18.5],
  ["CELIK_RAMA", "Čelično ojačanje rama", 6000, null, null, 4.5],
  ["CELIK_KRILA", "Čelično ojačanje krila", 6000, null, null, 5.2],
  ["CELIK_KRILA_VRATA", "Čelično ojačanje krila vrata", 6000, null, null, 7.8],
  ["LAJSNA", "Lajsna", 6500, null, null, 2.8],
  ["PRECKA", "Prečka", 6500, null, 42, 11.5],
  ["LAZNA_PRECKA", "Lažna prečka", 6500, null, 70, 10.8],
  ["PRAG", "Prag", 6000, 20, null, 9.5],
  ["PROSIRENJE", "Proširenje", 6000, 40, null, 8.5],
  ["PODSTOK", "Podštok", 6000, 30, null, 3.5],
  ["SPOJNICA_PRECKE", "Spojnica prečke", null, null, null, 0, true],
  ["POKLOPAC_STULPA", "Poklopac štulpa", null, null, null, 0, true],
];

const ALU_STAVKE: typeof PVC_STAVKE = [
  ["RAM", "Ram", 6500, 42, null, 24.5],
  ["KRILO_PROZORA", "Krilo prozora", 6500, 52, null, 28.2],
  ["KRILO_VRATA", "Krilo vrata", 6500, 82, null, 34.5],
  ["LAJSNA", "Lajsna", 6500, null, null, 4.2],
  ["PRECKA", "Prečka", 6500, null, 40, 22.5],
  ["LAZNA_PRECKA", "Lažna prečka", 6500, null, 70, 21.8],
  ["PRAG", "Prag", 6000, 15, null, 18.5],
  ["PROSIRENJE", "Proširenje", 6000, 40, null, 15],
  ["PODSTOK", "Podštok", 6000, 30, null, 6],
  ["SPOJNICA_PRECKE", "Spojnica prečke", null, null, null, 0, true],
  ["POKLOPAC_STULPA", "Poklopac štulpa", null, null, null, 0, true],
];

const OKOV: [string, string, string, boolean][] = [
  ["PSK", "PSK_KRILO", "Cena po kliznom krilu", false],
  ["PROZOR", "GORNJI_UGAO", "Gornji ugao", false],
  ["PROZOR", "DONJI_UGAO", "Donji ugao", false],
  ["PROZOR", "BRAVA", "Brava (zatvarač)", true],
  ["PROZOR", "NOSAC_MAKAZE", "Nosač makaze", true],
  ["PROZOR", "MAKAZA", "Makaza", false],
  ["PROZOR", "LEDJNA_SINA", "Leđna šina", true],
  ["PROZOR", "DONJA_SARKA", "Donja šarka", false],
  ["PROZOR", "RUCICA", "Ručica na krilu", false],
  ["PROZOR", "NOSAC_GORNJE_SARKE", "Nosač gornje šarke", false],
  ["PROZOR", "NOSAC_DONJE_SARKE", "Nosač donje šarke", false],
  ["PROZOR", "KIP_PRIHVATNIK", "Kip prihvatnik", false],
  ["PROZOR", "PRIHVATNIK_ZATVARACA", "Prihvatnik zatvarača", false],
  ["KIP", "KIP_SARKA", "Kip šarka (donja, sa ležištem na ramu)", false],
  ["STULP", "S_GORNJA_SARKA", "Gornja šarka", false],
  ["STULP", "S_DONJA_SARKA", "Donja šarka", false],
  ["STULP", "RIGLA_GORE", "Rigla gore", false],
  ["STULP", "RIGLA_DOLE", "Rigla dole", false],
  ["STULP", "KLIN", "Klin (zatezač)", false],
  ["STULP", "PRIHVATNICI_STULP", "Prihvatnici na štulpu", false],
  ["STULP", "NOSACI_SARKI_RAM", "Nosači šarki na ramu", false],
  ["STULP", "PRIHVATNIK_KLINA", "Prihvatnik klina", false],
  ["STULP", "PRIHVATNIK_RIGLE_GORE", "Prihvatnik rigle gore", false],
  ["STULP", "PRIHVATNIK_RIGLE_DOLE", "Prihvatnik rigle dole", false],
  ["VRATA", "VRATNA_BRAVA", "Vratna brava", false],
  ["VRATA", "CILINDAR", "Cilindar", false],
  ["VRATA", "KVAKE", "Kvake / ručke set", false],
  ["VRATA", "SARKA_VRATA", "Šarka (po komadu)", false],
  ["VRATA", "PRIHVATNICI_BRAVE", "Prihvatnici brave", false],
  ["VRATA", "PRIHVATNA_PLOCA", "Prihvatna ploča", false],
];

const CENOVNIK: [string, string, number][] = [
  ["STAKLO", "4-16-4 Low-E + Argon", 28],
  ["STAKLO", "4-12-4-12-4 Troslojno Solar", 42],
  ["STAKLO", "4-16-4 Peskirano", 35],
  ["STAKLO", "6-14-6 Kaljeno (sigurnosno)", 55],
  ["ROLETNA", "ALU roletna standard", 35],
  ["ROLETNA", "ALU roletna sa izolacijom", 45],
  ["KOMARNIK", "Fiksni komarnik", 22],
  ["KOMARNIK", "Rolo komarnik", 45],
  ["KOMARNIK", "Plise komarnik", 65],
  ["DASKA", "PVC bela 150 mm", 8],
  ["DASKA", "PVC bela 200 mm", 10],
  ["DASKA", "PVC bela 250 mm", 12],
  ["OKAPNICA", "ALU bela 100 mm", 7],
  ["OKAPNICA", "ALU bela 150 mm", 9],
  ["OKAPNICA", "ALU bela 200 mm", 11],
  ["RUKOHVAT", "400 mm", 45],
  ["RUKOHVAT", "600 mm", 55],
  ["RUKOHVAT", "800 mm", 65],
  ["RUKOHVAT", "1200 mm", 85],
  ["RUKOHVAT", "1500 mm", 110],
  ["RUKOHVAT", "1800 mm", 130],
  ["DODATAK_VRATA", "Elektro prihvatnik", 25],
  ["DODATAK_VRATA", "Automat / pumpa", 48],
];

const PANELI: [string, string, number][] = [
  ["PNL-ORBIT-3", "Orbit 3", 240],
  ["PNL-ORBIT-V", "Orbit V", 265],
  ["PNL-CENTRA-4", "Centra 4", 290],
  ["PNL-LUK-5", "Luk 5", 180],
  ["PNL-MESEC-5", "Mesec 5", 210],
  ["PNL-DUO-6", "Duo 6", 195],
  ["PNL-POMAK-7", "Pomak 7", 280],
  ["PNL-LINIJA-5", "Linija 5", 230],
  ["PNL-LINIJA-PUNA-5", "Linija puna 5", 245],
  ["PNL-TRIO-NISKI", "Trio niski", 275],
  ["PNL-MESEC-INOX-5", "Mesec inox 5", 320],
  ["PNL-KVADRA-4L", "Kvadra 4L", 255],
  ["PNL-VIZIJA-5", "Vizija 5", 310],
];

async function main() {
  await db.firma.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      naziv: "Moja Stolarija d.o.o.",
      adresa: "Industrijska bb",
      mesto: "11000 Beograd",
      zastupnik: "Vlasnik",
      garancija:
        "Garancija na postojanost profila iznosi 10 godina. Garancija na funkcionalnost okova i termoizolaciona svojstva stakla iznosi 2 godine. Garancija ne pokriva mehanička oštećenja nastala posle primopredaje.",
      uslovi: "Ponuda važi 7 dana od datuma izdavanja.\nObračun se vrši po zvaničnom kursu na dan uplate.\nHvala na poverenju!",
    },
  });

  if ((await db.profilSistem.count()) === 0) {
    const sistemi: [string, string, typeof PVC_STAVKE][] = [
      ["PVC Salamander BE92", "PVC", PVC_STAVKE],
      ["ALU Alumil S77", "ALU", ALU_STAVKE],
    ];
    for (const [i, [naziv, tip, stavke]] of sistemi.entries()) {
      await db.profilSistem.create({
        data: {
          naziv,
          tip,
          redosled: i,
          stavke: {
            create: stavke.map(([kljuc, n, duzinaSipke, unutrasnjaVisina, sirinaOdbitak, cena, poKomadu], j) => ({
              kljuc,
              naziv: n,
              duzinaSipke,
              unutrasnjaVisina,
              sirinaOdbitak,
              cena,
              poKomadu: !!poKomadu,
              redosled: j,
            })),
          },
        },
      });
    }
  }

  for (const [j, [grupa, kljuc, naziv, poMetru]] of OKOV.entries()) {
    await db.okovStavka.upsert({ where: { kljuc }, update: {}, create: { grupa, kljuc, naziv, poMetru, redosled: j } });
  }

  if ((await db.cenovnikStavka.count()) === 0) {
    await db.cenovnikStavka.createMany({
      data: CENOVNIK.map(([kategorija, naziv, cena], j) => ({ kategorija, naziv, cena, redosled: j })),
    });
  }

  // sistemski modeli kojih više nema u katalogu se uklanjaju (korisnički ostaju)
  await db.model.deleteMany({ where: { korisnicki: false, sifra: { notIn: MODELI.map((m) => m.sifra) } } });
  for (const [j, m] of MODELI.entries()) {
    await db.model.upsert({
      where: { sifra: m.sifra },
      update: { naziv: m.naziv, kategorija: m.kategorija, definicija: JSON.stringify(m.definicija), redosled: j },
      create: { sifra: m.sifra, naziv: m.naziv, kategorija: m.kategorija, definicija: JSON.stringify(m.definicija), redosled: j },
    });
  }

  // 5 najčešćih boja (dekori/folije) za Salamander; doplata je procenat na cenu profila i menja se u Podešavanjima
  const BOJE: [string, string, string, number][] = [
    ["BELA", "Bela", "#f6f6f1", 0],
    ["ZLATNI_HRAST", "Zlatni hrast", "#b07a3c", 15],
    ["ORAH", "Orah", "#6b4a33", 15],
    ["ANTRACIT", "Antracit siva (RAL 7016)", "#383e42", 15],
    ["MAHAGONI", "Mahagoni", "#6e2f22", 15],
  ];
  for (const [j, [sifra, naziv, hex, doplata]] of BOJE.entries()) {
    await db.bojaProfila.upsert({ where: { sifra }, update: {}, create: { sifra, naziv, hex, doplata, redosled: j } });
  }

  for (const [j, [sifra, naziv, cena]] of PANELI.entries()) {
    await db.panel.upsert({ where: { sifra }, update: {}, create: { sifra, naziv, cena, redosled: j } });
  }

  console.log("Seed završen.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
