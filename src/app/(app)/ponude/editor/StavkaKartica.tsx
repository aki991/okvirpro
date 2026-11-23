"use client";

import { useMemo, useState } from "react";
import { Prozor3DDugme } from "@/components/prozor3d/Prozor3DDugme";
import { parametri3D } from "@/lib/prozor-3d-parametri";
import { ChevronDown, Copy, Calculator, MessageSquare, PackagePlus, Palette, SlidersHorizontal, Trash2 } from "lucide-react";
import { DODACI, mereOpcija, ROLETNA_VISINA, VRSTE, VRSTA_CENOVNIK, type Kontekst, type Rezultat, type Vrsta } from "@/lib/proracun";
import { PODRAZUMEVANI_MODEL } from "@/lib/modeli-katalog";
import { ModelCrtez } from "@/components/ModelCrtez";
import { ElementCrtez } from "@/components/ElementCrtez";
import { StranaKaisa } from "@/components/StranaKaisa";
import { RoletnaMere } from "@/components/RoletnaMere";
import { eur } from "@/lib/format";
import { ModelBirac } from "./ModelBirac";
import { uUlaz, type StavkaForma } from "./tipovi";

function Prekidac({ ukljuceno, onChange, naziv }: { ukljuceno: boolean; onChange: (v: boolean) => void; naziv: string }) {
  return (
    <label className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm transition ${ukljuceno ? "border-brand bg-brand-soft/50" : "border-line bg-white"}`}>
      <span className="font-medium">{naziv}</span>
      <span className={`relative h-5 w-9 rounded-full transition ${ukljuceno ? "bg-brand" : "bg-stone-300"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${ukljuceno ? "left-[18px]" : "left-0.5"}`} />
      </span>
      <input type="checkbox" className="sr-only" checked={ukljuceno} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

/** Prekidač opcije sa merom: kad je uključen, prikazuje polje za mm (prazno = podrazumevano). */
function OpcijaMera({
  naziv,
  ukljuceno,
  mera,
  podrazumevano,
  onChange,
}: {
  naziv: string;
  ukljuceno: boolean;
  mera: number | null;
  podrazumevano: number;
  onChange: (ukljuceno: boolean, mera: number | null) => void;
}) {
  const promenjeno = ukljuceno && mera !== null && mera !== podrazumevano;
  return (
    <div className={`rounded-lg border transition ${ukljuceno ? "border-brand bg-brand-soft/50" : "border-line bg-white"}`}>
      <label className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm">
        <span className="font-medium">{naziv}</span>
        <span className={`relative h-5 w-9 shrink-0 rounded-full transition ${ukljuceno ? "bg-brand" : "bg-stone-300"}`}>
          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${ukljuceno ? "left-[18px]" : "left-0.5"}`} />
        </span>
        <input type="checkbox" className="sr-only" checked={ukljuceno} onChange={(e) => onChange(e.target.checked, e.target.checked ? mera : null)} />
      </label>
      {ukljuceno && (
        <div className="flex items-center gap-1.5 border-t border-brand/15 px-3 py-1.5">
          <div className="relative flex-1">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={500}
              className={`input !py-1 pr-8 text-right text-sm font-semibold ${promenjeno ? "!border-accent text-accent" : ""}`}
              placeholder={String(podrazumevano)}
              value={mera ?? ""}
              onChange={(e) => onChange(true, e.target.value === "" ? null : Number(e.target.value))}
              aria-label={`${naziv} u mm`}
            />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-muted">mm</span>
          </div>
          {promenjeno && (
            <button type="button" onClick={() => onChange(true, null)} className="whitespace-nowrap text-[11px] font-semibold text-brand hover:underline" title={`Vrati na ${podrazumevano} mm`}>
              podr.
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function StavkaKartica({
  s,
  rb,
  r,
  k,
  izmeni,
  ukloni,
  dupliraj,
}: {
  s: StavkaForma;
  rb: number;
  r: Rezultat;
  k: Kontekst;
  izmeni: (iz: Partial<StavkaForma>) => void;
  ukloni: () => void;
  dupliraj: () => void;
}) {
  const [birac, setBirac] = useState(false);
  const [detalji, setDetalji] = useState(false);
  const profilna = s.vrsta === "PROZOR" || s.vrsta === "VRATA";
  const vrata = s.vrsta === "VRATA";
  const model = k.modeli.find((m) => m.sifra === s.modelSifra);
  const vrstaNaziv = VRSTE.find((v) => v.k === s.vrsta)?.n;
  const kat = VRSTA_CENOVNIK[s.vrsta];
  const poDuzini = s.vrsta === "DASKA" || s.vrsta === "OKAPNICA";
  const sistem = k.sistemi.find((x) => x.id === s.sistemId) ?? k.sistemi[0];
  const mo = mereOpcija(s, sistem);
  const bojaIzabrana = k.boje.find((b) => b.sifra === (s.boja ?? "BELA"));
  const ulaz = uUlaz(s);
  // parametri 3D prikaza – menjaju se samo kad se promene mere/opcije (ne pri svakom renderu)
  const kljuc3d = JSON.stringify([ulaz.boja, ulaz.vrsta, ulaz.sirina, ulaz.visina, ulaz.modelSifra, ulaz.sistemId, ulaz.podstok, ulaz.podstokMm, ulaz.prosirenjeL, ulaz.prosirenjeLMm, ulaz.prosirenjeD, ulaz.prosirenjeDMm, ulaz.roletna, ulaz.roletnaVisina, ulaz.roletnaPrepust, ulaz.roletnaKais, ulaz.komarnik, ulaz.daska, ulaz.okapnica, ulaz.panelSifra]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const par3d = useMemo(() => parametri3D(ulaz, k), [kljuc3d, k]);
  // crtež: izabrani model, ili podrazumevani (fiksni prozor / jednokrilna vrata)
  const crtez = profilna
    ? (model ?? k.modeli.find((m) => m.sifra === PODRAZUMEVANI_MODEL[vrata ? "VRATA" : "PROZOR"]))?.definicija ?? { tip: "polje" as const, otvaranje: "FIKS" as const }
    : null;

  const polje = (p: "sirina" | "visina" | "kolicina" | "marza") => ({
    value: s[p],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => izmeni({ [p]: e.target.value }),
  });

  const promeniVrstu = (v: Vrsta) => {
    const iz: Partial<StavkaForma> = { vrsta: v, modelSifra: null };
    const kat2 = VRSTA_CENOVNIK[v];
    if (kat2) iz.materijal = k.cenovnik.find((c) => c.kategorija === kat2)?.naziv ?? null;
    if (v === "VRATA") {
      iz.sirina = "1000";
      iz.visina = "2100";
    }
    izmeni(iz);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      <button type="button" onClick={() => izmeni({ otvorena: !s.otvorena })} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-background/60">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-background p-1">
          {profilna && model ? (
            <ModelCrtez definicija={model.definicija} sirina={Number(s.sirina) || 1200} visina={Number(s.visina) || 1400} className="max-h-full max-w-full" />
          ) : (
            <span className="text-xs font-bold text-muted">{rb}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">
            {rb}. {s.kolicina}× {vrstaNaziv} {poDuzini ? `${s.sirina} mm` : `${s.sirina}×${s.visina} mm`}
            {model && <span className="ml-2 font-mono text-xs font-normal text-muted">{model.sifra}</span>}
          </p>
          <p className="text-xs text-muted">
            Stavka: <b className="text-foreground">{eur(r.cenaKom * (Number(s.kolicina) || 1))}</b>
            {r.greska && <span className="ml-2 text-danger">{r.greska}</span>}
          </p>
        </div>
        <ChevronDown size={18} className={`text-muted transition ${s.otvorena ? "rotate-180" : ""}`} />
      </button>

      {s.otvorena && (
        <div className="grid gap-6 border-t border-line p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_minmax(340px,44%)]">
          {/* Crtež – na telefonu iznad forme, na širokom ekranu desno i prati skrol */}
          <aside className="xl:order-2">
            <div className="rounded-xl border border-line bg-[#fbfbf9] p-3 xl:sticky xl:top-24">
              <ElementCrtez
                definicija={crtez}
                sirina={Number(s.sirina) || 0}
                visina={Number(s.visina) || 0}
                vrsta={s.vrsta}
                boja={profilna ? bojaIzabrana?.hex : undefined}
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
                className="mx-auto max-h-[460px] w-full"
              />
              <div className="mt-2 flex flex-wrap justify-center gap-1.5 text-[11px] font-semibold">
                <span className="rounded-full bg-brand-soft px-2 py-0.5 text-brand">
                  {s.kolicina} × {vrstaNaziv} {poDuzini ? `${s.sirina} mm` : `${s.sirina} × ${s.visina} mm`}
                </span>
                {model && <span className="rounded-full bg-background px-2 py-0.5 text-muted">{model.naziv}</span>}
                {profilna && sistem && <span className="rounded-full bg-background px-2 py-0.5 text-muted">{sistem.naziv}</span>}
                {profilna && bojaIzabrana && (
                  <span className="flex items-center gap-1 rounded-full bg-background px-2 py-0.5 text-muted">
                    <span className="h-2.5 w-2.5 rounded-full border border-black/15" style={{ background: bojaIzabrana.hex }} />
                    {bojaIzabrana.naziv}
                  </span>
                )}
                {profilna && s.staklo && <span className="rounded-full bg-background px-2 py-0.5 text-muted">{s.staklo}</span>}
                {DODACI.filter((d) => s[d.polje]).map((d) => (
                  <span key={d.polje} className="rounded-full bg-accent-soft px-2 py-0.5 text-accent">{d.naziv}: {s[d.polje]}</span>
                ))}
              </div>
              <p className="mt-2 text-center text-sm">
                Cena stavke: <b className="text-brand">{eur(r.cenaKom * (Number(s.kolicina) || 1))}</b>
                {(Number(s.kolicina) || 1) > 1 && <span className="text-muted"> ({eur(r.cenaKom)}/kom)</span>}
              </p>
              {par3d && (
                <div className="mt-2 flex justify-center">
                  <Prozor3DDugme par={par3d} naslov={`${rb}. ${vrstaNaziv} ${s.sirina}×${s.visina} mm${model ? ` – ${model.naziv}` : ""}`} className="btn-primary !py-1.5" />
                </div>
              )}
            </div>
          </aside>

          <div className="min-w-0 space-y-5 xl:order-1">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="label">Vrsta</label>
              <select className="input" value={s.vrsta} onChange={(e) => promeniVrstu(e.target.value as Vrsta)}>
                {VRSTE.map((v) => <option key={v.k} value={v.k}>{v.n}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{poDuzini ? "Dužina (mm)" : "Širina (mm)"}</label>
              <input className="input" inputMode="numeric" {...polje("sirina")} />
            </div>
            {!poDuzini && (
              <div>
                <label className="label">Visina (mm)</label>
                <input className="input" inputMode="numeric" {...polje("visina")} />
              </div>
            )}
            <div>
              <label className="label">Količina</label>
              <input className="input" inputMode="numeric" {...polje("kolicina")} />
            </div>

            {profilna ? (
              <>
                <div className="lg:col-span-2">
                  <label className="label">Sistem</label>
                  <select className="input" value={s.sistemId ?? ""} onChange={(e) => izmeni({ sistemId: Number(e.target.value) })}>
                    {k.sistemi.map((x) => <option key={x.id} value={x.id}>{x.naziv}</option>)}
                  </select>
                </div>
                <div className="lg:col-span-2">
                  <label className="label">Staklo</label>
                  <select className="input" value={s.staklo ?? ""} onChange={(e) => izmeni({ staklo: e.target.value })}>
                    {k.cenovnik.filter((c) => c.kategorija === "STAKLO").map((c) => <option key={c.naziv} value={c.naziv}>{c.naziv}</option>)}
                  </select>
                </div>
              </>
            ) : (
              <div className="lg:col-span-2">
                <label className="label">Materijal</label>
                <select className="input" value={s.materijal ?? ""} onChange={(e) => izmeni({ materijal: e.target.value })}>
                  {k.cenovnik.filter((c) => c.kategorija === kat).map((c) => <option key={c.naziv} value={c.naziv}>{c.naziv} – {c.cena} €/{poDuzini ? "m" : "m²"}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="label">Marža %</label>
              <input className="input" inputMode="decimal" disabled={s.rucno} {...polje("marza")} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-lg bg-brand-soft/40 px-4 py-3">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={s.rucno} onChange={(e) => izmeni({ rucno: e.target.checked, rucnaCena: e.target.checked ? String(r.cenaKom) : "" })} className="accent-[var(--brand)]" />
              Ručni unos cene
            </label>
            {s.rucno && (
              <div className="relative w-44">
                <input className="input pr-14 text-right font-semibold" inputMode="decimal" value={s.rucnaCena} onChange={(e) => izmeni({ rucnaCena: e.target.value })} />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">€/kom</span>
              </div>
            )}
            <span className="text-xs text-muted">{s.rucno ? "Cena po komadu bez PDV-a; marža se ne primenjuje." : "Cena se računa iz nabavnih cena i marže."}</span>
          </div>

          {profilna && (
            <>
              <div>
                <span className="label">Model</span>
                <div className="flex items-center gap-3">
                  <button type="button" className="btn-secondary flex-1 justify-start" onClick={() => setBirac(true)}>
                    {model ? <><span className="font-mono text-xs text-muted">{model.sifra}</span> {model.naziv}</> : "Izaberi model…"}
                  </button>
                  {model && (
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-line p-1">
                      <ModelCrtez definicija={model.definicija} sirina={Number(s.sirina) || 1200} visina={Number(s.visina) || 1400} className="max-h-full max-w-full" />
                    </div>
                  )}
                </div>
                {!model && <p className="mt-1 text-xs text-muted">Bez izabranog modela računa se kao {vrata ? "jednokrilna vrata" : "fiksni prozor"}.</p>}
              </div>

              {vrata && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="sm:col-span-2">
                    <label className="label">Dekorativni panel</label>
                    <select className="input" value={s.panelSifra ?? ""} onChange={(e) => izmeni({ panelSifra: e.target.value || null })}>
                      <option value="">Bez panela (staklo)</option>
                      {k.paneli.map((p) => <option key={p.sifra} value={p.sifra}>{p.naziv} – {p.cena} €</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Rukohvat</label>
                    <select className="input" value={s.rukohvat ?? ""} onChange={(e) => izmeni({ rukohvat: e.target.value || null })}>
                      <option value="">Bez rukohvata</option>
                      {k.cenovnik.filter((c) => c.kategorija === "RUKOHVAT").map((c) => <option key={c.naziv} value={c.naziv}>{c.naziv}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col justify-end gap-2">
                    <Prekidac naziv="Elektro prihvatnik" ukljuceno={s.elektroPrihvatnik} onChange={(v) => izmeni({ elektroPrihvatnik: v })} />
                    <Prekidac naziv="Automat / pumpa" ukljuceno={s.automat} onChange={(v) => izmeni({ automat: v })} />
                  </div>
                </div>
              )}

              {k.boje.length > 0 && (
                <div>
                  <span className="label flex items-center gap-1.5"><Palette size={13} /> Boja profila</span>
                  <div className="flex flex-wrap gap-2">
                    {k.boje.map((b) => {
                      const aktivna = (s.boja ?? "BELA") === b.sifra;
                      return (
                        <button
                          key={b.sifra}
                          type="button"
                          onClick={() => izmeni({ boja: b.sifra === "BELA" ? null : b.sifra })}
                          title={b.doplata > 0 ? `${b.naziv} (+${b.doplata}% na profile)` : b.naziv}
                          aria-pressed={aktivna}
                          className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-sm transition ${aktivna ? "border-brand bg-brand-soft/50 ring-2 ring-brand/20" : "border-line bg-white hover:border-brand/50"}`}
                        >
                          <span className="h-6 w-6 shrink-0 rounded-full border border-black/15 shadow-inner" style={{ background: b.hex }} />
                          <span className="leading-tight">
                            <span className="block font-semibold">{b.naziv}</span>
                            <span className="block text-[11px] text-muted">{b.doplata > 0 ? `+${b.doplata}%` : "bez doplate"}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <span className="label flex items-center gap-1.5"><SlidersHorizontal size={13} /> Opcije pozicije</span>
                <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
                  <OpcijaMera
                    naziv="Podštok"
                    ukljuceno={s.podstok}
                    mera={s.podstokMm ?? null}
                    podrazumevano={mo.podrazumevano.podstok}
                    onChange={(v, m) => izmeni({ podstok: v, podstokMm: m })}
                  />
                  <OpcijaMera
                    naziv="Proširenje L"
                    ukljuceno={s.prosirenjeL}
                    mera={s.prosirenjeLMm ?? null}
                    podrazumevano={mo.podrazumevano.prosirenje}
                    onChange={(v, m) => izmeni({ prosirenjeL: v, prosirenjeLMm: m })}
                  />
                  <OpcijaMera
                    naziv="Proširenje D"
                    ukljuceno={s.prosirenjeD}
                    mera={s.prosirenjeDMm ?? null}
                    podrazumevano={mo.podrazumevano.prosirenje}
                    onChange={(v, m) => izmeni({ prosirenjeD: v, prosirenjeDMm: m })}
                  />
                  <Prekidac naziv="Spoj levo" ukljuceno={s.spojL} onChange={(v) => izmeni({ spojL: v })} />
                  <Prekidac naziv="Spoj desno" ukljuceno={s.spojD} onChange={(v) => izmeni({ spojD: v })} />
                </div>
                <p className="mt-1 text-xs text-muted">
                  Mere podštoka i proširenja su podrazumevano iz profilnog sistema ({mo.podrazumevano.podstok} / {mo.podrazumevano.prosirenje} mm) i mogu se promeniti za ovu poziciju.
                </p>
              </div>

              <div>
                <span className="label flex items-center gap-1.5"><PackagePlus size={13} /> Dodaci uz poziciju</span>
                <div className="grid gap-3 sm:grid-cols-2">
                  {DODACI.map((d) => {
                    const opcijeD = k.cenovnik.filter((c) => c.kategorija === d.kategorija);
                    const izabrano = s[d.polje] ?? "";
                    return (
                      <div key={d.polje} className={`rounded-lg border px-3 py-2 transition ${izabrano ? "border-accent bg-accent-soft/50" : "border-line bg-white"}`}>
                        <label className="mb-1 block text-xs font-semibold">{d.naziv}</label>
                        <select
                          className="input !py-1.5"
                          value={izabrano}
                          onChange={(e) =>
                            izmeni({
                              [d.polje]: e.target.value || null,
                              // kad se roletna prvi put uključi, postavi univerzalnu visinu kutije
                              ...(d.polje === "roletna" && e.target.value && !s.roletnaVisina ? { roletnaVisina: ROLETNA_VISINA.podrazumevano } : {}),
                            } as Partial<StavkaForma>)
                          }
                          disabled={opcijeD.length === 0}
                        >
                          <option value="">{opcijeD.length ? "Bez" : "Nema u cenovniku (Podešavanja)"}</option>
                          {opcijeD.map((c) => (
                            <option key={c.naziv} value={c.naziv}>
                              {c.naziv} – {c.cena} €/{d.jedinica}
                            </option>
                          ))}
                        </select>
                        {d.polje === "roletna" && izabrano && (
                          <RoletnaMere
                            id={`rm-${s.kljuc}`}
                            visina={s.roletnaVisina}
                            prepust={s.roletnaPrepust}
                            onVisina={(v) => izmeni({ roletnaVisina: v })}
                            onPrepust={(v) => izmeni({ roletnaPrepust: v })}
                          />
                        )}
                        {d.polje === "roletna" && izabrano && (
                          <StranaKaisa vrednost={s.roletnaKais} onChange={(v) => izmeni({ roletnaKais: v })} />
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="mt-1 text-xs text-muted">Roletna se računa po m² pozicije sa kutijom (širina × (visina + kutija); univerzalna kutija {ROLETNA_VISINA.podrazumevano} mm, može da se promeni), komarnik po m² pozicije, daska i okapnica po dužini (širini pozicije).</p>
              </div>
            </>
          )}

          <div>
            <label className="label flex items-center gap-1.5"><MessageSquare size={13} /> Napomena za ovu stavku</label>
            <textarea className="input min-h-16" placeholder="Napomena za radionicu ili montažu…" value={s.napomena} onChange={(e) => izmeni({ napomena: e.target.value })} />
          </div>

          {detalji && (
            <div className="rounded-lg border border-line bg-background/60 p-4 text-sm">
              <p className="mb-2 font-semibold">Nabavna cena po komadu</p>
              <table className="w-full">
                <tbody>
                  {r.troskovi.map((t, i) => (
                    <tr key={i} className="border-b border-line/60 last:border-0">
                      <td className="py-1 text-muted">{t.naziv}</td>
                      <td className="py-1 text-right">{eur(t.iznos)}</td>
                    </tr>
                  ))}
                  <tr className="font-semibold">
                    <td className="pt-2">Ukupno nabavna</td>
                    <td className="pt-2 text-right">{eur(r.trosakKom)}</td>
                  </tr>
                  <tr className="font-semibold text-brand">
                    <td>Prodajna (bez PDV-a)</td>
                    <td className="text-right">{eur(r.cenaKom)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-wrap justify-between gap-2">
            <div className="flex gap-2">
              <button type="button" className="btn-secondary !py-1.5" onClick={() => setDetalji((d) => !d)}>
                <Calculator size={15} /> {detalji ? "Sakrij proračun" : "Prikaži proračun"}
              </button>
              <button type="button" className="btn-secondary !py-1.5" onClick={dupliraj}>
                <Copy size={15} /> Dupliraj
              </button>
            </div>
            <button type="button" className="btn-danger !py-1.5" onClick={ukloni}>
              <Trash2 size={15} /> Ukloni poziciju
            </button>
          </div>
          </div>
        </div>
      )}

      {birac && profilna && (
        <ModelBirac
          modeli={k.modeli}
          kategorija={vrata ? "VRATA" : "PROZOR"}
          izabran={s.modelSifra}
          onIzaberi={(sifra) => izmeni({ modelSifra: sifra })}
          onZatvori={() => setBirac(false)}
        />
      )}
    </div>
  );
}
