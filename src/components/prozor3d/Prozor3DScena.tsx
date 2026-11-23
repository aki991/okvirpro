"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { napraviProzor3D, oslobodi, type Prozor3DAnimacija, type Prozor3DParametri, type StanjeKrila } from "@/lib/prozor-3d";

type Pogled = "unutra" | "spolja" | "ugao";

const dugme = (aktivno: boolean) =>
  `rounded-md px-3 py-1 text-sm font-semibold ${aktivno ? "bg-brand text-white" : "text-muted hover:text-foreground"}`;

export default function Prozor3DScena({ par }: { par: Prozor3DParametri }) {
  const kontejner = useRef<HTMLDivElement>(null);
  const pogledRef = useRef<((v: Pogled) => void) | null>(null);
  const animRef = useRef<Prozor3DAnimacija | null>(null);
  const [pogled, setPogled] = useState<Pogled>("ugao");
  const [greska, setGreska] = useState("");
  const [moze, setMoze] = useState<Prozor3DAnimacija["mogucnosti"] | null>(null);
  const [krila, setKrila] = useState<StanjeKrila>("zatvoreno");
  const [roletna, setRoletna] = useState(0);
  const [komarnik, setKomarnik] = useState(0);

  useEffect(() => {
    const el = kontejner.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      // providan canvas – pozadina je tamni gradijent iz CSS-a (beli prozor bolje odskače)
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setGreska("Pretraživač ne podržava WebGL – 3D prikaz nije moguć.");
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    let prozor: THREE.Group;
    try {
      const rez = napraviProzor3D(par);
      prozor = rez.grupa;
      animRef.current = rez.anim;
      setMoze(rez.anim.mogucnosti);
      setKrila("zatvoreno");
      setRoletna(0);
      setKomarnik(0);
    } catch (e) {
      console.error(e);
      setGreska("3D model ove pozicije nije moguće napraviti.");
      renderer.dispose();
      el.removeChild(renderer.domElement);
      return;
    }
    scene.add(prozor);

    const box = new THREE.Box3().setFromObject(prozor);
    const c = box.getCenter(new THREE.Vector3());
    const vel = box.getSize(new THREE.Vector3());
    const max = Math.max(vel.x, vel.y);

    // pod (senka) ispod pozicije
    const pod = new THREE.Mesh(new THREE.PlaneGeometry(max * 6, max * 6), new THREE.ShadowMaterial({ opacity: 0.35 }));
    pod.rotation.x = -Math.PI / 2;
    pod.position.set(c.x, box.min.y - 2, c.z);
    pod.receiveShadow = true;
    scene.add(pod);

    scene.add(new THREE.HemisphereLight("#ffffff", "#5b6563", 0.8));
    const sunce = new THREE.DirectionalLight("#fff8ee", 1.7);
    sunce.position.set(c.x - max, c.y + max * 1.2, c.z + max * 1.4);
    sunce.target.position.copy(c);
    sunce.castShadow = true;
    sunce.shadow.mapSize.set(2048, 2048);
    Object.assign(sunce.shadow.camera, { left: -max * 1.4, right: max * 1.4, top: max * 1.4, bottom: -max * 1.4, near: 10, far: max * 6 });
    scene.add(sunce, sunce.target);
    const kontra = new THREE.DirectionalLight("#ffffff", 0.5);
    kontra.position.set(c.x + max, c.y + max * 0.5, c.z - max * 1.5);
    scene.add(kontra);

    const camera = new THREE.PerspectiveCamera(32, el.clientWidth / el.clientHeight, 5, max * 30);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.copy(c);
    controls.minDistance = max * 0.15;
    controls.maxDistance = max * 6;

    const d = max * 2.1;
    const postavi = (v: Pogled) => {
      if (v === "unutra") camera.position.set(c.x, c.y + max * 0.05, c.z + d);
      else if (v === "spolja") camera.position.set(c.x, c.y + max * 0.05, c.z - d);
      else camera.position.set(c.x + d * 0.55, c.y + d * 0.28, c.z + d * 0.85);
      controls.target.copy(c);
      controls.update();
    };
    postavi("ugao");
    pogledRef.current = postavi;

    const sat = new THREE.Clock();
    let anim = 0;
    const petlja = () => {
      anim = requestAnimationFrame(petlja);
      animRef.current?.korak(sat.getDelta());
      controls.update();
      renderer.render(scene, camera);
    };
    petlja();

    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    ro.observe(el);

    return () => {
      cancelAnimationFrame(anim);
      ro.disconnect();
      controls.dispose();
      oslobodi(scene);
      pmrem.dispose();
      renderer.dispose();
      el.removeChild(renderer.domElement);
      pogledRef.current = null;
      animRef.current = null;
    };
  }, [par]);

  const krilaNa = (s: StanjeKrila) => {
    setKrila(s);
    animRef.current?.postaviKrila(s);
  };
  const roletnaNa = (t: number) => {
    setRoletna(t);
    animRef.current?.postaviRoletnu(t);
  };
  const komarnikNa = (t: number) => {
    setKomarnik(t);
    animRef.current?.postaviKomarnik(t);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface px-4 py-2">
        <div className="inline-flex rounded-lg border border-line p-1">
          {(
            [
              ["ugao", "Pod uglom"],
              ["unutra", "Iznutra"],
              ["spolja", "Spolja"],
            ] as const
          ).map(([v, n]) => (
            <button
              key={v}
              type="button"
              onClick={() => {
                setPogled(v);
                pogledRef.current?.(v);
              }}
              className={dugme(pogled === v)}
            >
              {n}
            </button>
          ))}
        </div>

        {moze?.otvaranje && (
          <div className="inline-flex items-center gap-1 rounded-lg border border-line p-1">
            <span className="px-1.5 text-xs font-semibold text-muted">Krila</span>
            <button type="button" onClick={() => krilaNa("zatvoreno")} className={dugme(krila === "zatvoreno")}>Zatvori</button>
            <button type="button" onClick={() => krilaNa("otvoreno")} className={dugme(krila === "otvoreno")}>Otvori</button>
            {moze.kip && <button type="button" onClick={() => krilaNa("kip")} className={dugme(krila === "kip")}>Kip</button>}
          </div>
        )}

        {moze?.roletna && (
          <div className="inline-flex items-center gap-1 rounded-lg border border-line p-1">
            <span className="px-1.5 text-xs font-semibold text-muted">Roletna</span>
            <button type="button" onClick={() => roletnaNa(0)} className={dugme(roletna === 0)}>Podigni</button>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(roletna * 100)}
              onChange={(e) => roletnaNa(Number(e.target.value) / 100)}
              className="w-20 accent-[var(--color-brand)]"
              aria-label="Spuštenost roletne"
            />
            <button type="button" onClick={() => roletnaNa(1)} className={dugme(roletna === 1)}>Spusti</button>
          </div>
        )}

        {moze?.komarnik && (
          <div className="inline-flex items-center gap-1 rounded-lg border border-line p-1">
            <span className="px-1.5 text-xs font-semibold text-muted">Komarnik</span>
            <button type="button" onClick={() => komarnikNa(0)} className={dugme(komarnik === 0)}>Podigni</button>
            <button type="button" onClick={() => komarnikNa(1)} className={dugme(komarnik === 1)}>Spusti</button>
          </div>
        )}

        <span className="text-xs text-muted">Levi taster: rotacija · desni: pomeranje · točkić: zum</span>
      </div>
      <div
        ref={kontejner}
        className="relative min-h-0 flex-1 touch-none"
        style={{ background: "radial-gradient(ellipse at 50% 35%, #56615e 0%, #3a4341 55%, #252b2a 100%)" }}
      >
        {greska && <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-red-300">{greska}</p>}
      </div>
    </div>
  );
}
