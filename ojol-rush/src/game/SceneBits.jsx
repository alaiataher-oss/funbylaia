import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LANES } from "./constants";

const ASPHALT = "#2b2f35";
const SIDEWALK = "#e4e8ef";
const HEDGE = "#1a6b34";
const HEDGE_TOP = "#249447";
const GLASS = "#5aa8d8";
const PLANTER = "#f7f8fa";
const FLOWER = "#f8fafc";

/** Clean SCBD asphalt boulevard — wide lanes, white dashes, soft curb */
export function Road() {
  const zebras = useMemo(() => [-28, -72, -116], []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -55]} receiveShadow>
        <planeGeometry args={[15.5, 200]} />
        <meshStandardMaterial color={ASPHALT} roughness={0.94} metalness={0.02} />
      </mesh>
      {/* subtle center wash */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -55]}>
        <planeGeometry args={[1.6, 200]} />
        <meshStandardMaterial color="#1a2a3a" transparent opacity={0.28} />
      </mesh>
      {/* white dashed lane lines */}
      {[-2.35, 2.35].map((x) =>
        Array.from({ length: 36 }).map((_, i) => (
          <mesh key={`${x}-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.022, -i * 5.4 + 14]}>
            <planeGeometry args={[0.12, 2.0]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
        ))
      )}
      {/* solid edge lines */}
      {[-5.4, 5.4].map((x) => (
        <mesh key={`e${x}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.022, -55]}>
          <planeGeometry args={[0.11, 200]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
      ))}
      {/* sidewalks */}
      {[-7.55, 7.55].map((x) => (
        <mesh key={`sw${x}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.05, -55]} receiveShadow>
          <planeGeometry args={[2.9, 200]} />
          <meshStandardMaterial color={SIDEWALK} roughness={0.88} />
        </mesh>
      ))}
      {/* light stone curb */}
      {[-6.05, 6.05].map((side) =>
        Array.from({ length: 40 }).map((_, i) => (
          <mesh key={`c${side}${i}`} position={[side, 0.12, -i * 4.6 + 12]}>
            <boxGeometry args={[0.22, 0.16, 2.1]} />
            <meshStandardMaterial color={i % 2 === 0 ? "#f1f5f9" : "#c5ccd6"} />
          </mesh>
        ))
      )}
      {zebras.map((z) =>
        Array.from({ length: 8 }).map((_, i) => (
          <mesh key={`z${z}${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[-3.9 + i * 1.1, 0.025, z]}>
            <planeGeometry args={[0.55, 2.8]} />
            <meshStandardMaterial color="#f1f5f9" />
          </mesh>
        ))
      )}
    </group>
  );
}

/** Continuous manicured hedge with tiny white flower accents */
function PlanterHedge({ x, z, len = 8 }) {
  const flowers = useMemo(() => {
    const n = Math.max(3, Math.floor(len / 1.6));
    return Array.from({ length: n }).map((_, i) => ({
      y: 1.05 + (i % 3) * 0.04,
      z: -len / 2 + 0.7 + i * (len / n),
      ox: ((i % 2) - 0.5) * 0.12,
    }));
  }, [len]);
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.18, 0]} castShadow>
        <boxGeometry args={[0.72, 0.32, len + 0.2]} />
        <meshStandardMaterial color={PLANTER} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.72, 0]} castShadow>
        <boxGeometry args={[0.55, 1.05, len]} />
        <meshStandardMaterial color={HEDGE} roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.22, 0]}>
        <boxGeometry args={[0.5, 0.12, len * 0.98]} />
        <meshStandardMaterial color={HEDGE_TOP} roughness={0.85} />
      </mesh>
      {flowers.map((f, i) => (
        <mesh key={i} position={[f.ox, f.y, f.z]}>
          <sphereGeometry args={[0.06, 6, 6]} />
          <meshStandardMaterial color={FLOWER} roughness={0.55} />
        </mesh>
      ))}
    </group>
  );
}

function TopiaryPot({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.28, 0]} castShadow>
        <cylinderGeometry args={[0.38, 0.42, 0.5, 12]} />
        <meshStandardMaterial color={PLANTER} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.95, 0]} castShadow>
        <sphereGeometry args={[0.42, 14, 14]} />
        <meshStandardMaterial color={HEDGE_TOP} roughness={0.85} />
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.28, 1.15, Math.sin(a) * 0.28]}>
            <sphereGeometry args={[0.05, 6, 6]} />
            <meshStandardMaterial color={FLOWER} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Tall blue-glass SCBD tower */
function GlassTower({ w, d, h, tint }) {
  const floors = Math.max(4, Math.floor(h / 2.1));
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={tint} metalness={0.78} roughness={0.1} />
      </mesh>
      <mesh position={[0, h * 0.52, d / 2 + 0.04]}>
        <planeGeometry args={[w * 0.94, h * 0.9]} />
        <meshStandardMaterial color={GLASS} transparent opacity={0.55} metalness={0.95} roughness={0.05} />
      </mesh>
      <mesh position={[0, h * 0.52, -d / 2 - 0.04]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[w * 0.94, h * 0.9]} />
        <meshStandardMaterial color="#6eb8e8" transparent opacity={0.42} metalness={0.9} roughness={0.06} />
      </mesh>
      {Array.from({ length: floors }).map((_, i) => (
        <mesh key={i} position={[0, 1.2 + i * 2.1, d / 2 + 0.05]}>
          <planeGeometry args={[w * 0.9, 0.04]} />
          <meshStandardMaterial color="#e8f4fc" transparent opacity={0.45} />
        </mesh>
      ))}
      {/* podium plinth */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[w * 1.18, 1.1, d * 1.14]} />
        <meshStandardMaterial color="#eef2f6" metalness={0.2} roughness={0.42} />
      </mesh>
      {/* roof crown */}
      <mesh position={[0, h + 0.2, 0]}>
        <boxGeometry args={[w * 0.85, 0.35, d * 0.85]} />
        <meshStandardMaterial color="#c5d4e2" metalness={0.45} roughness={0.3} />
      </mesh>
    </group>
  );
}

/** Mid-rise glass retail / podium */
function GlassPodium({ w, d, h, tint }) {
  return (
    <group>
      <mesh castShadow position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={tint} metalness={0.55} roughness={0.22} />
      </mesh>
      <mesh position={[0, h * 0.45, d / 2 + 0.03]}>
        <planeGeometry args={[w * 0.88, h * 0.55]} />
        <meshStandardMaterial color={GLASS} transparent opacity={0.58} metalness={0.85} roughness={0.08} />
      </mesh>
      <mesh position={[0, h + 0.12, 0]}>
        <boxGeometry args={[w * 1.04, 0.22, d * 1.04]} />
        <meshStandardMaterial color="#dbe4ee" />
      </mesh>
    </group>
  );
}

function PalmTree() {
  return (
    <group>
      <mesh position={[0, 1.6, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.16, 3.2, 8]} />
        <meshStandardMaterial color="#8b6a3a" roughness={0.85} />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.55, 3.15, Math.sin(a) * 0.55]}
            rotation={[0.55, a, 0.15]}
            castShadow
          >
            <boxGeometry args={[0.12, 0.04, 1.35]} />
            <meshStandardMaterial color="#1f8a42" roughness={0.9} />
          </mesh>
        );
      })}
      <mesh position={[0, 3.25, 0]}>
        <sphereGeometry args={[0.28, 10, 10]} />
        <meshStandardMaterial color="#176332" roughness={0.9} />
      </mesh>
    </group>
  );
}

function LeafyTree() {
  return (
    <group>
      <mesh position={[0, 1.05, 0]}>
        <cylinderGeometry args={[0.14, 0.2, 2.1, 8]} />
        <meshStandardMaterial color="#6b4423" />
      </mesh>
      <mesh position={[0, 2.45, 0]} castShadow>
        <sphereGeometry args={[1.05, 12, 12]} />
        <meshStandardMaterial color="#1a7a3c" roughness={0.9} />
      </mesh>
      <mesh position={[0.4, 2.85, 0.25]}>
        <sphereGeometry args={[0.55, 10, 10]} />
        <meshStandardMaterial color="#22a04a" />
      </mesh>
      <mesh position={[-0.35, 2.7, -0.2]}>
        <sphereGeometry args={[0.48, 10, 10]} />
        <meshStandardMaterial color="#15803d" />
      </mesh>
    </group>
  );
}

/** Flat LED modern streetlight */
function ModernLamp({ night = false }) {
  return (
    <group>
      <mesh position={[0, 2.55, 0]}>
        <cylinderGeometry args={[0.045, 0.06, 5.1, 8]} />
        <meshStandardMaterial color="#9aa3b2" metalness={0.7} roughness={0.28} />
      </mesh>
      <mesh position={[0, 5.05, 0.35]} rotation={[0.12, 0, 0]}>
        <boxGeometry args={[0.08, 0.06, 0.85]} />
        <meshStandardMaterial color="#7b8494" metalness={0.65} />
      </mesh>
      <mesh position={[0, 5.0, 0.72]}>
        <boxGeometry args={[0.42, 0.08, 0.28]} />
        <meshStandardMaterial
          color="#e8eef5"
          emissive="#fef3c7"
          emissiveIntensity={night ? 1.4 : 0.15}
          metalness={0.35}
          roughness={0.25}
        />
      </mesh>
    </group>
  );
}

/** Glass pedestrian JPO skybridge across the corridor */
function GlassJPO() {
  return (
    <group>
      <mesh position={[0, 5.35, 0]} castShadow>
        <boxGeometry args={[16.5, 0.28, 2.6]} />
        <meshStandardMaterial color="#c9d2dc" metalness={0.35} roughness={0.4} />
      </mesh>
      {/* glass deck sides */}
      <mesh position={[0, 5.95, 1.15]}>
        <boxGeometry args={[16.2, 0.95, 0.08]} />
        <meshStandardMaterial color={GLASS} transparent opacity={0.4} metalness={0.85} roughness={0.08} />
      </mesh>
      <mesh position={[0, 5.95, -1.15]}>
        <boxGeometry args={[16.2, 0.95, 0.08]} />
        <meshStandardMaterial color={GLASS} transparent opacity={0.4} metalness={0.85} roughness={0.08} />
      </mesh>
      {/* roof canopy */}
      <mesh position={[0, 6.55, 0]}>
        <boxGeometry args={[16.4, 0.1, 2.8]} />
        <meshStandardMaterial color="#aeb8c4" metalness={0.45} roughness={0.35} />
      </mesh>
      {/* support pylons */}
      {[-7.4, 7.4].map((x) => (
        <group key={x}>
          <mesh position={[x, 2.7, 0]} castShadow>
            <boxGeometry args={[0.45, 5.4, 1.5]} />
            <meshStandardMaterial color="#dfe5ec" metalness={0.25} roughness={0.45} />
          </mesh>
          <mesh position={[x, 4.2, 0.78]}>
            <planeGeometry args={[0.35, 2.2]} />
            <meshStandardMaterial color={GLASS} transparent opacity={0.35} metalness={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function hash01(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Premium SCBD roadside — glass towers + palms only */
function RoadsideParcel({ i, side, night }) {
  const h1 = hash01(i * 2.17 + side * 9.3);
  const h2 = hash01(i * 5.91 + side * 3.1 + 1.7);
  const h3 = hash01(i * 11.3 + side * 7.7 + 4.2);
  const setback = 9.2 + h1 * 1.8;
  const x = side * setback;

  const towerTints = ["#4a90c2", "#3d7eb0", "#5a9ccc", "#6aa8d4", "#4588b8", "#7bb4dc", "#3a72a4"];
  const podiumTints = ["#8eb8d4", "#a0c4dc", "#6fa0c4", "#b0d0e4"];

  let body;
  if (h1 < 0.62) {
    body = (
      <GlassTower
        w={2.6 + h2 * 1.6}
        d={2.9 + h3 * 1.4}
        h={16 + h2 * 28 + h3 * 10}
        tint={night ? "#1a2838" : towerTints[Math.floor(h3 * towerTints.length) % towerTints.length]}
      />
    );
  } else if (h1 < 0.82) {
    body = (
      <GlassPodium
        w={3.6 + h2 * 2}
        d={3.2 + h3}
        h={6 + h2 * 6}
        tint={night ? "#243044" : podiumTints[Math.floor(h2 * podiumTints.length) % podiumTints.length]}
      />
    );
  } else {
    // landscaped pocket between towers
    body = (
      <group>
        <PalmTree />
        <group position={[side * 1.3, 0, -1.5]}>
          <LeafyTree />
        </group>
        {h3 > 0.35 && <TopiaryPot position={[0.5, 0, 0.9]} />}
      </group>
    );
  }

  return (
    <group position={[x, 0, (h3 - 0.5) * 1.2]}>
      {body}
      {h2 > 0.2 && h1 < 0.85 && (
        <group position={[side * (7.0 - setback), 0, 1.1]}>
          {h3 > 0.5 ? <PalmTree /> : <LeafyTree />}
        </group>
      )}
      {h3 > 0.6 && h1 < 0.7 && <TopiaryPot position={[side * (7.35 - setback), 0, -0.8]} />}
    </group>
  );
}

/** Premium SCBD boulevard — glass skyline, hedges, palms, JPO */
export function Cityscape({ phase, stateRef }) {
  const scrollGroup = useRef();

  useFrame((_, dt) => {
    const s = stateRef?.current;
    const brake = s?.brake || 0;
    const spd = s ? Math.max(0, s.speed * 0.85 * (1 - brake * 0.98)) : 14;
    if (!scrollGroup.current) return;
    scrollGroup.current.children.forEach((ch) => {
      if (!ch.userData.scroll) return;
      ch.position.z += spd * dt;
      if (ch.position.z > 42) ch.position.z -= ch.userData.loop || 130;
    });
  });

  const night = phase === "night";
  const skyColor = phase === "night" ? "#0a1220" : phase === "rain" ? "#8fa0ae" : "#5eb4ef";
  const fog = phase === "night" ? "#101826" : phase === "rain" ? "#9aabba" : "#9fd0f5";
  const sun = phase === "night" ? 0.4 : phase === "rain" ? 0.85 : 1.75;

  const parcels = useMemo(() => {
    const list = [];
    let z = 18;
    for (let i = 0; i < 36; i += 1) {
      const gap = 7.0 + hash01(i * 3.3) * 4.8;
      z -= gap;
      list.push({ key: `L${i}`, side: -1, z, i });
      const zr = z - (hash01(i + 40) - 0.5) * 3.2;
      list.push({ key: `R${i}`, side: 1, z: zr, i: i + 100 });
    }
    return list;
  }, []);

  const landmarks = useMemo(
    () => [
      { key: "jpo1", type: "jpo", z: -42 },
      { key: "jpo2", type: "jpo", z: -108 },
      { key: "sh1", type: "shelter", z: -24, x: -7.0 },
      { key: "sh2", type: "shelter", z: -88, x: 7.0 },
    ],
    []
  );

  const hedges = useMemo(() => {
    const list = [];
    for (let i = 0; i < 22; i += 1) {
      const z = 16 - i * 8.2;
      list.push({ key: `hl${i}`, x: -6.35, z, len: 7.4 });
      list.push({ key: `hr${i}`, x: 6.35, z: z - 1.1, len: 7.4 });
    }
    return list;
  }, []);

  return (
    <group>
      <color attach="background" args={[skyColor]} />
      <fog attach="fog" args={[fog, 32, 118]} />
      <hemisphereLight args={["#dff0ff", "#7a9478", night ? 0.28 : 0.78]} />
      <ambientLight intensity={night ? 0.2 : 0.62} />
      <directionalLight
        castShadow
        intensity={sun}
        position={[14, 32, 12]}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={95}
        shadow-camera-left={-26}
        shadow-camera-right={26}
        shadow-camera-top={26}
        shadow-camera-bottom={-26}
        shadow-bias={-0.0002}
      />
      <directionalLight intensity={night ? 0.12 : 0.38} position={[-10, 14, -8]} color="#b8d8f5" />

      <group ref={scrollGroup}>
        {parcels.map((p) => (
          <group key={p.key} position={[0, 0, p.z]} userData={{ scroll: true, loop: 160 }}>
            <RoadsideParcel i={p.i} side={p.side} night={night} />
          </group>
        ))}

        {hedges.map((h) => (
          <group key={h.key} position={[0, 0, h.z]} userData={{ scroll: true, loop: 160 }}>
            <PlanterHedge x={h.x} z={0} len={h.len} />
          </group>
        ))}

        {landmarks.map((lm) => (
          <group key={lm.key} position={[lm.x || 0, 0, lm.z]} userData={{ scroll: true, loop: 160 }}>
            {lm.type === "jpo" && <GlassJPO />}
            {lm.type === "shelter" && (
              <group>
                <mesh position={[0, 2.35, 0]}>
                  <boxGeometry args={[2.4, 0.1, 3.2]} />
                  <meshStandardMaterial color="#e8eef5" metalness={0.4} />
                </mesh>
                <mesh position={[lm.x > 0 ? -0.95 : 0.95, 1.15, 0]}>
                  <boxGeometry args={[0.08, 2.2, 3]} />
                  <meshStandardMaterial color={GLASS} transparent opacity={0.35} metalness={0.6} />
                </mesh>
                <TopiaryPot position={[lm.x > 0 ? -1.4 : 1.4, 0, 1.2]} />
              </group>
            )}
          </group>
        ))}

        {Array.from({ length: 18 }).map((_, i) => {
          const side = i % 2 === 0 ? -1 : 1;
          const zOff = -i * (9.5 + hash01(i) * 3.5);
          return (
            <group
              key={`lamp${i}`}
              position={[side * 6.55, 0, zOff]}
              rotation={[0, side > 0 ? Math.PI : 0, 0]}
              userData={{ scroll: true, loop: 160 }}
            >
              <ModernLamp night={night} />
            </group>
          );
        })}

        {Array.from({ length: 12 }).map((_, i) => {
          const side = i % 2 === 0 ? -1 : 1;
          const zOff = -8 - i * 12.5;
          return (
            <group key={`tree${i}`} position={[side * 7.35, 0, zOff]} userData={{ scroll: true, loop: 160 }}>
              {hash01(i + 7) > 0.45 ? <PalmTree /> : <LeafyTree />}
            </group>
          );
        })}
      </group>
    </group>
  );
}

export function CityscapeLite() {
  return (
    <group>
      <color attach="background" args={["#5eb4ef"]} />
      <ambientLight intensity={0.65} />
      <directionalLight intensity={1.75} position={[12, 28, 10]} />
      <Road />
      <group position={[-10.5, 0, -14]}>
        <GlassTower w={3.2} d={3.8} h={26} tint="#4a90c2" />
      </group>
      <group position={[10.8, 0, -18]}>
        <GlassTower w={3.0} d={3.6} h={22} tint="#5a9ccc" />
      </group>
      <group position={[11.2, 0, -6]}>
        <GlassPodium w={4.2} d={3.5} h={7} tint="#8eb8d4" />
      </group>
      <PlanterHedge x={-6.35} z={-4} len={10} />
      <PlanterHedge x={6.35} z={-8} len={10} />
      <group position={[-7.2, 0, -2]}>
        <PalmTree />
      </group>
      <group position={[7.3, 0, -5]}>
        <LeafyTree />
      </group>
      <TopiaryPot position={[-7.0, 0, 2]} />
      <TopiaryPot position={[7.0, 0, 0]} />
      <group position={[0, 0, -22]}>
        <GlassJPO />
      </group>
      <group position={[-6.55, 0, 4]} rotation={[0, Math.PI, 0]}>
        <ModernLamp />
      </group>
      <group position={[6.55, 0, -2]}>
        <ModernLamp />
      </group>
    </group>
  );
}

/** Player ojol */
export function Rider({ stateRef }) {
  const root = useRef();
  const shieldMesh = useRef();
  const magnetGlow = useRef();
  const lean = useRef(0);

  useFrame((_, dt) => {
    const s = stateRef?.current;
    if (shieldMesh.current) shieldMesh.current.visible = !!(s && s.shield > 0);
    if (magnetGlow.current) magnetGlow.current.visible = !!(s && s.magnet > 0);
    if (s && root.current) {
      const targetLean = (LANES[s.lane] - s.laneX) * -0.32;
      lean.current += (targetLean - lean.current) * Math.min(1, 10 * dt);
      root.current.rotation.z = lean.current;
    }
  });

  return (
    <group ref={root}>
      <mesh position={[0, 0.32, 0.05]} castShadow>
        <capsuleGeometry args={[0.15, 0.68, 4, 10]} />
        <meshStandardMaterial color="#0f172a" metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.55, -0.05]} castShadow>
        <capsuleGeometry args={[0.2, 0.22, 4, 8]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      <mesh position={[0, 0.92, -0.1]} castShadow>
        <capsuleGeometry args={[0.2, 0.26, 4, 8]} />
        <meshStandardMaterial color="#16a34a" roughness={0.55} />
      </mesh>
      <mesh position={[0, 1.24, -0.06]} castShadow>
        <sphereGeometry args={[0.24, 16, 16]} />
        <meshStandardMaterial color="#22c55e" roughness={0.28} metalness={0.2} />
      </mesh>
      <mesh position={[0, 1.24, 0.12]}>
        <boxGeometry args={[0.26, 0.12, 0.07]} />
        <meshStandardMaterial color="#0f172a" transparent opacity={0.55} />
      </mesh>
      <mesh position={[0, 0.22, 0.46]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.18, 0.06, 8, 16]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>
      <mesh position={[0, 0.22, -0.5]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.18, 0.06, 8, 16]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>
      <mesh position={[0, 0.82, 0.28]} rotation={[0.4, 0, 0]}>
        <cylinderGeometry args={[0.028, 0.028, 0.5, 8]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.65} />
      </mesh>
      <mesh ref={shieldMesh} position={[0, 0.9, 0]} visible={false}>
        <sphereGeometry args={[0.95, 18, 18]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.22} />
      </mesh>
      <mesh ref={magnetGlow} position={[0, 0.55, 0]} visible={false}>
        <torusGeometry args={[0.85, 0.1, 8, 28]} />
        <meshBasicMaterial color="#ff2a2a" transparent opacity={0.65} />
      </mesh>
    </group>
  );
}

function Wheel({ x, z, r = 0.22 }) {
  return (
    <group position={[x, r, z]}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[r, r, 0.16, 14]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[r * 0.55, r * 0.55, 0.17, 10]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

/** Boxy realistic-ish city sedan */
function SedanMesh({ color = "#64748b" }) {
  return (
    <group>
      {/* chassis */}
      <mesh position={[0, 0.38, 0]} castShadow userData={{ tint: true }}>
        <boxGeometry args={[1.35, 0.42, 2.45]} />
        <meshStandardMaterial color={color} metalness={0.62} roughness={0.28} />
      </mesh>
      {/* hood */}
      <mesh position={[0, 0.52, 0.55]} castShadow userData={{ tint: true }}>
        <boxGeometry args={[1.28, 0.18, 0.85]} />
        <meshStandardMaterial color={color} metalness={0.62} roughness={0.28} />
      </mesh>
      {/* cabin */}
      <mesh position={[0, 0.78, -0.12]} castShadow userData={{ tint: true }}>
        <boxGeometry args={[1.2, 0.48, 1.15]} />
        <meshStandardMaterial color={color} metalness={0.55} roughness={0.32} />
      </mesh>
      {/* windshield */}
      <mesh position={[0, 0.82, 0.42]} rotation={[-0.35, 0, 0]}>
        <boxGeometry args={[1.1, 0.38, 0.06]} />
        <meshStandardMaterial color="#7eb8de" transparent opacity={0.55} metalness={0.8} roughness={0.08} />
      </mesh>
      {/* side glass */}
      <mesh position={[0.62, 0.82, -0.1]}>
        <boxGeometry args={[0.04, 0.32, 0.9]} />
        <meshStandardMaterial color="#7eb8de" transparent opacity={0.45} metalness={0.7} />
      </mesh>
      <mesh position={[-0.62, 0.82, -0.1]}>
        <boxGeometry args={[0.04, 0.32, 0.9]} />
        <meshStandardMaterial color="#7eb8de" transparent opacity={0.45} metalness={0.7} />
      </mesh>
      {/* rear window */}
      <mesh position={[0, 0.82, -0.68]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[1.05, 0.32, 0.05]} />
        <meshStandardMaterial color="#5b8fb5" transparent opacity={0.5} metalness={0.7} />
      </mesh>
      {/* bumper */}
      <mesh position={[0, 0.28, 1.22]}>
        <boxGeometry args={[1.3, 0.22, 0.12]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0, 0.28, -1.22]}>
        <boxGeometry args={[1.3, 0.22, 0.12]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      {/* headlights */}
      <mesh position={[-0.42, 0.45, 1.24]}>
        <boxGeometry args={[0.28, 0.12, 0.06]} />
        <meshStandardMaterial color="#fef9c3" emissive="#fde68a" emissiveIntensity={0.55} />
      </mesh>
      <mesh position={[0.42, 0.45, 1.24]}>
        <boxGeometry args={[0.28, 0.12, 0.06]} />
        <meshStandardMaterial color="#fef9c3" emissive="#fde68a" emissiveIntensity={0.55} />
      </mesh>
      {/* taillights */}
      <mesh position={[-0.45, 0.5, -1.24]}>
        <boxGeometry args={[0.3, 0.1, 0.05]} />
        <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0.45, 0.5, -1.24]}>
        <boxGeometry args={[0.3, 0.1, 0.05]} />
        <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={0.4} />
      </mesh>
      {/* mirrors */}
      <mesh position={[0.72, 0.72, 0.25]}>
        <boxGeometry args={[0.12, 0.08, 0.18]} />
        <meshStandardMaterial color={color} metalness={0.5} />
      </mesh>
      <mesh position={[-0.72, 0.72, 0.25]}>
        <boxGeometry args={[0.12, 0.08, 0.18]} />
        <meshStandardMaterial color={color} metalness={0.5} />
      </mesh>
      <Wheel x={0.58} z={0.72} />
      <Wheel x={-0.58} z={0.72} />
      <Wheel x={0.58} z={-0.72} />
      <Wheel x={-0.58} z={-0.72} />
    </group>
  );
}

function TaxiMesh() {
  return (
    <group>
      <SedanMesh color="#f0c92e" />
      <mesh position={[0, 1.08, -0.05]}>
        <boxGeometry args={[0.38, 0.14, 0.48]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      <mesh position={[0, 1.18, -0.05]}>
        <boxGeometry args={[0.3, 0.08, 0.36]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
    </group>
  );
}

function BusMesh() {
  return (
    <group>
      <mesh position={[0, 1.05, 0]} castShadow userData={{ tint: true }}>
        <boxGeometry args={[1.55, 1.7, 4.0]} />
        <meshStandardMaterial color="#2a6ae0" metalness={0.4} roughness={0.35} />
      </mesh>
      <mesh position={[0, 1.35, 0.05]}>
        <boxGeometry args={[1.48, 0.7, 3.7]} />
        <meshStandardMaterial color="#8ec5e8" transparent opacity={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.55, 2.05]}>
        <boxGeometry args={[1.4, 0.7, 0.08]} />
        <meshStandardMaterial color="#7eb8de" transparent opacity={0.55} metalness={0.7} />
      </mesh>
      <mesh position={[0, 0.35, 2.1]}>
        <boxGeometry args={[1.35, 0.2, 0.1]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
      <Wheel x={0.62} z={1.3} r={0.28} />
      <Wheel x={-0.62} z={1.3} r={0.28} />
      <Wheel x={0.62} z={-0.2} r={0.28} />
      <Wheel x={-0.62} z={-0.2} r={0.28} />
      <Wheel x={0.62} z={-1.4} r={0.28} />
      <Wheel x={-0.62} z={-1.4} r={0.28} />
    </group>
  );
}

function TruckMesh() {
  return (
    <group>
      <mesh position={[0, 0.7, 1.0]} castShadow userData={{ tint: true }}>
        <boxGeometry args={[1.4, 1.05, 1.4]} />
        <meshStandardMaterial color="#e85d04" metalness={0.4} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.95, 1.05]}>
        <boxGeometry args={[1.2, 0.45, 0.08]} />
        <meshStandardMaterial color="#7eb8de" transparent opacity={0.5} metalness={0.65} />
      </mesh>
      <mesh position={[0, 1.1, -0.55]} castShadow>
        <boxGeometry args={[1.5, 1.7, 2.4]} />
        <meshStandardMaterial color="#e5e7eb" roughness={0.65} />
      </mesh>
      <Wheel x={0.62} z={1.15} r={0.28} />
      <Wheel x={-0.62} z={1.15} r={0.28} />
      <Wheel x={0.62} z={-0.3} r={0.28} />
      <Wheel x={-0.62} z={-0.3} r={0.28} />
      <Wheel x={0.62} z={-1.2} r={0.28} />
      <Wheel x={-0.62} z={-1.2} r={0.28} />
    </group>
  );
}

function MotorMesh({ color = "#334155" }) {
  return (
    <group>
      <mesh position={[0, 0.36, 0]} castShadow userData={{ tint: true }}>
        <boxGeometry args={[0.32, 0.28, 1.15]} />
        <meshStandardMaterial color={color} metalness={0.45} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.55, 0.15]} castShadow userData={{ tint: true }}>
        <boxGeometry args={[0.28, 0.22, 0.45]} />
        <meshStandardMaterial color={color} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.78, -0.05]} castShadow>
        <capsuleGeometry args={[0.16, 0.22, 4, 8]} />
        <meshStandardMaterial color="#16a34a" />
      </mesh>
      <mesh position={[0, 1.05, -0.02]} castShadow>
        <sphereGeometry args={[0.17, 12, 12]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0, 0.85, 0.35]} rotation={[0.5, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.45, 6]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.22, 0.42]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.16, 0.05, 8, 14]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>
      <mesh position={[0, 0.22, -0.45]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.16, 0.05, 8, 14]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>
    </group>
  );
}

/** Big red Subway Surfers–style horseshoe magnet + blinding glow */
function MagnetPickup() {
  return (
    <group scale={1.35}>
      {/* blinding aura */}
      <mesh>
        <sphereGeometry args={[0.95, 20, 20]} />
        <meshBasicMaterial color="#ff2a2a" transparent opacity={0.22} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.7, 16, 16]} />
        <meshBasicMaterial color="#ff7a7a" transparent opacity={0.35} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.42, 12, 12]} />
        <meshBasicMaterial color="#fff5f5" transparent opacity={0.55} depthWrite={false} />
      </mesh>
      {/* thick red horseshoe body */}
      <mesh position={[-0.32, 0.05, 0]}>
        <boxGeometry args={[0.34, 0.95, 0.34]} />
        <meshStandardMaterial
          color="#e11d48"
          emissive="#ff0033"
          emissiveIntensity={1.4}
          metalness={0.35}
          roughness={0.25}
        />
      </mesh>
      <mesh position={[0.32, 0.05, 0]}>
        <boxGeometry args={[0.34, 0.95, 0.34]} />
        <meshStandardMaterial
          color="#e11d48"
          emissive="#ff0033"
          emissiveIntensity={1.4}
          metalness={0.35}
          roughness={0.25}
        />
      </mesh>
      <mesh position={[0, 0.48, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.32, 0.17, 10, 24, Math.PI]} />
        <meshStandardMaterial
          color="#be123c"
          emissive="#ff1a4a"
          emissiveIntensity={1.5}
          metalness={0.4}
          roughness={0.22}
        />
      </mesh>
      {/* silver / grey poles like Subway Surfers */}
      <mesh position={[-0.32, -0.52, 0]}>
        <boxGeometry args={[0.38, 0.28, 0.38]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.85} roughness={0.2} emissive="#ffffff" emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[0.32, -0.52, 0]}>
        <boxGeometry args={[0.38, 0.28, 0.38]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.85} roughness={0.2} emissive="#ffffff" emissiveIntensity={0.35} />
      </mesh>
      {/* hot core flare */}
      <mesh position={[0, 0.15, 0.2]}>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.75} depthWrite={false} />
      </mesh>
    </group>
  );
}

/** Bright cyan shield orb — hard to miss */
function ShieldPickup() {
  return (
    <group scale={1.25}>
      <mesh>
        <sphereGeometry args={[0.95, 20, 20]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.2} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.68, 16, 16]} />
        <meshBasicMaterial color="#67e8f9" transparent opacity={0.38} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.48, 16, 16]} />
        <meshStandardMaterial
          color="#38bdf8"
          transparent
          opacity={0.55}
          emissive="#22d3ee"
          emissiveIntensity={1.6}
          metalness={0.2}
          roughness={0.15}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshBasicMaterial color="#ecfeff" transparent opacity={0.85} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, 0.32]} rotation={[0.15, 0, 0]}>
        <circleGeometry args={[0.26, 5]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

function BarrierHazard() {
  return (
    <group>
      {/* concrete jersey — grey, NOT orange */}
      <mesh castShadow position={[0, 0.4, 0]}>
        <boxGeometry args={[1.6, 0.8, 0.4]} />
        <meshStandardMaterial color="#9ca3af" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.55, 0.22]}>
        <boxGeometry args={[1.55, 0.18, 0.06]} />
        <meshStandardMaterial color="#dc2626" />
      </mesh>
      <mesh position={[0, 0.28, 0.22]}>
        <boxGeometry args={[1.55, 0.18, 0.06]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
    </group>
  );
}

function ConeHazard() {
  return (
    <group>
      {/* yellow / black caution cone — not powerup orange orb */}
      <mesh castShadow position={[0, 0.4, 0]}>
        <coneGeometry args={[0.32, 0.85, 10]} />
        <meshStandardMaterial color="#eab308" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.2, 0.24, 0.14, 10]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.26, 0.3, 0.12, 10]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
    </group>
  );
}

function HoleHazard() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
      <circleGeometry args={[0.9, 20]} />
      <meshStandardMaterial color="#0f172a" roughness={1} />
    </mesh>
  );
}

/** Traffic signal — red means stop until green */
export function TrafficLight({ stateRef }) {
  const root = useRef();
  const red = useRef();
  const yellow = useRef();
  const green = useRef();
  const stopLine = useRef();

  useFrame(() => {
    const s = stateRef?.current;
    if (!root.current || !s) return;
    const active = s.light === "yellow" || s.light === "red" || s.brake > 0.15;
    root.current.visible = active || s.light !== "green";
    // keep a pole visible ahead even on green late cycle? show when approaching
    const show = s.light !== "green" || s.nextLight < 4;
    root.current.visible = show;
    if (show) {
      // when green and nextLight counting, park light far ahead until yellow starts
      const z = s.light !== "green" ? s.lightZ : -42;
      root.current.position.set(5.9, 0, z);
    }
    if (red.current) {
      red.current.material.emissiveIntensity = s.light === "red" ? 2.2 : 0.05;
      red.current.material.color.set(s.light === "red" ? "#ef4444" : "#4a1515");
    }
    if (yellow.current) {
      yellow.current.material.emissiveIntensity = s.light === "yellow" ? 2 : 0.05;
      yellow.current.material.color.set(s.light === "yellow" ? "#facc15" : "#4a3f10");
    }
    if (green.current) {
      green.current.material.emissiveIntensity = s.light === "green" ? 1.6 : 0.05;
      green.current.material.color.set(s.light === "green" ? "#22c55e" : "#14301a");
    }
    if (stopLine.current) {
      stopLine.current.visible = s.light === "red" || s.light === "yellow";
      stopLine.current.position.z = (s.lightZ || -20) + 6;
    }
  });

  return (
    <group>
      <group ref={root} visible={false}>
        <mesh position={[0, 2.4, 0]}>
          <cylinderGeometry args={[0.07, 0.09, 4.8, 8]} />
          <meshStandardMaterial color="#374151" metalness={0.4} />
        </mesh>
        <mesh position={[-0.35, 4.5, 0]} castShadow>
          <boxGeometry args={[0.45, 1.35, 0.35]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>
        <mesh ref={red} position={[-0.35, 4.95, 0.2]}>
          <sphereGeometry args={[0.14, 12, 12]} />
          <meshStandardMaterial color="#4a1515" emissive="#ef4444" emissiveIntensity={0.05} />
        </mesh>
        <mesh ref={yellow} position={[-0.35, 4.55, 0.2]}>
          <sphereGeometry args={[0.14, 12, 12]} />
          <meshStandardMaterial color="#4a3f10" emissive="#facc15" emissiveIntensity={0.05} />
        </mesh>
        <mesh ref={green} position={[-0.35, 4.15, 0.2]}>
          <sphereGeometry args={[0.14, 12, 12]} />
          <meshStandardMaterial color="#14301a" emissive="#22c55e" emissiveIntensity={0.05} />
        </mesh>
      </group>
      <mesh ref={stopLine} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -20]} visible={false}>
        <planeGeometry args={[11, 0.35]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
    </group>
  );
}

export function PooledWorld({ pools }) {
  const carRefs = useRef([]);
  const warnRefs = useRef([]);
  const coinRefs = useRef([]);
  const hazardRefs = useRef([]);
  const powerRefs = useRef([]);
  const spin = useRef(0);
  const yaw = useRef([]);
  const lastKind = useRef([]);
  const lastPower = useRef([]);

  useFrame((_, dt) => {
    spin.current += dt * 2.5;
    pools.cars.forEach((v, i) => {
      const g = carRefs.current[i];
      const w = warnRefs.current[i];
      if (!g) return;
      g.visible = !!v.active;
      if (!yaw.current[i]) yaw.current[i] = 0;
      if (v.active) {
        g.position.x += (v.x - g.position.x) * Math.min(1, 14 * dt);
        g.position.z = v.z;
        g.position.y = 0;
        const targetYaw = v.switching ? Math.sign(v.targetLane - v.lane || 1) * -0.22 : 0;
        yaw.current[i] += (targetYaw - yaw.current[i]) * Math.min(1, 8 * dt);
        const face = v.fromBehind ? Math.PI : 0;
        g.rotation.y = yaw.current[i] + face;
        g.rotation.z = yaw.current[i] * 0.35;
        const want = v.kind || "car";
        if (lastKind.current[i] !== want) {
          lastKind.current[i] = want;
          g.children.forEach((ch) => {
            if (ch.name) ch.visible = ch.name === want;
          });
        }
        if (v.color) {
          g.traverse((ch) => {
            if (ch.isMesh && ch.userData?.tint && ch.material?.color) {
              ch.material.color.set(v.color);
            }
          });
        }
      }
      if (w) {
        w.visible = !!(v.active && (v.warn || (v.fromBehind && v.z < 6 && v.z > 0.8)));
        if (v.active) {
          w.position.set(g.position.x, 2.0, v.z);
          if (v.fromBehind) w.material.color.set("#f97316");
          else w.material.color.set("#fbbf24");
        }
      }
    });
    pools.coins.forEach((c, i) => {
      const m = coinRefs.current[i];
      if (!m) return;
      m.visible = !!c.active;
      if (c.active) {
        m.position.set(c.x, c.y, c.z);
        m.rotation.set(Math.PI / 2, spin.current + i, 0);
      }
    });
    pools.hazards.forEach((h, i) => {
      const g = hazardRefs.current[i];
      if (!g) return;
      g.visible = !!h.active;
      if (h.active) {
        g.position.set(h.x, 0, h.z);
        g.children.forEach((ch) => {
          if (ch.name) ch.visible = ch.name === h.kind;
        });
      }
    });
    pools.powers.forEach((p, i) => {
      const g = powerRefs.current[i];
      if (!g) return;
      g.visible = !!p.active;
      if (p.active) {
        const pulse = 1 + Math.sin(spin.current * 6 + i) * 0.12;
        g.position.set(p.x, 1.05 + Math.sin(spin.current * 2.4 + i) * 0.18, p.z);
        g.rotation.y += dt * 2.4;
        g.scale.setScalar(pulse);
        if (lastPower.current[i] !== p.kind) {
          lastPower.current[i] = p.kind;
          g.children.forEach((ch) => {
            if (ch.name) ch.visible = ch.name === p.kind;
          });
        }
      }
    });
  });

  return (
    <group>
      {pools.cars.map((v, i) => (
        <group key={`car${i}`}>
          <group
            ref={(el) => {
              carRefs.current[i] = el;
            }}
            visible={false}
          >
            <group name="car" visible>
              <SedanMesh color="#64748b" />
            </group>
            <group name="taxi" visible={false}>
              <TaxiMesh />
            </group>
            <group name="bus" visible={false}>
              <BusMesh />
            </group>
            <group name="truck" visible={false}>
              <TruckMesh />
            </group>
            <group name="motor" visible={false}>
              <MotorMesh color="#334155" />
            </group>
          </group>
          <mesh
            ref={(el) => {
              warnRefs.current[i] = el;
            }}
            visible={false}
          >
            <sphereGeometry args={[0.2, 10, 10]} />
            <meshBasicMaterial color="#fbbf24" />
          </mesh>
        </group>
      ))}
      {pools.coins.map((_, i) => (
        <mesh
          key={`coin${i}`}
          ref={(el) => {
            coinRefs.current[i] = el;
          }}
          visible={false}
        >
          <cylinderGeometry args={[0.26, 0.26, 0.07, 16]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.65} roughness={0.2} />
        </mesh>
      ))}
      {pools.hazards.map((_, i) => (
        <group
          key={`h${i}`}
          ref={(el) => {
            hazardRefs.current[i] = el;
          }}
          visible={false}
        >
          <group name="barrier" visible={false}>
            <BarrierHazard />
          </group>
          <group name="cone" visible={false}>
            <ConeHazard />
          </group>
          <group name="hole" visible={false}>
            <HoleHazard />
          </group>
        </group>
      ))}
      {pools.powers.map((_, i) => (
        <group
          key={`p${i}`}
          ref={(el) => {
            powerRefs.current[i] = el;
          }}
          visible={false}
        >
          <group name="magnet" visible={false}>
            <MagnetPickup />
          </group>
          <group name="shield" visible={false}>
            <ShieldPickup />
          </group>
        </group>
      ))}
    </group>
  );
}

export function FollowCam({ playerGroup, stateRef }) {
  useFrame(({ camera }) => {
    const p = playerGroup.current?.position || new THREE.Vector3();
    const shake = stateRef.current?.shake || 0;
    const sx = (Math.random() - 0.5) * shake * 1.2;
    const sy = (Math.random() - 0.5) * shake;
    camera.position.lerp(new THREE.Vector3(p.x * 0.28 + sx, 4.05 + sy, 8.5), 0.12);
    camera.lookAt(p.x * 0.4, 1.0, p.z - 8);
  });
  return null;
}
