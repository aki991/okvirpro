"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Loader2, Minus, Plus, Send, Trash2, X } from "lucide-react";
import type { Cvor } from "@/lib/modeli-katalog";
import { ModelCrtez } from "@/components/ModelCrtez";
import { LogoMark } from "@/components/Logo";
import { ElementCrtez } from "@/components/ElementCrtez";
import { StranaKaisa } from "@/components/StranaKaisa";
import { RoletnaMere } from "@/components/RoletnaMere";
import { Prozor3DDugme } from "@/components/prozor3d/Prozor3DDugme";
import type { Prozor3DParametri } from "@/lib/prozor-3d";
import { prepustRoletne, ROLETNA_VISINA } from "@/lib/proracun";
import { izracunajJavno, posaljiUpit, type JavnaStavka, type JavniRezultat } from "@/app/actions/kalkulator";

type Model = { sifra: string; naziv: string; kategorija: string; definicija: Cvor };
type Props = {
  firma: { naziv: string; logo: string | null; telefon: string; email: string; montazaPoM2: number; pdvStopa: number };
  sistemi: { id: number; naziv: string; tip: string }[];
  stakla: string[];
  roletne: string[];
  komarnici: string[];
  daske: string[];
  okapnice: string[];
  modeli: Model[];
  paneli: { sifra: string; naziv: string; cena: number; slika: string | null }[];
  boje: { sifra: string; naziv: string; hex: string }[];
};

type Stavka = JavnaStavka & { kljuc: string };

const VRSTE = [
  { k: "PROZOR", n: "Prozor" },
  { k: "VRATA", n: "Vrata" },
  { k: "ROLETNA", n: "Roletna" },
  { k: "KOMARNIK", n: "Komarnik" },
];

const eur = (n: number) => n.toLocaleString("sr-RS", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
let brojac = 0;

export function Kalkulator(p: Props) {
  const nova = (vrsta = "PROZOR"): Stavka => ({
    kljuc: `k${++brojac}`,
    vrsta,
    sirina: vrsta === "VRATA" ? 1000 : 1200,
    visina: vrsta === "VRATA" ? 2100 : 1400,
    kolicina: 1,
    sistemId: p.sistemi[0]?.id ?? null,
    staklo: p.stakla[0] ?? null,
    modelSifra: vrsta === "VRATA" ? p.modeli.find((m) => m.kategorija === "VRATA")?.sifra ?? null : p.modeli.find((m) => m.sifra === "P-JK-L")?.sifra ?? null,
    panelSifra: null,
    materijal: vrsta === "ROLETNA" ? p.roletne[0] ?? null : vrsta === "KOMARNIK" ? p.komarnici[0] ?? null : null,
    boja: null,
    roletna: null,
    roletnaVisina: null,
    roletnaPrepust: null,
    roletnaKais: null,
    komarnik: null,
    daska: null,
    okapnica: null,
  });

  const DODACI_J = [
    { polje: "roletna", naziv: "Roletna", opcije: p.roletne },
    { polje: "komarnik", naziv: "Komarnik", opcije: p.komarnici },
    { polje: "daska", naziv: "Unutrašnja daska", opcije: p.daske },
    { polje: "okapnica", naziv: "Spoljna okapnica", opcije: p.okapnice },
  ] as const;

  const [stavke, setStavke] = useState<Stavka[]>(() => [nova()]);
  const [aktivna, setAktivna] = useState(0);
  const [rez, setRez] = useState<JavniRezultat | null>(null);
  const [racuna, setRacuna] = useState(false);
  const [greska, setGreska] = useState("");
  const [kontakt, setKontakt] = useState({ ime: "", telefon: "", email: "", adresa: "", napomena: "", website: "" });
  const [salje, setSalje] = useState(false);
  const [poslato, setPoslato] = useState<string | null>(null);
  const zahtev = useRef(0);

  // proračun na serveru (sa malim zadrškom dok kupac kuca)
  useEffect(() => {
    const id = ++zahtev.current;
    setRacuna(true);
    const t = setTimeout(async () => {
      try {
        const r = await izracunajJavno(stavke.map(({ kljuc: _k, ...s }) => s));
        if (id === zahtev.current) {
          setRez(r);
          setGreska("");
        }
      } catch (e) {
        if (id === zahtev.current) setGreska(e instanceof Error ? e.message : "Proračun nije uspeo.");
      } finally {
        if (id === zahtev.current) setRacuna(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [stavke]);

  const s = stavke[Math.min(aktivna, stavke.length - 1)];
  const izmeni = (iz: Partial<Stavka>) => setStavke((l) => l.map((x) => (x.kljuc === s.kljuc ? { ...x, ...iz } : x)));
  const modeliVrste = useMemo(() => p.modeli.filter((m) => m.kategorija === s.vrsta), [p.modeli, s.vrsta]);
  const profilna = s.vrsta === "PROZOR" || s.vrsta === "VRATA";
  const model = p.modeli.find((m) => m.sifra === s.modelSifra);
  const boja = p.boje.find((b) => b.sifra === (s.boja ?? "BELA"));
  const sistem = p.sistemi.find((x) => x.id === s.sistemId) ?? p.sistemi[0];

  // 3D prikaz: parametri se prave ovde (bez cenovnika – kupac ne dobija nabavne cene)
  const par3d = useMemo<Prozor3DParametri | null>(() => {
    if (!profilna || !s.sirina || !s.visina || s.sirina < 300 || s.visina < 300 || s.sirina > 6000 || s.visina > 6000) return null;
    return {
      definicija: model?.definicija ?? { tip: "polje", otvaranje: "FIKS" },
      sirina: s.sirina,
      visina: s.visina,
      vrsta: s.vrsta,
      alu: sistem?.tip === "ALU",
      mere: { prosirenjeL: 0, prosirenjeD: 0, podstok: 0 },
      dodaci: {
        roletna: !!s.roletna,
        roletnaVisina: s.roletna ? s.roletnaVisina ?? 180 : undefined,
        roletnaPrepust: prepustRoletne(s.roletnaPrepust),
        roletnaKais: s.roletnaKais === "L" ? "L" : "D",
        komarnik: !!s.komarnik,
        daska: s.daska ?? null,
        okapnica: s.okapnica ?? null,
      },
      panel: s.vrsta === "VRATA" && !!s.panelSifra,
      boja: boja?.hex,
    };
  }, [profilna, s.sirina, s.visina, s.vrsta, s.roletna, s.roletnaVisina, s.roletnaPrepust, s.roletnaKais, s.komarnik, s.daska, s.okapnica, s.panelSifra, model, sistem, boja]);
  const imaGresku = rez?.stavke.some((x) => x.greska);

  const posalji = async (e: React.FormEvent) => {
    e.preventDefault();
    setGreska("");
    setSalje(true);
    try {
      const r = await posaljiUpit(kontakt, stavke.map(({ kljuc: _k, ...x }) => x));
      setPoslato(r.poruka);
    } catch (err) {
      setGreska(err instanceof Error ? err.message : "Slanje nije uspelo. Pokušajte ponovo.");
    } finally {
      setSalje(false);
    }
  };

  if (poslato)
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="card max-w-md p-10 text-center">
          <CheckCircle2 size={48} className="mx-auto text-success" />
          <p className="mt-4 text-xl font-extrabold">Upit je poslat</p>
          <p className="mt-2 text-muted">{poslato}</p>
          <button type="button" className="btn-secondary mt-6" onClick={() => { setPoslato(null); setStavke([nova()]); setAktivna(0); }}>
            Nova kalkulacija
          </button>
        </div>
      </div>
    );

  const broj = (polje: "sirina" | "visina", label: string) => (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <input
          className="input pr-10 text-lg font-semibold"
          type="number"
          inputMode="numeric"
          min={300}
          max={6000}
          step={10}
          value={s[polje] || ""}
          onChange={(e) => izmeni({ [polje]: Number(e.target.value) })}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">mm</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 sm:px-6">
          {p.firma.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.firma.logo} alt="" className="h-10 w-10 object-contain" />
          ) : (
            <LogoMark size={36} />
          )}
          <div>
            <p className="font-extrabold leading-tight">{p.firma.naziv || "Kalkulator stolarije"}</p>
            <p className="text-xs text-muted">Izračunajte okvirnu cenu prozora i vrata</p>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Lista stavki */}
          <div className="flex flex-wrap gap-2">
            {stavke.map((x, i) => (
              <button
                key={x.kljuc}
                type="button"
                onClick={() => setAktivna(i)}
                className={`rounded-lg border px-3 py-2 text-left text-sm transition ${i === aktivna ? "border-brand bg-white ring-2 ring-brand/15" : "border-line bg-white/60 hover:bg-white"}`}
              >
                <span className="font-semibold">{i + 1}. {VRSTE.find((v) => v.k === x.vrsta)?.n}</span>
                <span className="ml-1.5 text-muted">{x.sirina}×{x.visina}</span>
              </button>
            ))}
            {stavke.length < 20 && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setStavke((l) => [...l, nova()]);
                  setAktivna(stavke.length);
                }}
              >
                <Plus size={16} /> Dodaj stavku
              </button>
            )}
          </div>

          <section className="card p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap gap-2">
              {VRSTE.map((v) => (
                <button
                  key={v.k}
                  type="button"
                  onClick={() => {
                    const n = nova(v.k);
                    // boja se zadržava pri promeni vrste (prozor ↔ vrata)
                    izmeni({ ...n, kljuc: s.kljuc, kolicina: s.kolicina, boja: s.boja });
                  }}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${s.vrsta === v.k ? "bg-brand text-white" : "bg-background text-muted hover:text-foreground"}`}
                >
                  {v.n}
                </button>
              ))}
            </div>

            <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(260px,48%)]">
              <div className="space-y-4 md:order-1">
                <div className="grid grid-cols-2 gap-4">
                  {broj("sirina", "Širina")}
                  {broj("visina", "Visina")}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Količina</label>
                    <div className="flex items-center gap-2">
                      <button type="button" className="btn-secondary !px-3" onClick={() => izmeni({ kolicina: Math.max(1, s.kolicina - 1) })} aria-label="Manje"><Minus size={14} /></button>
                      <span className="w-8 text-center text-lg font-bold">{s.kolicina}</span>
                      <button type="button" className="btn-secondary !px-3" onClick={() => izmeni({ kolicina: Math.min(50, s.kolicina + 1) })} aria-label="Više"><Plus size={14} /></button>
                    </div>
                  </div>
                  {profilna && p.sistemi.length > 1 && (
                    <div>
                      <label className="label">Profil</label>
                      <select className="input" value={s.sistemId ?? ""} onChange={(e) => izmeni({ sistemId: Number(e.target.value) })}>
                        {p.sistemi.map((x) => <option key={x.id} value={x.id}>{x.naziv}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                {profilna && (
                  <div>
                    <label className="label">Staklo</label>
                    <select className="input" value={s.staklo ?? ""} onChange={(e) => izmeni({ staklo: e.target.value })}>
                      {p.stakla.map((x) => <option key={x}>{x}</option>)}
                    </select>
                  </div>
                )}
                {!profilna && (
                  <div>
                    <label className="label">Vrsta</label>
                    <select className="input" value={s.materijal ?? ""} onChange={(e) => izmeni({ materijal: e.target.value })}>
                      {(s.vrsta === "ROLETNA" ? p.roletne : p.komarnici).map((x) => <option key={x}>{x}</option>)}
                    </select>
                  </div>
                )}
              </div>
              {/* Veliki crtež sa kotama i dodacima */}
              <div className="-order-1 rounded-lg bg-background p-3 md:order-2">
                <ElementCrtez
                  definicija={profilna ? model?.definicija ?? { tip: "polje", otvaranje: "FIKS" } : null}
                  sirina={s.sirina || 0}
                  visina={s.visina || 0}
                  vrsta={s.vrsta}
                  boja={profilna ? boja?.hex : undefined}
                  opcije={{
                    roletna: s.roletna,
                    roletnaVisina: s.roletnaVisina,
                    roletnaPrepust: s.roletnaPrepust,
                    roletnaKais: s.roletnaKais,
                    komarnik: s.komarnik,
                    daska: s.daska,
                    okapnica: s.okapnica,
                    panel: s.vrsta === "VRATA" && s.panelSifra ? p.paneli.find((x) => x.sifra === s.panelSifra)?.naziv ?? null : null,
                  }}
                  className="mx-auto max-h-[360px] w-full"
                />
                {par3d && (
                  <div className="mt-2 flex justify-center">
                    <Prozor3DDugme
                      par={par3d}
                      naslov={`${VRSTE.find((v) => v.k === s.vrsta)?.n} ${s.sirina}×${s.visina} mm${model ? ` – ${model.naziv}` : ""}`}
                      className="btn-primary !py-1.5"
                    />
                  </div>
                )}
              </div>
            </div>

            {profilna && p.boje.length > 0 && (
              <div className="mt-6">
                <p className="label">Boja profila</p>
                <div className="flex flex-wrap gap-2">
                  {p.boje.map((b) => {
                    const aktivna = (s.boja ?? "BELA") === b.sifra;
                    return (
                      <button
                        key={b.sifra}
                        type="button"
                        onClick={() => izmeni({ boja: b.sifra === "BELA" ? null : b.sifra })}
                        aria-pressed={aktivna}
                        className={`flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm transition ${aktivna ? "border-brand bg-brand-soft/50 font-semibold ring-2 ring-brand/20" : "border-line bg-white hover:border-brand/50"}`}
                      >
                        <span className="h-7 w-7 rounded-full border border-black/15 shadow-inner" style={{ background: b.hex }} />
                        {b.naziv}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {profilna && (
              <div className="mt-6">
                <p className="label">Dodaci</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {DODACI_J.filter((d) => d.opcije.length > 0).map((d) => {
                    const v = s[d.polje] ?? "";
                    return (
                      <div key={d.polje} className={`rounded-lg border px-3 py-2 transition ${v ? "border-brand bg-brand-soft/40" : "border-line bg-white"}`}>
                        <label className="mb-1 block text-xs font-semibold">{d.naziv}</label>
                        <select
                          className="input !py-1.5"
                          value={v}
                          onChange={(e) =>
                            izmeni({
                              [d.polje]: e.target.value || null,
                              ...(d.polje === "roletna" && e.target.value && !s.roletnaVisina ? { roletnaVisina: ROLETNA_VISINA.podrazumevano } : {}),
                            } as Partial<Stavka>)
                          }
                        >
                          <option value="">Bez</option>
                          {d.opcije.map((x) => <option key={x}>{x}</option>)}
                        </select>
                        {d.polje === "roletna" && v && (
                          <RoletnaMere
                            id={`krm-${s.kljuc}`}
                            visina={s.roletnaVisina}
                            prepust={s.roletnaPrepust}
                            onVisina={(v) => izmeni({ roletnaVisina: v })}
                            onPrepust={(v) => izmeni({ roletnaPrepust: v })}
                          />
                        )}
                        {d.polje === "roletna" && v && <StranaKaisa vrednost={s.roletnaKais} onChange={(k) => izmeni({ roletnaKais: k })} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {profilna && (
              <div className="mt-6">
                <p className="label">Model</p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                  {modeliVrste.map((m) => (
                    <button
                      key={m.sifra}
                      type="button"
                      onClick={() => izmeni({ modelSifra: m.sifra })}
                      title={m.naziv}
                      className={`flex flex-col items-center rounded-lg border p-2 transition ${s.modelSifra === m.sifra ? "border-brand bg-brand-soft/50 ring-2 ring-brand/20" : "border-line bg-white hover:border-brand/50"}`}
                    >
                      <div className="flex aspect-square w-full items-center justify-center">
                        <ModelCrtez definicija={m.definicija} sirina={s.vrsta === "VRATA" ? 1000 : 1200} visina={s.vrsta === "VRATA" ? 2100 : 1400} className="max-h-full max-w-full" />
                      </div>
                      <span className="mt-1 line-clamp-2 text-center text-[10px] leading-tight text-muted">{m.naziv}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {s.vrsta === "VRATA" && p.paneli.length > 0 && (
              <div className="mt-6">
                <p className="label">Dekorativni panel</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => izmeni({ panelSifra: null })}
                    className={`rounded-lg border px-3 py-2 text-sm ${!s.panelSifra ? "border-brand bg-brand-soft/50 font-semibold" : "border-line bg-white"}`}
                  >
                    Bez panela
                  </button>
                  {p.paneli.map((x) => (
                    <button
                      key={x.sifra}
                      type="button"
                      onClick={() => izmeni({ panelSifra: x.sifra })}
                      className={`rounded-lg border px-3 py-2 text-left text-sm ${s.panelSifra === x.sifra ? "border-brand bg-brand-soft/50" : "border-line bg-white"}`}
                    >
                      <span className="block font-semibold">{x.naziv}</span>
                      <span className="text-xs text-muted">+{eur(x.cena)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {stavke.length > 1 && (
              <button
                type="button"
                className="mt-6 flex items-center gap-1.5 text-sm font-semibold text-danger"
                onClick={() => {
                  setStavke((l) => l.filter((x) => x.kljuc !== s.kljuc));
                  setAktivna(Math.max(0, aktivna - 1));
                }}
              >
                <Trash2 size={15} /> Ukloni ovu stavku
              </button>
            )}
          </section>
        </div>

        {/* Zbir i kontakt */}
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <section className="card p-5">
            <p className="flex items-center justify-between font-bold">
              Okvirna cena
              {racuna && <Loader2 size={16} className="animate-spin text-muted" />}
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {stavke.map((x, i) => {
                const r = rez?.stavke[i];
                return (
                  <li key={x.kljuc} className="flex justify-between gap-2">
                    <span className="text-muted">
                      {i + 1}. {x.kolicina}× {VRSTE.find((v) => v.k === x.vrsta)?.n} {x.sirina}×{x.visina}
                      {x.boja && x.boja !== "BELA" && (x.vrsta === "PROZOR" || x.vrsta === "VRATA") && (
                        <span className="block text-[11px]">boja: {p.boje.find((b) => b.sifra === x.boja)?.naziv.toLowerCase()}</span>
                      )}
                      {DODACI_J.some((d) => x[d.polje]) && (
                        <span className="block text-[11px]">+ {DODACI_J.filter((d) => x[d.polje]).map((d) => d.naziv.toLowerCase()).join(", ")}</span>
                      )}
                    </span>
                    {r?.greska ? <span className="text-xs text-danger">{r.greska}</span> : <span className="font-semibold">{r ? eur(r.ukupnoSaPdv) : "…"}</span>}
                  </li>
                );
              })}
            </ul>
            {rez && (
              <dl className="mt-4 space-y-1 border-t border-line pt-3 text-sm">
                <div className="flex justify-between"><dt className="text-muted">Stolarija (sa PDV-om)</dt><dd>{eur(rez.ukupnoSaPdv)}</dd></div>
                {rez.montaza > 0 && <div className="flex justify-between"><dt className="text-muted">Montaža (okvirno)</dt><dd>{eur(rez.montaza)}</dd></div>}
                <div className="flex justify-between pt-2 text-lg font-extrabold text-brand"><dt>Ukupno</dt><dd>{eur(rez.ukupno)}</dd></div>
              </dl>
            )}
            <p className="mt-3 text-[11px] leading-snug text-muted">
              Cena je informativna i važi uz proveru mera na licu mesta. Konačnu ponudu šaljemo posle vašeg upita.
            </p>
          </section>

          <form onSubmit={posalji} className="card space-y-3 p-5">
            <p className="font-bold">Pošaljite upit</p>
            <input className="input" placeholder="Ime i prezime *" value={kontakt.ime} onChange={(e) => setKontakt({ ...kontakt, ime: e.target.value })} />
            <input className="input" placeholder="Telefon" inputMode="tel" value={kontakt.telefon} onChange={(e) => setKontakt({ ...kontakt, telefon: e.target.value })} />
            <input className="input" placeholder="Email" type="email" value={kontakt.email} onChange={(e) => setKontakt({ ...kontakt, email: e.target.value })} />
            <input className="input" placeholder="Adresa / mesto objekta" value={kontakt.adresa} onChange={(e) => setKontakt({ ...kontakt, adresa: e.target.value })} />
            <textarea className="input min-h-20" placeholder="Napomena (boja, rok, sprat…)" value={kontakt.napomena} onChange={(e) => setKontakt({ ...kontakt, napomena: e.target.value })} />
            {/* zamka za botove – skriveno od ljudi */}
            <input tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" value={kontakt.website} onChange={(e) => setKontakt({ ...kontakt, website: e.target.value })} />
            {greska && (
              <p className="flex items-start gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">
                <X size={15} className="mt-0.5 shrink-0" /> {greska}
              </p>
            )}
            <button className="btn-primary w-full !py-3" disabled={salje || !!imaGresku}>
              {salje ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Pošalji upit
            </button>
            <p className="text-center text-[11px] text-muted">Podatke koristimo samo da bismo vam poslali ponudu.</p>
          </form>
        </aside>
      </div>

      <footer className="pb-6 text-center text-[11px] text-muted">
        {[p.firma.telefon, p.firma.email].filter(Boolean).join(" · ")}
        <span className="mx-2">·</span> pokreće OkvirPro
      </footer>
    </div>
  );
}
