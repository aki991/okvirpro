"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { dodajSistem } from "@/app/actions/sifarnici";

export function NoviSistem({ tip }: { tip: "PVC" | "ALU" }) {
  const [otvoreno, setOtvoreno] = useState(false);
  const [naziv, setNaziv] = useState("");
  const [radi, start] = useTransition();

  if (!otvoreno)
    return (
      <button type="button" className="btn-secondary" onClick={() => setOtvoreno(true)}>
        <Plus size={16} /> Novi {tip} sistem
      </button>
    );

  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          await dodajSistem(tip, naziv);
          setNaziv("");
          setOtvoreno(false);
        });
      }}
    >
      <input
        autoFocus
        className="input w-64"
        placeholder={tip === "PVC" ? "npr. PVC Rehau Synego" : "npr. ALU Schüco AWS 70"}
        value={naziv}
        onChange={(e) => setNaziv(e.target.value)}
      />
      <button className="btn-primary" disabled={radi}>Dodaj</button>
      <button type="button" className="btn-secondary" onClick={() => setOtvoreno(false)}>Otkaži</button>
    </form>
  );
}
