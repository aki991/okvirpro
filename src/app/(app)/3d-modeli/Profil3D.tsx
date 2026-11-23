"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { granice, zaobljeniUglovi, type Kontura, type Presek } from "@/lib/profili-3d";

// 3D šipka profila: poprečni presek (sa komorama kao šupljinama) izvučen na punu dužinu.
// Jedinice scene su milimetri. Šipka leži duž ose Z (0 … dužina).

type Pogled = "presek" | "cela" | "detalj";

function putanja<T extends THREE.Path>(p: T, k: Kontura) {
  const u = zaobljeniUglovi(k);
  u.forEach((t, i) => {
    if (i === 0) p.moveTo(...t.ulaz);
    else p.lineTo(...t.ulaz);
    p.quadraticCurveTo(t.ugao[0], t.ugao[1], t.izlaz[0], t.izlaz[1]);
  });
  p.closePath();
  return p;
}

function oblik(spoljna: Kontura, rupe: Kontura[] = []) {
  const s = putanja(new THREE.Shape(), spoljna);
  for (const r of rupe) s.holes.push(putanja(new THREE.Path(), r));
  return s;
}

function izvuci(s: THREE.Shape, duzina: number, z0 = 0) {
  const g = new THREE.ExtrudeGeometry(s, { depth: duzina, bevelEnabled: false, curveSegments: 6 });
  g.translate(0, 0, z0);
  return g;
}

/** Tekst kao sprite (za kotu dužine šipke). */
function tekstSprite(tekst: string, visinaMm: number) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 128;
  const x = c.getContext("2d")!;
  x.fillStyle = "rgba(255,255,255,0.92)";
  x.roundRect(8, 16, 496, 96, 20);
  x.fill();
  x.fillStyle = "#0f4c45";
  x.font = "bold 64px sans-serif";
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText(tekst, 256, 66);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
  sp.scale.set(visinaMm * 4, visinaMm, 1);
  return sp;
}

export function Profil3D({ p }: { p: Presek }) {
  const kontejner = useRef<HTMLDivElement>(null);
  const api = useRef<{ pogled: (v: Pogled) => void; providno: (v: boolean) => void; celik: (v: boolean) => void; zaptivke: (v: boolean) => void } | null>(null);
  const [pogled, setPogled] = useState<Pogled>("presek");
  const [providno, setProvidno] = useState(false);
  const [celik, setCelik] = useState(true);
  const [zaptivke, setZaptivke] = useState(true);
  const [greska, setGreska] = useState("");

  useEffect(() => {
    const el = kontejner.current;
    if (!el) return;
    // nov profil → nova scena, prekidači se vraćaju na početno stanje
    setPogled("presek");
    setProvidno(false);
    setCelik(true);
    setZaptivke(true);
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      setGreska("Pretraživač ne podržava WebGL – 3D prikaz nije moguć.");
      return;
    }
    const L = p.duzinaSipke;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#eef0ee");
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    const camera = new THREE.PerspectiveCamera(35, el.clientWidth / el.clientHeight, 1, 40000);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxDistance = 20000;
    controls.minDistance = 40;

    // ── Materijali
    const pvc = new THREE.MeshPhysicalMaterial({
      color: "#f6f6f1",
      roughness: 0.32,
      clearcoat: 0.35,
      clearcoatRoughness: 0.25,
      sheen: 0.2,
      side: THREE.DoubleSide,
    });
    const epdm = new THREE.MeshStandardMaterial({ color: "#151617", roughness: 0.85 });
    const cel = new THREE.MeshStandardMaterial({ color: "#b8c0c4", metalness: 0.9, roughness: 0.38 });

    // ── PVC telo (komore su šupljine – vide se na krajevima šipke)
    const telo = new THREE.Mesh(izvuci(oblik(p.spoljna, p.komore.map((k) => k.kontura)), L), pvc);
    telo.castShadow = true;
    telo.receiveShadow = true;
    scene.add(telo);

    // ── Zaptivke (cela dužina)
    const grupaZ = new THREE.Group();
    for (const z of p.zaptivke) grupaZ.add(new THREE.Mesh(izvuci(oblik(z.kontura), L), epdm));
    scene.add(grupaZ);

    // ── Čelično ojačanje (kraće od šipke, centrirano)
    let grupaC: THREE.Mesh | null = null;
    if (p.celik) {
      const z0 = (L - p.celik.duzina) / 2;
      grupaC = new THREE.Mesh(izvuci(oblik(p.celik.spoljna, p.celik.unutrasnja ? [p.celik.unutrasnja] : []), p.celik.duzina, z0), cel);
      grupaC.castShadow = true;
      scene.add(grupaC);
    }

    // ── Podloga, svetla, kota dužine
    // dimenzije preseka → položaj podloge, kote i kamere prilagođeni profilu
    const gr = granice(p);
    const cx = (gr.minX + gr.maxX) / 2;
    const cy = (gr.minY + gr.maxY) / 2;
    const vel = Math.max(gr.maxX - gr.minX, gr.maxY - gr.minY);
    const m = vel / 92; // razmera u odnosu na ram (92 mm)
    const podY = gr.minY - 0.5;

    const pod = new THREE.Mesh(new THREE.PlaneGeometry(4000, L + 3000), new THREE.ShadowMaterial({ opacity: 0.12 }));
    pod.rotation.x = -Math.PI / 2;
    pod.position.set(cx, podY, L / 2);
    pod.receiveShadow = true;
    scene.add(pod);
    const mreza = new THREE.GridHelper(L + 2000, Math.round((L + 2000) / 250), "#c7ccc9", "#dde1de");
    mreza.position.set(cx, podY - 0.1, L / 2);
    scene.add(mreza);

    scene.add(new THREE.HemisphereLight("#ffffff", "#c9cfcb", 0.7));
    const sunce = new THREE.DirectionalLight("#ffffff", 1.6);
    sunce.position.set(-600, 900, -400);
    sunce.castShadow = true;
    sunce.shadow.mapSize.set(2048, 2048);
    Object.assign(sunce.shadow.camera, { left: -300, right: 300, top: 300, bottom: -300, near: 10, far: 4000 });
    scene.add(sunce);
    scene.add(sunce.target);

    const kotaY = podY - 0.5;
    const kotaX = gr.maxX + Math.max(30, vel * 0.4);
    const linija = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(kotaX, kotaY, 0),
        new THREE.Vector3(kotaX, kotaY, L),
      ]),
      new THREE.LineBasicMaterial({ color: "#0f4c45" }),
    );
    scene.add(linija);
    for (const z of [0, L]) {
      const crtica = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(kotaX - 25, kotaY, z), new THREE.Vector3(kotaX + 25, kotaY, z)]),
        new THREE.LineBasicMaterial({ color: "#0f4c45" }),
      );
      scene.add(crtica);
    }
    const natpis = tekstSprite(`${L} mm`, 70);
    natpis.position.set(kotaX + 60, podY + 50, L / 2);
    scene.add(natpis);

    // ── Pogledi kamere
    const postavi = (v: Pogled) => {
      if (v === "presek") {
        camera.position.set(cx - 196 * m, cy + 127 * m, -230 * m);
        controls.target.set(cx, cy, 60 * m);
        sunce.position.set(-500, 700, -600);
        sunce.target.position.set(cx, podY, 200 * m);
      } else if (v === "detalj") {
        camera.position.set(cx - 306 * m, cy + 227 * m, 320 * m);
        controls.target.set(cx, cy, 420 * m);
        sunce.position.set(-500, 700, 0);
        sunce.target.position.set(cx, podY, 600 * m);
      } else {
        camera.position.set(cx - 2600, cy + 2100, -1200);
        controls.target.set(cx, cy, L / 2);
        sunce.position.set(-1200, 2400, L / 2 - 1500);
        sunce.target.position.set(cx, podY, L / 2);
        Object.assign(sunce.shadow.camera, { left: -L / 2 - 500, right: L / 2 + 500, top: L / 2 + 500, bottom: -L / 2 - 500 });
      }
      if (v !== "cela") Object.assign(sunce.shadow.camera, { left: -400, right: 400, top: 400, bottom: -400 });
      sunce.shadow.camera.updateProjectionMatrix();
      controls.update();
    };
    postavi("presek");

    api.current = {
      pogled: postavi,
      providno: (on) => {
        pvc.transparent = on;
        pvc.opacity = on ? 0.28 : 1;
        pvc.depthWrite = !on;
        pvc.needsUpdate = true;
      },
      celik: (on) => {
        if (grupaC) grupaC.visible = on;
      },
      zaptivke: (on) => {
        grupaZ.visible = on;
      },
    };

    let animacija = 0;
    const petlja = () => {
      animacija = requestAnimationFrame(petlja);
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
      cancelAnimationFrame(animacija);
      ro.disconnect();
      controls.dispose();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose();
      });
      pmrem.dispose();
      renderer.dispose();
      el.removeChild(renderer.domElement);
      api.current = null;
    };
  }, [p]);

  const Dugme = ({ v, n }: { v: Pogled; n: string }) => (
    <button
      type="button"
      onClick={() => {
        setPogled(v);
        api.current?.pogled(v);
      }}
      className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${pogled === v ? "bg-brand text-white" : "text-muted hover:text-foreground"}`}
    >
      {n}
    </button>
  );

  const Prekidac = ({ n, v, set }: { n: string; v: boolean; set: (v: boolean) => void }) => (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input type="checkbox" checked={v} onChange={(e) => set(e.target.checked)} className="accent-[var(--brand)]" />
      {n}
    </label>
  );

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
        <div className="inline-flex rounded-lg border border-line p-1">
          <Dugme v="presek" n="Kraj šipke (presek)" />
          <Dugme v="detalj" n="Detalj" />
          <Dugme v="cela" n={`Cela šipka ${p.duzinaSipke} mm`} />
        </div>
        <div className="flex flex-wrap gap-4">
          <Prekidac n="Providan PVC" v={providno} set={(v) => { setProvidno(v); api.current?.providno(v); }} />
          {p.celik && <Prekidac n="Čelično ojačanje" v={celik} set={(v) => { setCelik(v); api.current?.celik(v); }} />}
          <Prekidac n="Zaptivke" v={zaptivke} set={(v) => { setZaptivke(v); api.current?.zaptivke(v); }} />
        </div>
      </div>
      <div ref={kontejner} className="relative h-[480px] w-full touch-none bg-[#eef0ee] sm:h-[600px]">
        {greska && <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-danger">{greska}</p>}
      </div>
      <p className="border-t border-line px-4 py-2 text-xs text-muted">
        Levi taster: rotacija · Desni taster: pomeranje · Točkić: zum. Na telefonu: jedan prst rotira, dva prsta zumiraju.
      </p>
    </div>
  );
}
