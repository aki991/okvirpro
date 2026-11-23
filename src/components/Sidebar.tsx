"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutGrid,
  FileText,
  Users,
  LineChart,
  AlertTriangle,
  HandCoins,
  Layers,
  Wrench,
  Shapes,
  DoorClosed,
  ClipboardList,
  ShoppingCart,
  Scissors,
  Warehouse,
  Receipt,
  Settings,
  ChevronDown,
  Box,
  Menu,
  X,
} from "lucide-react";
import { Logo } from "./Logo";

type Stavka = { href: string; naziv: string; ikona: React.ElementType };

const GLAVNO: Stavka[] = [
  { href: "/", naziv: "Pregled", ikona: LayoutGrid },
  { href: "/ponude", naziv: "Ponude", ikona: FileText },
  { href: "/klijenti", naziv: "Klijenti", ikona: Users },
  { href: "/finansije", naziv: "Finansije", ikona: LineChart },
  { href: "/reklamacije", naziv: "Reklamacije", ikona: AlertTriangle },
  { href: "/avansi", naziv: "Avansi", ikona: HandCoins },
];

const SIFARNICI: Stavka[] = [
  { href: "/profili", naziv: "Profili", ikona: Layers },
  { href: "/okov", naziv: "Okov", ikona: Wrench },
  { href: "/modeli", naziv: "Modeli", ikona: Shapes },
  { href: "/paneli", naziv: "Paneli", ikona: DoorClosed },
  { href: "/3d-modeli", naziv: "3D modeli", ikona: Box },
];

const PROIZVODNJA: Stavka[] = [
  { href: "/radni-nalozi", naziv: "Radni nalozi", ikona: ClipboardList },
  { href: "/krojne-liste", naziv: "Krojne liste", ikona: Scissors },
  { href: "/magacin", naziv: "Magacin", ikona: Warehouse },
  { href: "/racuni", naziv: "Računi", ikona: Receipt },
];

const PORUDZBENICE = [
  { href: "/porudzbenice/staklo", naziv: "Staklo" },
  { href: "/porudzbenice/roletne", naziv: "Roletne" },
  { href: "/porudzbenice/komarnici", naziv: "Komarnici" },
  { href: "/porudzbenice/okov", naziv: "Okov" },
  { href: "/porudzbenice/profil", naziv: "Profil" },
  { href: "/porudzbenice/daske-okapnice", naziv: "Daske i okapnice" },
];

function aktivno(path: string, href: string) {
  return href === "/" ? path === "/" : path === href || path.startsWith(href + "/");
}

function Link_({ s, path }: { s: Stavka; path: string }) {
  const Ikona = s.ikona;
  const a = aktivno(path, s.href);
  return (
    <Link
      href={s.href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
        a ? "bg-white/10 font-semibold text-white" : "text-sidebar-fg hover:bg-white/5 hover:text-white"
      }`}
    >
      <Ikona size={17} className={a ? "text-accent" : ""} />
      {s.naziv}
    </Link>
  );
}

function Grupa({ naslov, children }: { naslov: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-sidebar-fg/50">{naslov}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

export function Sidebar() {
  const path = usePathname();
  const [porOtvoreno, setPorOtvoreno] = useState(path.startsWith("/porudzbenice"));
  const [mobilni, setMobilni] = useState(false);

  // na telefonu se meni zatvara posle prelaska na drugu stranu
  useEffect(() => setMobilni(false), [path]);
  // zaključaj skrol stranice dok je meni otvoren
  useEffect(() => {
    document.body.style.overflow = mobilni ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobilni]);

  return (
    <>
      {/* Gornja traka – samo na telefonu i tabletu */}
      <div className="no-print fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between bg-sidebar px-4 lg:hidden">
        <Link href="/">
          <Logo light />
        </Link>
        <button type="button" onClick={() => setMobilni(true)} className="rounded-lg p-2 text-white hover:bg-white/10" aria-label="Otvori meni">
          <Menu size={22} />
        </button>
      </div>
      <div className="no-print h-14 shrink-0 lg:hidden" aria-hidden="true" />

      {mobilni && <div className="no-print fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobilni(false)} />}

    <aside
      className={`no-print fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-sidebar px-3 py-5 transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-60 lg:shrink-0 lg:translate-x-0 ${
        mobilni ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between px-2">
        <Link href="/">
          <Logo light />
        </Link>
        <button type="button" onClick={() => setMobilni(false)} className="rounded-lg p-1.5 text-sidebar-fg hover:bg-white/10 lg:hidden" aria-label="Zatvori meni">
          <X size={20} />
        </button>
      </div>

      <nav className="mt-4 flex-1 overflow-y-auto">
        <div className="space-y-0.5">
          {GLAVNO.map((s) => (
            <Link_ key={s.href} s={s} path={path} />
          ))}
        </div>

        <Grupa naslov="Šifarnici">
          {SIFARNICI.map((s) => (
            <Link_ key={s.href} s={s} path={path} />
          ))}
        </Grupa>

        <Grupa naslov="Proizvodnja">
          {PROIZVODNJA.slice(0, 1).map((s) => (
            <Link_ key={s.href} s={s} path={path} />
          ))}
          <button
            type="button"
            onClick={() => setPorOtvoreno((o) => !o)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
              path.startsWith("/porudzbenice") ? "text-white" : "text-sidebar-fg hover:bg-white/5 hover:text-white"
            }`}
          >
            <ShoppingCart size={17} className={path.startsWith("/porudzbenice") ? "text-accent" : ""} />
            <span className="flex-1 text-left">Porudžbenice</span>
            <ChevronDown size={15} className={`transition ${porOtvoreno ? "rotate-180" : ""}`} />
          </button>
          {porOtvoreno && (
            <div className="ml-6 space-y-0.5 border-l border-white/10 pl-2">
              {PORUDZBENICE.map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  className={`block rounded-md px-3 py-1.5 text-[13px] ${
                    aktivno(path, s.href) ? "bg-white/10 font-semibold text-white" : "text-sidebar-fg hover:text-white"
                  }`}
                >
                  {s.naziv}
                </Link>
              ))}
            </div>
          )}
          {PROIZVODNJA.slice(1).map((s) => (
            <Link_ key={s.href} s={s} path={path} />
          ))}
        </Grupa>
      </nav>

      <div className="border-t border-white/10 pt-3">
        <Link_ s={{ href: "/podesavanja", naziv: "Podešavanja", ikona: Settings }} path={path} />
      </div>
    </aside>
    </>
  );
}
