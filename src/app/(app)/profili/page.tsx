import { db } from "@/lib/db";
import { PageHeader } from "@/components/PageHeader";
import { SistemKartica } from "./SistemKartica";
import { NoviSistem } from "./NoviSistem";

export const dynamic = "force-dynamic";

export default async function Profili() {
  const [sistemi, okovSistemi] = await Promise.all([
    db.profilSistem.findMany({
      orderBy: [{ redosled: "asc" }, { id: "asc" }],
      include: { stavke: { orderBy: { redosled: "asc" } }, pribor: { orderBy: [{ redosled: "asc" }, { id: "asc" }] } },
    }),
    db.okovSistem.findMany({ orderBy: [{ redosled: "asc" }, { id: "asc" }], select: { id: true, naziv: true } }),
  ]);

  const grupe = [
    { tip: "PVC" as const, naslov: "PVC profili", opis: "Specifikacije i nabavne cene PVC sistema." },
    { tip: "ALU" as const, naslov: "Aluminijumski profili", opis: "Specifikacije i nabavne cene ALU sistema." },
  ];

  return (
    <>
      <PageHeader naslov="Profili" opis="Dužine šipki, mere za proračun i nabavne cene" />
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        {grupe.map((g) => {
          const lista = sistemi.filter((s) => s.tip === g.tip);
          return (
            <section key={g.tip} className="card p-6">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">{g.naslov}</h2>
                  <p className="text-sm text-muted">{g.opis}</p>
                </div>
                <NoviSistem tip={g.tip} />
              </div>
              <div className="space-y-3">
                {lista.length === 0 && <p className="text-sm text-muted">Nema unetih sistema.</p>}
                {lista.map((s, i) => (
                  <SistemKartica key={s.id} sistem={s} okovSistemi={okovSistemi} prvi={i === 0} poslednji={i === lista.length - 1} />
                ))}
              </div>
            </section>
          );
        })}

        <div className="card bg-brand-soft/60 p-5 text-sm leading-relaxed">
          <p className="font-semibold">Kako se kolone koriste u proračunu</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-muted">
            <li><b>Dužina</b>: dužina fabričke šipke, koristi se u krojnoj listi i magacinu.</li>
            <li><b>Unutrašnja visina</b>: koliko profil „jede“ od otvora (npr. ram 45 mm). Od nje zavise mere lajsni, krila i stakla.</li>
            <li><b>Širina/odbitak</b>: širina prečke ili lažne prečke, oduzima se pri podeli polja.</li>
            <li><b>Cena</b>: nabavna cena po metru, a za spojnice i poklopce po komadu.</li>
            <li><b>Okovni sistem</b>: koji komplet okova ide uz profil (cene i nazivi se uređuju na stranici Okov).</li>
            <li>
              <b>Pribor</b>: materijal koji prati profil, a nije profil ni okov. Količina = faktor × osnova. Primeri: dihtung krila = 1 × obim krila (m),
              dihtung stakla = 2 × obim stakla (m), ALU ugaonik = 1 × po uglu, kapica odvodnje = 2 × po krilu. Pribor ulazi u cenu i u trebovanje.
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
