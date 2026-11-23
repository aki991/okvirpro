"use client";

import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink, Globe } from "lucide-react";

function KopirajPolje({ label, vrednost, visestruko = false }: { label: string; vrednost: string; visestruko?: boolean }) {
  const [kopirano, setKopirano] = useState(false);
  const kopiraj = async () => {
    try {
      await navigator.clipboard.writeText(vrednost);
      setKopirano(true);
      setTimeout(() => setKopirano(false), 1500);
    } catch {
      /* pretraživač ne dozvoljava – korisnik može ručno da označi tekst */
    }
  };
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="label !mb-0">{label}</span>
        <button type="button" onClick={kopiraj} className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
          {kopirano ? <Check size={13} /> : <Copy size={13} />} {kopirano ? "Kopirano" : "Kopiraj"}
        </button>
      </div>
      {visestruko ? (
        <textarea readOnly className="input min-h-20 font-mono text-xs" value={vrednost} onFocus={(e) => e.target.select()} />
      ) : (
        <input readOnly className="input font-mono text-xs" value={vrednost} onFocus={(e) => e.target.select()} />
      )}
    </div>
  );
}

export function JavniKalkulator({
  aktivan,
  poruka,
  set,
}: {
  aktivan: boolean;
  poruka: string;
  set: (iz: { kalkulatorAktivan?: boolean; kalkulatorPoruka?: string }) => void;
}) {
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const link = `${origin}/kalkulator`;
  const embed = `<iframe src="${link}" width="100%" height="1100" style="border:0;border-radius:12px" title="Kalkulator cene stolarije" loading="lazy"></iframe>`;
  const lokalno = /localhost|127\.0\.0\.1/.test(origin);

  return (
    <section className="card p-6 xl:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 font-bold"><Globe size={17} className="text-brand" /> Javni kalkulator za kupce</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Kupci sami unose mere i biraju modele na tvom sajtu i odmah vide okvirnu cenu (sa PDV-om, po tvojoj podrazumevanoj marži). Nabavne cene i marža se
            ne vide. Kad kupac pošalje upit, pojavljuje se u <b>Ponudama</b> kao <b>Nacrt</b> sa oznakom „sa sajta“.
          </p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
          <span className={`relative h-6 w-11 rounded-full transition ${aktivan ? "bg-brand" : "bg-stone-300"}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${aktivan ? "left-[22px]" : "left-0.5"}`} />
          </span>
          <input type="checkbox" className="sr-only" checked={aktivan} onChange={(e) => set({ kalkulatorAktivan: e.target.checked })} />
          {aktivan ? "Uključen" : "Isključen"}
        </label>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <KopirajPolje label="Direktan link" vrednost={link} />
          <KopirajPolje label="Embed kod (za tvoj sajt)" vrednost={embed} visestruko />
          <a href="/kalkulator" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
            <ExternalLink size={14} /> Otvori kalkulator kao kupac
          </a>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label">Poruka kupcu posle slanja upita</label>
            <textarea className="input min-h-20" value={poruka} onChange={(e) => set({ kalkulatorPoruka: e.target.value })} />
          </div>
          {lokalno && (
            <p className="rounded-lg bg-accent-soft px-4 py-3 text-xs leading-relaxed">
              <b>Napomena:</b> aplikacija sada radi samo na tvom računaru (localhost), pa link ne radi kupcima na internetu. Proradiće kad aplikaciju postavimo
              na hosting – link i embed kod će se tada sami ažurirati.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
