import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Sparkles, Billboard, Text, Line } from "@react-three/drei";
import { COLORS } from "../../theme/tokens";
import { CROSS_LINKS, PROFILE_NODES } from "./data/profileNodes";
import { BODY_SYMBOLS } from "../library/data/bodySymbols";
import { BODY_SYSTEMS } from "../library/data/bodySystems";
import { buildSymbolGraph, entriesForTag, hashTag, neighborsForTag, SYMBOL_PALETTE } from "./symbolGraph";
import { fibonacciSpherePosition } from "./sphereLayout";
import { HOLOGRAM_PALETTES, useHologramTheme } from "./hologramTheme";

// One shared 3D scene instead of four separate holograms. Chelsey's own
// framing, twice over: (1) this should feel like one personal universe
// with regions, not four unrelated maps glued together, and (2) the body
// is the real anchor -- dream symbols, the app's own architecture, and
// the inner team all relate back to it, so it sits at the center with
// the other three regions orbiting it, instead of four arbitrary compass
// points with no relationship to each other.

const SATELLITE_RADIUS = 11;
function satellitePosition(index) {
  const angle = -Math.PI / 2 + index * ((2 * Math.PI) / 3);
  return [SATELLITE_RADIUS * Math.cos(angle), 0, SATELLITE_RADIUS * Math.sin(angle)];
}

const REGION_OFFSET = {
  body: [0, 0, 0],
  architecture: satellitePosition(0),
  symbols: satellitePosition(1),
  team: satellitePosition(2),
};

const REGION_LABEL = {
  architecture: "Architecture",
  symbols: "Your Symbols",
  body: "Body",
  team: "Inner Team",
};

// Real (if illustrative) physiological relationships between systems --
// not every system touches every other one, but these are the ones a
// coach would actually reach for: HPA-axis, gas exchange, filtration,
// structural, defensive. Rendered in gold as the map's overview network;
// hidden once you drill into a single system since only that system
// matters at that point.
const SYSTEM_LINKS = [
  ["nervous", "endocrine"],
  ["nervous", "muscular"],
  ["cardiovascular", "respiratory"],
  ["cardiovascular", "lymphatic"],
  ["digestive", "lymphatic"],
  ["digestive", "urinary"],
  ["endocrine", "reproductive"],
  ["integumentary", "lymphatic"],
  ["skeletal", "muscular"],
  ["skeletal", "endocrine"],
  ["urinary", "cardiovascular"],
];

// Real (if brief) reason each SYSTEM_LINKS pair is actually linked --
// shown when you tap the connecting line itself, so the gold lines are
// real clickable content, not just decoration.
const SYSTEM_LINK_BLURB = {
  "nervous|endocrine": "The HPA axis -- the nervous system triggers the hormonal stress response, and hormones feed back to shape nervous system activity in return.",
  "nervous|muscular": "Motor control -- a nerve signal is what actually triggers a muscle to contract.",
  "cardiovascular|respiratory": "Gas exchange -- the heart and lungs work as one loop, trading oxygen for carbon dioxide every cycle.",
  "cardiovascular|lymphatic": "Fluid balance -- the lymphatic system returns fluid the bloodstream leaves behind back into circulation.",
  "digestive|lymphatic": "Gut immune surveillance -- most of the body's immune tissue actually lines the digestive tract.",
  "digestive|urinary": "Waste processing -- two different systems, the same underlying job of deciding what the body releases.",
  "endocrine|reproductive": "Hormonal drive -- the reproductive system runs almost entirely on signals from the endocrine system.",
  "integumentary|lymphatic": "First line of defense -- skin is the physical barrier, the immune system is what backs it up.",
  "skeletal|muscular": "Structural movement -- muscles only create motion by pulling against bone.",
  "skeletal|endocrine": "Bone marrow and calcium -- bone is hormonally regulated tissue, and it's where blood cells are actually made.",
  "urinary|cardiovascular": "Blood filtration -- the kidneys filter the entire blood supply continuously, not just occasionally.",
};
function systemLinkBlurb(aKey, bKey) {
  return SYSTEM_LINK_BLURB[`${aKey}|${bKey}`] || SYSTEM_LINK_BLURB[`${bKey}|${aKey}`] || "Two systems that regularly show up together in real physiology.";
}

// heightFrac/cy both run head-to-foot (0/low = head, 1/high = feet) --
// this shared mapping is what lets the symbolic points (BODY_SYMBOLS) and
// the real physiological systems (BODY_SYSTEMS) line up on the same
// spine even though they come from two different data files.
const SPINE_TOP = 2.6, SPINE_BOTTOM = -2.6;
function bodyHeightFromFrac(frac) {
  return SPINE_TOP + frac * (SPINE_BOTTOM - SPINE_TOP);
}

// Pure and cheap (11 systems) -- called directly wherever it's needed
// (BodyRegion for rendering, Scene for camera framing) instead of being
// threaded through props, so both always agree on where a system actually
// sits without one of them going stale.
function computeSystemPositions() {
  return BODY_SYSTEMS.map((s, i) => {
    const angle = (i / BODY_SYSTEMS.length) * Math.PI * 2;
    const y = bodyHeightFromFrac(s.heightFrac);
    return { ...s, position: [Math.cos(angle) * 1.5, y, Math.sin(angle) * 1.5] };
  });
}

// A small sphere-shell cluster of points around a center, reusing the same
// fibonacci distribution the Architecture/Symbols regions use -- reads as
// a real cluster instead of a flat ring, closer to how these things
// actually sit in three dimensions.
function spherePositions(center, radius, count) {
  return Array.from({ length: count }, (_, i) => {
    const p = fibonacciSpherePosition(i, count, radius);
    return [center[0] + p[0], center[1] + p[1], center[2] + p[2]];
  });
}

// Selection ids for the Body Systems drill-down: body-system:<key>,
// body-sub:<systemKey>__<subKey>, body-signal:<systemKey>__<subKey>__<i>.
// Parsed in one place so BodyRegion, Scene, and the panel below never
// disagree on how to read them.
function parseBodySelection(selected) {
  if (!selected) return { layer: null };
  const [layer, rest] = selected.split(":");
  if (!["body-system", "body-sub", "body-signal"].includes(layer)) return { layer };
  const [systemKey, subKey, signalIdx] = (rest || "").split("__");
  return { layer, systemKey, subKey, signalIdx };
}

const SIGNALS_PER_SUB = 6;

function MapNode({ id, label, color, position, size = 1, pulsing, isSelected, onSelect, palette }) {
  const shellRef = useRef();
  const coreRef = useRef();

  useFrame((state, delta) => {
    if (shellRef.current) shellRef.current.rotation.y += delta * 0.22;
    if (coreRef.current && pulsing) {
      const pulse = 0.75 + Math.sin(state.clock.elapsedTime * 1.8 + position[0] + position[2]) * 0.25;
      coreRef.current.material.opacity = 0.5 * pulse;
    }
  });

  const scale = (isSelected ? 1.5 : 1) * size;

  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onSelect(id); }}>
      <mesh ref={coreRef} scale={scale}>
        <icosahedronGeometry args={[0.38, 1]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} />
      </mesh>
      <mesh ref={shellRef} scale={scale * 1.35}>
        <icosahedronGeometry args={[0.38, 1]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={isSelected ? 0.95 : 0.5} />
      </mesh>
      <Billboard position={[0, 0.75 * scale, 0]}>
        <Text fontSize={0.22} color={isSelected ? color : palette.labelColor} anchorX="center" anchorY="middle" outlineWidth={0.012} outlineColor={palette.labelOutline}>
          {label}
        </Text>
      </Billboard>
    </group>
  );
}

// A gentle bow through the midpoint instead of a straight segment -- reads
// as a vessel or nerve fiber curving through space rather than a wire
// connecting two abstract points. Bow direction is deterministic (derived
// from the two endpoints) so it doesn't jitter between renders.
function organicCurve(from, to, bow, segments = 12) {
  const midX = (from[0] + to[0]) / 2, midY = (from[1] + to[1]) / 2 + bow, midZ = (from[2] + to[2]) / 2;
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const u = 1 - t;
    pts.push([
      u * u * from[0] + 2 * u * t * midX + t * t * to[0],
      u * u * from[1] + 2 * u * t * midY + t * t * to[1],
      u * u * from[2] + 2 * u * t * midZ + t * t * to[2],
    ]);
  }
  return pts;
}

// Real, distinct, recognizable geometry per body system -- "a doctor
// should look at it and say oh I get it." Every system used to share one
// generic capsule/icosahedron differentiated only by color, which is
// exactly why nothing looked recognizable. Each of these is built from
// plain primitives (sphere/cylinder/cone/torus/box + line segments) --
// not medically precise models, but real enough silhouettes that the
// shape itself carries meaning: a neuron actually looks like a neuron,
// a red blood cell like its biconcave disc, an osteocyte like the
// spidery, star-shaped cell it actually is. Used at all three depths
// (system/substructure/signal, see ShapeNode) at different sizes, so the
// same recognizable shape represents that system whether you're looking
// at the whole organ or one cell inside it -- "artwork inside of artwork"
// with real content at every layer, not just the outermost one.
function SystemShape({ systemKey, color }) {
  switch (systemKey) {
    case "nervous": {
      const dendrites = [
        [[0, 0.1, 0], [-0.18, 0.32, 0], [-0.3, 0.42, 0]],
        [[0, 0.14, 0], [0.15, 0.36, 0.1], [0.24, 0.5, 0.16]],
        [[0.1, 0.05, 0.05], [0.28, 0.2, 0.12]],
      ];
      return (
        <>
          <mesh><sphereGeometry args={[0.16, 12, 12]} /><meshBasicMaterial color={color} transparent opacity={0.5} /></mesh>
          <Line points={[[0, 0, 0], [0, -0.5, 0]]} color={color} transparent opacity={0.7} lineWidth={1.4} />
          {dendrites.map((pts, i) => <Line key={i} points={pts} color={color} transparent opacity={0.6} lineWidth={1} />)}
        </>
      );
    }
    case "cardiovascular":
      return (
        <>
          <mesh scale={[1, 0.32, 1]}><sphereGeometry args={[0.28, 16, 16]} /><meshBasicMaterial color={color} transparent opacity={0.4} /></mesh>
          <mesh scale={[1, 0.32, 1]}><torusGeometry args={[0.14, 0.045, 8, 20]} /><meshBasicMaterial color={color} wireframe transparent opacity={0.65} /></mesh>
        </>
      );
    case "skeletal": {
      const spikes = Array.from({ length: 8 }, (_, i) => fibonacciSpherePosition(i, 8, 0.32));
      return (
        <>
          <mesh><sphereGeometry args={[0.1, 10, 10]} /><meshBasicMaterial color={color} transparent opacity={0.55} /></mesh>
          {spikes.map((dir, i) => <Line key={i} points={[[0, 0, 0], dir]} color={color} transparent opacity={0.6} lineWidth={1} />)}
        </>
      );
    }
    case "muscular":
      return (
        <>
          <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.09, 0.09, 0.6, 10]} /><meshBasicMaterial color={color} transparent opacity={0.4} /></mesh>
          {[-0.2, -0.07, 0.07, 0.2].map((x, i) => (
            <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.095, 0.012, 6, 16]} /><meshBasicMaterial color={color} transparent opacity={0.7} /></mesh>
          ))}
        </>
      );
    case "respiratory":
      return (
        <>
          {[[0, 0, 0], [0.14, 0.08, 0.05], [-0.12, 0.1, -0.05], [0.03, -0.13, 0.08]].map((p, i) => (
            <mesh key={i} position={p}><sphereGeometry args={[0.12, 10, 10]} /><meshBasicMaterial color={color} transparent opacity={0.4} /></mesh>
          ))}
        </>
      );
    case "lymphatic":
      return (
        <>
          <mesh scale={[1, 0.75, 1.25]}><icosahedronGeometry args={[0.22, 1]} /><meshBasicMaterial color={color} transparent opacity={0.4} /></mesh>
          <mesh position={[0.22, 0.1, 0]} scale={0.6}><sphereGeometry args={[0.12, 8, 8]} /><meshBasicMaterial color={color} transparent opacity={0.4} /></mesh>
          <mesh position={[-0.15, -0.15, 0.12]} scale={0.5}><sphereGeometry args={[0.12, 8, 8]} /><meshBasicMaterial color={color} transparent opacity={0.4} /></mesh>
        </>
      );
    case "digestive":
      return (
        <>
          <mesh><sphereGeometry args={[0.18, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshBasicMaterial color={color} transparent opacity={0.4} side={2} /></mesh>
          {[[-0.05, 0.18, 0], [0.05, 0.18, 0], [0, 0.18, 0.05], [0, 0.18, -0.05]].map((p, i) => (
            <Line key={i} points={[p, [p[0] * 1.3, p[1] + 0.15, p[2] * 1.3]]} color={color} transparent opacity={0.6} lineWidth={1} />
          ))}
        </>
      );
    case "endocrine":
      return (
        <>
          <mesh><sphereGeometry args={[0.2, 12, 12]} /><meshBasicMaterial color={color} transparent opacity={0.35} /></mesh>
          {[[0.08, 0.05, 0.1], [-0.07, 0.09, -0.05], [0.02, -0.1, 0.08], [-0.09, -0.04, -0.09]].map((p, i) => (
            <mesh key={i} position={p}><sphereGeometry args={[0.035, 6, 6]} /><meshBasicMaterial color={color} transparent opacity={0.9} /></mesh>
          ))}
        </>
      );
    case "urinary":
      return (
        <>
          <mesh><boxGeometry args={[0.26, 0.26, 0.26]} /><meshBasicMaterial color={color} transparent opacity={0.3} /></mesh>
          <mesh><boxGeometry args={[0.28, 0.28, 0.28]} /><meshBasicMaterial color={color} wireframe transparent opacity={0.6} /></mesh>
        </>
      );
    case "reproductive":
      return (
        <>
          <mesh><sphereGeometry args={[0.2, 14, 14]} /><meshBasicMaterial color={color} transparent opacity={0.4} /></mesh>
          <mesh scale={1.15}><sphereGeometry args={[0.2, 14, 14]} /><meshBasicMaterial color={color} wireframe transparent opacity={0.5} /></mesh>
        </>
      );
    case "integumentary":
      return (
        <>
          <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.22, 0.22, 0.05, 6]} /><meshBasicMaterial color={color} transparent opacity={0.4} /></mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} scale={1.1}><cylinderGeometry args={[0.22, 0.22, 0.05, 6]} /><meshBasicMaterial color={color} wireframe transparent opacity={0.55} /></mesh>
        </>
      );
    default:
      return (
        <mesh><icosahedronGeometry args={[0.2, 1]} /><meshBasicMaterial color={color} wireframe transparent opacity={0.5} /></mesh>
      );
  }
}

// Position/click/label/pulsing wrapper for SystemShape -- the same role
// MapNode plays for the generic nodes, but delegating the actual geometry
// out so the same wrapper works for a whole system (bigger), a
// substructure (medium), or a single signal (smaller), all using that
// system's one recognizable shape rather than three different ones.
// Pulsing breathes the whole group's scale instead of one mesh's opacity,
// since a composite shape has several meshes, not one to target.
function ShapeNode({ id, label, color, position, size = 1, pulsing, isSelected, onSelect, palette, systemKey }) {
  const groupRef = useRef();

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.16;
    const base = (isSelected ? 1.55 : 1) * size;
    const pulse = pulsing ? 1 + Math.sin(state.clock.elapsedTime * 1.6 + position[0] + position[2]) * 0.08 : 1;
    groupRef.current.scale.setScalar(base * pulse);
  });

  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onSelect(id); }}>
      <group ref={groupRef}>
        <SystemShape systemKey={systemKey} color={color} />
      </group>
      <Billboard position={[0, 0.7 * size, 0]}>
        <Text fontSize={0.2} color={isSelected ? color : palette.labelColor} anchorX="center" anchorY="middle" outlineWidth={0.011} outlineColor={palette.labelOutline}>
          {label}
        </Text>
      </Billboard>
    </group>
  );
}

function RegionLabel({ offset, text, palette }) {
  return (
    <Billboard position={[offset[0], 3.6, offset[2]]}>
      <Text fontSize={0.32} color={COLORS.gold} anchorX="center" anchorY="middle" outlineWidth={0.014} outlineColor={palette.labelOutline}>
        {text}
      </Text>
    </Billboard>
  );
}

// A plain <Line> is nearly impossible to click precisely -- its hit area
// is essentially the thin visible stroke. Pairs the real visible line with
// an invisible, much fatter one purely for hit-testing, so every
// connection line becomes a real clickable node too, not just decoration
// you can look at but not tap.
function ClickableLink({ id, from, to, color, dashed, isSelected, onSelect }) {
  return (
    <group onClick={(e) => { e.stopPropagation(); onSelect(id); }}>
      <Line points={[from, to]} color={color} transparent opacity={0.02} lineWidth={16} />
      <Line points={[from, to]} color={color} transparent opacity={isSelected ? 0.9 : 0.5} lineWidth={isSelected ? 2.4 : 1.3} dashed={dashed} dashSize={0.15} gapSize={0.1} />
    </group>
  );
}

function ArchitectureRegion({ selected, onSelect, palette }) {
  const offset = REGION_OFFSET.architecture;
  const positions = useMemo(() => {
    const map = {};
    PROFILE_NODES.forEach((n, i) => { map[n.key] = fibonacciSpherePosition(i, PROFILE_NODES.length, 3.2); });
    return map;
  }, []);

  return (
    <group position={offset}>
      <group onClick={(e) => { e.stopPropagation(); onSelect("region:architecture"); }}>
        <mesh>
          <icosahedronGeometry args={[0.65, 1]} />
          <meshBasicMaterial color={COLORS.gold} transparent opacity={selected === "region:architecture" ? 0.5 : 0.3} />
        </mesh>
        <mesh>
          <icosahedronGeometry args={[0.9, 1]} />
          <meshBasicMaterial color={COLORS.gold} wireframe transparent opacity={selected === "region:architecture" ? 0.9 : 0.6} />
        </mesh>
      </group>
      {PROFILE_NODES.map((n) => (
        <Line key={n.key + "-spoke"} points={[[0, 0, 0], positions[n.key]]} color={n.color} transparent opacity={n.status === "planned" ? 0.15 : 0.35} lineWidth={1} />
      ))}
      {CROSS_LINKS.map((link, i) => {
        const linkId = `link:arch__${link.from}__${link.to}`;
        return <ClickableLink key={i} id={linkId} from={positions[link.from]} to={positions[link.to]} color={link.color} dashed isSelected={selected === linkId} onSelect={onSelect} />;
      })}
      {PROFILE_NODES.map((n) => (
        <MapNode key={n.key} id={`architecture:${n.key}`} label={n.label} color={n.color} position={positions[n.key]} pulsing={n.status === "live"} isSelected={selected === `architecture:${n.key}`} onSelect={onSelect} palette={palette} />
      ))}
    </group>
  );
}

function SymbolsRegion({ dreamEntries, selected, onSelect, palette }) {
  const offset = REGION_OFFSET.symbols;
  const { nodes, links } = useMemo(() => {
    const { tagList, freq, links: rawLinks, maxCount } = buildSymbolGraph(dreamEntries);
    const radius = Math.max(2.4, 1.6 + tagList.length * 0.14);
    const positions = {};
    tagList.forEach((tag, i) => { positions[tag] = fibonacciSpherePosition(i, tagList.length, radius); });
    const nodes = tagList.map((tag) => ({
      tag, count: freq.get(tag), size: Math.max(0.5, freq.get(tag) / Math.max(1, maxCount)),
      position: positions[tag], color: SYMBOL_PALETTE[hashTag(tag) % SYMBOL_PALETTE.length],
    }));
    const links = rawLinks.map((l) => ({ aPos: positions[l.a], bPos: positions[l.b], count: l.count }));
    return { nodes, links };
  }, [dreamEntries]);

  if (nodes.length === 0) return null;

  return (
    <group position={offset}>
      {links.map((l, i) => (
        <Line key={i} points={[l.aPos, l.bPos]} color={COLORS.inkDim} transparent opacity={0.25} lineWidth={Math.min(2.2, 0.6 + l.count * 0.4)} />
      ))}
      {nodes.map((n) => (
        <MapNode key={n.tag} id={`symbols:${n.tag}`} label={n.tag} color={n.color} position={n.position} size={n.size} pulsing isSelected={selected === `symbols:${n.tag}`} onSelect={onSelect} palette={palette} />
      ))}
    </group>
  );
}

// The symbolic chakra-style points and the real physiological systems are
// two full datasets on the same spine -- shown together they read as one
// overcrowded map instead of two clear ones. bodyView picks which one is
// actually on screen; the spine itself stays as a shared anchor either way.
//
// Within Systems view, drilling in is a real camera zoom (see CameraRig)
// that also hides every other system so it reads as "artwork inside of
// artwork" -- one holographic layer at a time, Magic School Bus style --
// instead of everything visible and crowded at once. Each system's first
// layer is its own real named substructures (see bodySystems.js), not a
// generic "Cell 1..6" placeholder; tap one to reveal a small cluster of
// generic signal points one layer deeper still. Tap empty space, or use
// the breadcrumb/dropdown outside the canvas, to back out.
function BodyRegion({ selected, onSelect, palette, bodyView }) {
  const offset = REGION_OFFSET.body;
  const cyMin = Math.min(...BODY_SYMBOLS.map((s) => s.cy));
  const cyMax = Math.max(...BODY_SYMBOLS.map((s) => s.cy));
  const symbolY = (cy) => bodyHeightFromFrac((cy - cyMin) / (cyMax - cyMin));

  const systemPositions = computeSystemPositions();
  const { layer: selLayer, systemKey: openSystemKey, subKey: openSubKey } = parseBodySelection(selected);
  // Gated on bodyView too, not just the selection id -- otherwise a system
  // left open in Systems view stays "active" (hiding the spine) even after
  // switching to Symbolic view, since switching views doesn't clear selection.
  const activeSystemKey = bodyView === "systems" && ["body-system", "body-sub", "body-signal"].includes(selLayer) ? openSystemKey : null;

  return (
    <group position={offset}>
      {!activeSystemKey && (
        <group onClick={(e) => { e.stopPropagation(); onSelect("region:body"); }}>
          {/* Simple spine + head indicator so the points read as "on a body," not floating at
              random -- also itself a clickable node for a Body overview. Invisible fat line
              underneath the visible thin spine makes it actually clickable, not just visible. */}
          <Line points={[[0, SPINE_TOP, 0], [0, SPINE_BOTTOM, 0]]} color={COLORS.grid} transparent opacity={0.02} lineWidth={16} />
          <Line points={[[0, SPINE_TOP, 0], [0, SPINE_BOTTOM, 0]]} color={selected === "region:body" ? COLORS.coral : COLORS.grid} transparent opacity={0.5} lineWidth={selected === "region:body" ? 2 : 1} />
          <mesh position={[0, SPINE_TOP + 0.2, 0]}>
            <sphereGeometry args={[0.35, 12, 12]} />
            <meshBasicMaterial color={selected === "region:body" ? COLORS.coral : COLORS.grid} wireframe transparent opacity={0.5} />
          </mesh>
        </group>
      )}

      {bodyView === "symbolic" && BODY_SYMBOLS.map((s) => (
        <MapNode key={s.key} id={`body:${s.key}`} label={s.label} color={s.color} position={[0, symbolY(s.cy), 0]} pulsing isSelected={selected === `body:${s.key}`} onSelect={onSelect} palette={palette} />
      ))}

      {bodyView === "systems" && (
        <>
          {!activeSystemKey && SYSTEM_LINKS.map(([aKey, bKey], i) => {
            const a = systemPositions.find((s) => s.key === aKey);
            const b = systemPositions.find((s) => s.key === bKey);
            if (!a || !b) return null;
            const linkId = `link:body__${aKey}__${bKey}`;
            return <ClickableLink key={i} id={linkId} from={a.position} to={b.position} color={COLORS.gold} dashed isSelected={selected === linkId} onSelect={onSelect} />;
          })}

          {systemPositions.filter((s) => !activeSystemKey || s.key === activeSystemKey).map((s) => {
            const isOpen = activeSystemKey === s.key;
            const subs = s.substructures || [];
            const subPositions = isOpen ? spherePositions(s.position, 1.1, subs.length) : null;
            return (
              <group key={s.key}>
                {!activeSystemKey && <Line points={[[0, s.position[1], 0], s.position]} color={s.color} transparent opacity={0.3} lineWidth={0.8} />}
                <ShapeNode id={`body-system:${s.key}`} label={s.label} color={s.color} size={1.5} position={s.position} pulsing isSelected={selected === `body-system:${s.key}`} onSelect={onSelect} palette={palette} systemKey={s.key} />

                {isOpen && subs.map((sub, i) => {
                  const pos = subPositions[i];
                  const subId = `body-sub:${s.key}__${sub.key}`;
                  const isSubOpen = (selLayer === "body-sub" || selLayer === "body-signal") && openSystemKey === s.key && openSubKey === sub.key;
                  const signalPositions = isSubOpen ? spherePositions(pos, 0.6, SIGNALS_PER_SUB) : null;
                  return (
                    <group key={subId}>
                      <Line points={organicCurve(s.position, pos, 0.22)} color={s.color} transparent opacity={0.4} lineWidth={0.7} />
                      <ShapeNode id={subId} label={sub.label} color={s.color} size={1} position={pos} pulsing isSelected={selected === subId} onSelect={onSelect} palette={palette} systemKey={s.key} />

                      {isSubOpen && signalPositions.map((npos, j) => {
                        const signalId = `body-signal:${s.key}__${sub.key}__${j}`;
                        const prev = signalPositions[(j + SIGNALS_PER_SUB - 1) % SIGNALS_PER_SUB];
                        return (
                          <group key={signalId}>
                            <Line points={organicCurve(pos, npos, 0.12)} color={s.color} transparent opacity={0.4} lineWidth={0.55} />
                            {/* synapse-style cross-links between neighbors -- network look, not a flat ring */}
                            <Line points={organicCurve(npos, prev, 0.08)} color={s.color} transparent opacity={0.22} lineWidth={0.4} />
                            <ShapeNode id={signalId} label={`${s.signalLabel || "Signal"} ${j + 1}`} color={s.color} size={0.6} position={npos} pulsing isSelected={selected === signalId} onSelect={onSelect} palette={palette} systemKey={s.key} />
                          </group>
                        );
                      })}
                    </group>
                  );
                })}
              </group>
            );
          })}
        </>
      )}
    </group>
  );
}

function TeamRegion({ teamMembers, selected, onSelect, palette }) {
  const offset = REGION_OFFSET.team;
  if (teamMembers.length === 0) return null;

  const positions = useMemo(() => {
    const map = {};
    teamMembers.forEach((m, i) => {
      const angle = (i / teamMembers.length) * Math.PI * 2;
      map[m.id] = [Math.cos(angle) * 2.6, 0, Math.sin(angle) * 2.6];
    });
    return map;
  }, [teamMembers]);

  return (
    <group position={offset}>
      <group onClick={(e) => { e.stopPropagation(); onSelect("region:team"); }}>
        <mesh>
          <icosahedronGeometry args={[0.5, 1]} />
          <meshBasicMaterial color={COLORS.violet} transparent opacity={selected === "region:team" ? 0.5 : 0.3} />
        </mesh>
        <mesh>
          <icosahedronGeometry args={[0.7, 1]} />
          <meshBasicMaterial color={COLORS.violet} wireframe transparent opacity={selected === "region:team" ? 0.9 : 0.6} />
        </mesh>
      </group>
      {teamMembers.map((m) => (
        <Line key={m.id + "-spoke"} points={[[0, 0, 0], positions[m.id]]} color={m.color} transparent opacity={0.4} lineWidth={1} />
      ))}
      {teamMembers.map((m) => (
        <MapNode key={m.id} id={`team:${m.id}`} label={m.name} color={m.color} position={positions[m.id]} pulsing={m.mode === "front"} isSelected={selected === `team:${m.id}`} onSelect={onSelect} palette={palette} />
      ))}
    </group>
  );
}

// Where the camera should be centered and how close, purely as a function
// of whatever's currently selected -- clicking IS the only way to change
// where you're looking. This used to only exist for the Body Systems
// drill-down; now it covers every region, since with drag-orbit gone
// entirely, auto-focus-on-click is the only way to actually get close to
// anything in Architecture/Symbols/Team too. Precision varies on purpose:
// Body Systems gets exact per-node targeting (it already had the layout
// math for that); the other three regions focus on the whole region at a
// distance that comfortably shows every node in it, which is honest given
// duplicating their internal per-node layout math here isn't worth it for
// what this is actually solving (a camera that goes somewhere on click,
// not a hand-tuned close-up on every possible node).
function computeFocus(selected, bodyView) {
  const fallback = { target: [0, 0, 0], distance: 22 };
  if (!selected) return fallback;
  const [layer, rest] = selected.split(":");

  if (["body-system", "body-sub", "body-signal"].includes(layer)) {
    if (bodyView !== "systems") return { target: REGION_OFFSET.body, distance: 6 };
    const { systemKey, subKey } = parseBodySelection(selected);
    const openSystem = computeSystemPositions().find((s) => s.key === systemKey);
    if (!openSystem) return { target: REGION_OFFSET.body, distance: 6 };
    if (layer === "body-system") return { target: openSystem.position, distance: 6 };
    const subs = openSystem.substructures || [];
    const subIdx = subs.findIndex((x) => x.key === subKey);
    if (subIdx < 0) return { target: openSystem.position, distance: 6 };
    const subPos = spherePositions(openSystem.position, 1.1, subs.length)[subIdx];
    return { target: subPos, distance: layer === "body-signal" ? 1.5 : 2.4 };
  }
  if (layer === "link") {
    const [scope, aKey, bKey] = (rest || "").split("__");
    if (scope === "body") {
      const positions = computeSystemPositions();
      const a = positions.find((s) => s.key === aKey), b = positions.find((s) => s.key === bKey);
      if (a && b) return { target: [(a.position[0] + b.position[0]) / 2, (a.position[1] + b.position[1]) / 2, (a.position[2] + b.position[2]) / 2], distance: 7 };
    }
    return { target: REGION_OFFSET.architecture, distance: 6 };
  }
  if (layer === "region") {
    if (rest === "architecture") return { target: REGION_OFFSET.architecture, distance: 6 };
    if (rest === "team") return { target: REGION_OFFSET.team, distance: 6 };
    return { target: REGION_OFFSET.body, distance: 6 };
  }
  if (layer === "architecture") return { target: REGION_OFFSET.architecture, distance: 6 };
  if (layer === "symbols") return { target: REGION_OFFSET.symbols, distance: 6 };
  if (layer === "team") return { target: REGION_OFFSET.team, distance: 6 };
  if (layer === "body") return { target: REGION_OFFSET.body, distance: 6 };
  return fallback;
}

// The whole camera, replacing what used to be OrbitControls' free
// click-and-drag. That drag was the single biggest source of pain in this
// map: any mouse movement at all could spin the view, and it actively
// fought people who just wanted to hold still and click something. Now
// OrbitControls only supplies a camera/target pair to read and write --
// its own rotate/pan/zoom are all switched off -- and this owns the whole
// picture instead:
//   - target & distance: automatic, driven only by what's selected
//     (computeFocus above). They animate toward a new focus once, then
//     stop touching the camera at all once arrived, so they never fight
//     a manual zoom button afterward.
//   - yaw & pitch: 100% manual, buttons only, never move on their own.
//     This is the piece that used to be mouse-drag and now literally
//     cannot move unless a button is clicked.
function CameraRig({ focusKey, focusTarget, focusDistance, cameraStateRef, controlsRef }) {
  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const cam = controls.object;
    const st = cameraStateRef.current;

    if (st.focusKey !== focusKey) {
      st.focusKey = focusKey;
      st.approaching = true;
    }

    if (st.approaching) {
      const dTx = focusTarget[0] - st.target[0], dTy = focusTarget[1] - st.target[1], dTz = focusTarget[2] - st.target[2];
      const targetGap = Math.sqrt(dTx * dTx + dTy * dTy + dTz * dTz);
      const distGap = Math.abs(focusDistance - st.distance);
      if (targetGap < 0.03 && distGap < 0.05) {
        st.approaching = false;
      } else {
        st.target[0] += dTx * 0.08;
        st.target[1] += dTy * 0.08;
        st.target[2] += dTz * 0.08;
        st.distance += (focusDistance - st.distance) * 0.08;
      }
    }

    const cy = Math.cos(st.pitch), sy = Math.sin(st.pitch);
    const cx = Math.cos(st.yaw), sx = Math.sin(st.yaw);
    cam.position.set(
      st.target[0] + cx * cy * st.distance,
      st.target[1] + sy * st.distance,
      st.target[2] + sx * cy * st.distance
    );
    controls.target.set(st.target[0], st.target[1], st.target[2]);
    // Explicit, not left to controls.update() -- with rotate/pan/zoom all
    // disabled, OrbitControls never runs its own interaction handlers, and
    // this usage bypasses those entirely, so nothing can be assumed about
    // whether update() still reorients the camera on its own in that case.
    cam.lookAt(st.target[0], st.target[1], st.target[2]);
    controls.update();
  });
  return null;
}

function Scene({ layers, dreamEntries, teamMembers, selected, setSelected, palette, isDark, bodyView, cameraStateRef, controlsRef }) {
  const selLayer = selected ? selected.split(":")[0] : null;
  // Drilled into a specific body system -- everything else (other regions,
  // other systems) hides so the zoom reads as one clear holographic layer
  // instead of the zoomed-in system fighting for space with everything
  // else still on screen behind it.
  const bodyDrillActive = layers.body && bodyView === "systems" && ["body-system", "body-sub", "body-signal"].includes(selLayer);
  const { target: focusTarget, distance: focusDistance } = computeFocus(selected, bodyView);
  const focusKey = `${bodyView}|${selected || ""}`;

  return (
    <>
      <color attach="background" args={[palette.background]} />
      <ambientLight intensity={isDark ? 0.7 : 0.9} />
      <pointLight position={[8, 10, 8]} intensity={80} />
      {isDark && (
        <>
          <Stars radius={90} depth={60} count={3000} factor={2.8} fade speed={0.4} />
          <Sparkles count={90} scale={22} size={2} speed={0.2} color={COLORS.gold} />
        </>
      )}

      {!bodyDrillActive && layers.architecture && <RegionLabel offset={REGION_OFFSET.architecture} text={REGION_LABEL.architecture} palette={palette} />}
      {!bodyDrillActive && layers.symbols && dreamEntries.length > 0 && <RegionLabel offset={REGION_OFFSET.symbols} text={REGION_LABEL.symbols} palette={palette} />}
      {layers.body && !bodyDrillActive && <RegionLabel offset={REGION_OFFSET.body} text={REGION_LABEL.body} palette={palette} />}
      {!bodyDrillActive && layers.team && teamMembers.length > 0 && <RegionLabel offset={REGION_OFFSET.team} text={REGION_LABEL.team} palette={palette} />}

      {!bodyDrillActive && layers.architecture && <ArchitectureRegion selected={selected} onSelect={setSelected} palette={palette} />}
      {!bodyDrillActive && layers.symbols && <SymbolsRegion dreamEntries={dreamEntries} selected={selected} onSelect={setSelected} palette={palette} />}
      {layers.body && <BodyRegion selected={selected} onSelect={setSelected} palette={palette} bodyView={bodyView} />}
      {!bodyDrillActive && layers.team && <TeamRegion teamMembers={teamMembers} selected={selected} onSelect={setSelected} palette={palette} />}

      <CameraRig focusKey={focusKey} focusTarget={focusTarget} focusDistance={focusDistance} cameraStateRef={cameraStateRef} controlsRef={controlsRef} />
      <OrbitControls ref={controlsRef} enableRotate={false} enablePan={false} enableZoom={false} />
    </>
  );
}

const LAYER_META = {
  architecture: { label: "Architecture", color: COLORS.gold },
  symbols: { label: "Your Symbols", color: COLORS.teal },
  body: { label: "Body", color: COLORS.coral },
  team: { label: "Inner Team", color: COLORS.violet },
};

const DEFAULT_YAW = -0.5, DEFAULT_PITCH = 0.22;
const YAW_STEP = 0.28, PITCH_STEP = 0.18, ZOOM_FACTOR = 0.82;

export default function LivingMap({ dreamEntries = [], teamMembers = [] }) {
  const [layers, setLayers] = useState({ architecture: true, symbols: true, body: false, team: false });
  const [bodyView, setBodyView] = useState("symbolic"); // symbolic | systems -- one at a time, not both
  const [selected, setSelected] = useState(null);
  const [theme, setTheme] = useHologramTheme();
  const palette = HOLOGRAM_PALETTES[theme];

  const controlsRef = useRef();
  // Everything the camera needs, owned outside the Canvas so plain HTML
  // buttons below the map can nudge it directly -- see CameraRig for how
  // this gets turned into an actual camera position every frame.
  const cameraStateRef = useRef({
    yaw: DEFAULT_YAW, pitch: DEFAULT_PITCH, distance: 22,
    target: [0, 0, 0], focusKey: null, approaching: false,
  });

  const nudgeYaw = (dir) => { cameraStateRef.current.yaw += dir * YAW_STEP; };
  const nudgePitch = (dir) => {
    const next = cameraStateRef.current.pitch + dir * PITCH_STEP;
    cameraStateRef.current.pitch = Math.max(-1.3, Math.min(1.3, next));
  };
  const nudgeZoom = (dir) => {
    const next = cameraStateRef.current.distance * (dir > 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR);
    cameraStateRef.current.distance = Math.max(1.2, Math.min(40, next));
  };
  const resetView = () => {
    cameraStateRef.current.yaw = DEFAULT_YAW;
    cameraStateRef.current.pitch = DEFAULT_PITCH;
  };

  const toggleLayer = (key) => setLayers((prev) => ({ ...prev, [key]: !prev[key] }));

  const jumpToSystem = (key) => {
    setLayers((prev) => ({ ...prev, body: true }));
    setBodyView("systems");
    setSelected(key ? `body-system:${key}` : null);
  };

  // One dropdown covering every destination in the whole hologram --
  // the camera is still hard to aim manually, so this is a direct way to
  // land on anything without needing to see or click the 3D point at all.
  // Reuses the exact same "layer:key" ids computeFocus already knows how
  // to frame, so no new camera logic is needed here.
  const jumpTo = (value) => {
    if (!value) return;
    const [layer, rest] = value.split(":");
    if (layer === "architecture") setLayers((p) => ({ ...p, architecture: true }));
    else if (layer === "symbols") setLayers((p) => ({ ...p, symbols: true }));
    else if (layer === "team") setLayers((p) => ({ ...p, team: true }));
    else if (layer === "region") setLayers((p) => ({ ...p, [rest]: true }));
    setSelected(value);
  };
  const { tagList: symbolTags } = buildSymbolGraph(dreamEntries);

  // Resolve whatever's selected into real content, regardless of which
  // region it came from -- id is "layer:key" (see MapNode). "body-system"
  // is its own layer prefix even though it renders inside the Body region,
  // since it's a distinct real dataset (see bodySystems.js's own note).
  const [selLayer, selKey] = selected ? selected.split(":") : [null, null];
  const bodySel = parseBodySelection(selected);
  const bodySelSystem = bodySel.systemKey ? BODY_SYSTEMS.find((x) => x.key === bodySel.systemKey) : null;
  const bodySelSub = bodySelSystem && bodySel.subKey ? bodySelSystem.substructures.find((x) => x.key === bodySel.subKey) : null;

  let panel = null;
  if (selLayer === "architecture") {
    const n = PROFILE_NODES.find((x) => x.key === selKey);
    const statusColor = { live: COLORS.teal, illustrative: COLORS.gold, planned: COLORS.inkDim };
    const statusLabel = { live: "LIVE — REAL DATA", illustrative: "ILLUSTRATIVE — INVENTED", planned: "PLANNED — NO DATA YET" };
    if (n) panel = (
      <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: n.color }}>{n.label}</div>
          <div style={{ fontSize: 9, color: statusColor[n.status], letterSpacing: 0.4 }}>{statusLabel[n.status]}</div>
        </div>
        <div style={{ fontSize: 12.5, color: COLORS.ink, marginBottom: 14, lineHeight: 1.5 }}>{n.detail}</div>
        <div style={{ background: COLORS.bgPanelAlt, borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
          <div style={{ fontSize: 18, color: n.color, fontFamily: "Georgia, serif" }}>{n.stat}</div>
          <div style={{ fontSize: 10.5, color: COLORS.inkDim }}>{n.statLabel}</div>
        </div>
        <div style={{ fontSize: 11, color: COLORS.inkDim, lineHeight: 1.5 }}>{n.note}</div>
      </>
    );
  } else if (selLayer === "symbols") {
    const { links: rawLinks } = buildSymbolGraph(dreamEntries);
    const entries = entriesForTag(dreamEntries, selKey);
    const neighbors = neighborsForTag(rawLinks, selKey);
    const color = SYMBOL_PALETTE[hashTag(selKey) % SYMBOL_PALETTE.length];
    panel = (
      <>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color, marginBottom: 4 }}>{selKey}</div>
        <div style={{ fontSize: 11, color: COLORS.inkDim, marginBottom: 14 }}>Appeared in {entries.length} entr{entries.length === 1 ? "y" : "ies"}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: neighbors.length ? 16 : 0 }}>
          {entries.map((e) => {
            const snippet = e.lines?.[0]?.text || "";
            return (
              <div key={e.id} style={{ fontSize: 12, color: COLORS.ink, background: COLORS.bgPanelAlt, borderRadius: 8, padding: "8px 10px" }}>
                <div style={{ fontFamily: "Georgia, serif" }}>{e.title || "untitled"}</div>
                <div style={{ fontSize: 10, color: COLORS.inkDim, marginBottom: snippet ? 4 : 0 }}>{e.date}</div>
                {snippet && <div style={{ fontSize: 11, color: COLORS.inkDim, fontStyle: "italic", lineHeight: 1.4 }}>"{snippet.length > 90 ? snippet.slice(0, 90) + "…" : snippet}"</div>}
              </div>
            );
          })}
        </div>
        {neighbors.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {neighbors.map(([tag, count]) => (
              <button key={tag} onClick={() => setSelected(`symbols:${tag}`)} style={{ padding: "4px 10px", borderRadius: 14, border: `1px solid ${COLORS.grid}`, background: "transparent", color: COLORS.inkDim, fontSize: 10.5, cursor: "pointer" }}>
                {tag} × {count}
              </button>
            ))}
          </div>
        )}
      </>
    );
  } else if (selLayer === "body") {
    const s = BODY_SYMBOLS.find((x) => x.key === selKey);
    if (s) panel = (
      <>
        <div style={{ fontSize: 9, color: COLORS.gold, letterSpacing: 0.4, marginBottom: 6 }}>ILLUSTRATIVE — INVENTED</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: s.color, marginBottom: 4 }}>{s.label}</div>
        <div style={{ fontSize: 12.5, color: COLORS.ink, fontStyle: "italic", marginBottom: 10 }}>{s.symbol}</div>
        <div style={{ fontSize: 11.5, color: COLORS.inkDim, marginBottom: 10, lineHeight: 1.5 }}>
          First seen {s.firstSeen}, recurred {s.recurrence}. Tone: {s.tone}.
        </div>
        <div style={{ fontSize: 11, color: COLORS.inkDim, lineHeight: 1.5 }}>{s.bioNote}</div>
      </>
    );
  } else if (bodySel.layer === "body-system" && bodySelSystem) {
    const s = bodySelSystem;
    panel = (
      <>
        <div style={{ fontSize: 9, color: COLORS.violet, letterSpacing: 0.4, marginBottom: 6 }}>REFERENCE — REAL PHYSIOLOGY, NOT CLIENT DATA</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: s.color, marginBottom: 10 }}>{s.label}</div>
        <div style={{ fontSize: 12.5, color: COLORS.ink, marginBottom: 12, lineHeight: 1.5 }}>{s.function}</div>
        <div style={{ background: COLORS.bgPanelAlt, borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: COLORS.inkDim, letterSpacing: 0.5, marginBottom: 4 }}>OFTEN SHOWS UP SYMBOLICALLY AS</div>
          <div style={{ fontSize: 12, color: COLORS.ink, lineHeight: 1.5 }}>{s.symbolicParallel}</div>
        </div>
        {s.commonlyTracked?.length > 0 && (
          <div style={{ background: COLORS.bgPanelAlt, borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: COLORS.inkDim, letterSpacing: 0.5, marginBottom: 6 }}>COMMONLY TRACKED HERE</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {s.commonlyTracked.map((item) => (
                <div key={item} style={{ fontSize: 11.5, color: COLORS.ink }}>• {item}</div>
              ))}
            </div>
          </div>
        )}
        <div style={{ fontSize: 11, color: COLORS.inkDim, fontStyle: "italic" }}>
          {s.label}'s real substructures just opened up in the map -- tap one to go deeper.
        </div>
      </>
    );
  } else if (bodySel.layer === "body-sub" && bodySelSystem && bodySelSub) {
    const s = bodySelSystem, sub = bodySelSub;
    panel = (
      <>
        <div style={{ fontSize: 9, color: COLORS.violet, letterSpacing: 0.4, marginBottom: 6 }}>REFERENCE — REAL ANATOMY, NOT CLIENT DATA</div>
        <div style={{ fontSize: 10.5, color: COLORS.inkDim, marginBottom: 4 }}>{s.label}</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: s.color, marginBottom: 10 }}>{sub.label}</div>
        <div style={{ fontSize: 12.5, color: COLORS.ink, marginBottom: 12, lineHeight: 1.5 }}>{sub.function}</div>
        <div style={{ background: COLORS.bgPanelAlt, borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: COLORS.inkDim, letterSpacing: 0.5, marginBottom: 4 }}>OFTEN SHOWS UP SYMBOLICALLY AS</div>
          <div style={{ fontSize: 12, color: COLORS.ink, lineHeight: 1.5 }}>{sub.symbolicParallel}</div>
        </div>
        <div style={{ fontSize: 11, color: COLORS.inkDim, fontStyle: "italic" }}>Tap a {s.signalLabel?.toLowerCase() || "signal"} point to go one layer deeper still.</div>
      </>
    );
  } else if (bodySel.layer === "body-signal" && bodySelSystem && bodySelSub) {
    const s = bodySelSystem, sub = bodySelSub;
    const idx = parseInt(bodySel.signalIdx, 10);
    panel = (
      <>
        <div style={{ fontSize: 9, color: COLORS.violet, letterSpacing: 0.4, marginBottom: 6 }}>ILLUSTRATIVE — SCALE, NOT A REAL SCAN</div>
        <div style={{ fontSize: 10.5, color: COLORS.inkDim, marginBottom: 4 }}>{s.label} — {sub.label}</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: s.color, marginBottom: 10 }}>{s.signalLabel || "Signal"} {isNaN(idx) ? "" : idx + 1}</div>
        <div style={{ fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>
          This is as deep as the map goes -- a single signal in the {sub.label.toLowerCase()}, the same
          pattern your symbols and story keep circling back to at the surface.
        </div>
      </>
    );
  } else if (selLayer === "region") {
    if (selKey === "architecture") {
      const counts = ["live", "illustrative", "planned"].map((status) => PROFILE_NODES.filter((n) => n.status === status).length);
      panel = (
        <>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: COLORS.gold, marginBottom: 10 }}>Architecture — Overview</div>
          <div style={{ fontSize: 12.5, color: COLORS.ink, marginBottom: 14, lineHeight: 1.5 }}>
            What the app is actually built on right now, honestly labeled by how real each piece is. Tap
            any point to see it, or a dashed line to see why two pieces are connected.
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[["Live", counts[0], COLORS.teal], ["Illustrative", counts[1], COLORS.gold], ["Planned", counts[2], COLORS.inkDim]].map(([label, val, color]) => (
              <div key={label} style={{ background: COLORS.bgPanelAlt, borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 17, color, fontFamily: "Georgia, serif" }}>{val}</div>
                <div style={{ fontSize: 9.5, color: COLORS.inkDim }}>{label}</div>
              </div>
            ))}
          </div>
        </>
      );
    } else if (selKey === "team") {
      const front = teamMembers.filter((m) => m.mode === "front").length;
      panel = (
        <>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: COLORS.violet, marginBottom: 10 }}>Inner Team — Overview</div>
          <div style={{ fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>
            {teamMembers.length} member{teamMembers.length === 1 ? "" : "s"} right now -- {front} front-space,{" "}
            {teamMembers.length - front} running in the background. Tap any member to see their role and
            current task.
          </div>
        </>
      );
    } else if (selKey === "body") {
      panel = (
        <>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: COLORS.coral, marginBottom: 10 }}>Body — Overview</div>
          <div style={{ fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>
            Two ways to look at the same body: Symbolic (illustrative chakra-style points from your dream
            imagery) and Body Systems (the real 11 physiological systems, each with real substructures and
            signal points beneath it). Switch between them with the toggle above the map.
          </div>
        </>
      );
    }
  } else if (selLayer === "link") {
    const [scope, aKey, bKey] = selKey.split("__");
    if (scope === "arch") {
      const link = CROSS_LINKS.find((l) => (l.from === aKey && l.to === bKey) || (l.from === bKey && l.to === aKey));
      const a = PROFILE_NODES.find((x) => x.key === aKey);
      const b = PROFILE_NODES.find((x) => x.key === bKey);
      if (link && a && b) panel = (
        <>
          <div style={{ fontSize: 9, color: link.color, letterSpacing: 0.4, marginBottom: 6 }}>CONNECTION</div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 17, color: link.color, marginBottom: 10 }}>{a.label} ↔ {b.label}</div>
          <div style={{ fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>{link.label}</div>
        </>
      );
    } else if (scope === "body") {
      const a = BODY_SYSTEMS.find((x) => x.key === aKey);
      const b = BODY_SYSTEMS.find((x) => x.key === bKey);
      if (a && b) panel = (
        <>
          <div style={{ fontSize: 9, color: COLORS.gold, letterSpacing: 0.4, marginBottom: 6 }}>CONNECTION — REFERENCE</div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 17, color: COLORS.gold, marginBottom: 10 }}>{a.label} ↔ {b.label}</div>
          <div style={{ fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>{systemLinkBlurb(aKey, bKey)}</div>
        </>
      );
    }
  } else if (selLayer === "team") {
    const m = teamMembers.find((x) => x.id === selKey);
    const modeLabel = { front: "FRONT-SPACE — ACTIVE HELPER", background: "BACKGROUND — DATA RUNNER" };
    if (m) panel = (
      <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: m.color }}>{m.name}</div>
          <div style={{ fontSize: 9, color: m.mode === "front" ? COLORS.teal : COLORS.violet, letterSpacing: 0.4 }}>{modeLabel[m.mode]}</div>
        </div>
        <div style={{ fontSize: 12.5, color: COLORS.ink, marginBottom: 14, lineHeight: 1.5 }}>{m.role}</div>
        <div style={{ background: COLORS.bgPanelAlt, borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, color: COLORS.inkDim, letterSpacing: 0.5, marginBottom: 4 }}>CURRENTLY</div>
          <div style={{ fontSize: 12.5, color: COLORS.ink }}>{m.task}</div>
        </div>
      </>
    );
  }

  const showBodyNav = layers.body && bodyView === "systems";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: `${COLORS.gold}14`, border: `1px solid ${COLORS.gold}55`, borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>
        One universe, four real regions, the Body at the center since everything else is understood in
        relation to it -- toggle any combination on. Nothing here is dragged: tap a point to select it and
        the camera moves there on its own, then the turn/zoom buttons below the map are the only thing that
        ever moves the view after that. Every node, every connecting line, even the big center hub of each
        region opens its own box on the right.
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          {Object.keys(LAYER_META).map((key) => (
            <button
              key={key}
              onClick={() => toggleLayer(key)}
              style={{
                padding: "6px 13px", borderRadius: 999,
                border: `1px solid ${layers[key] ? LAYER_META[key].color : COLORS.grid}`,
                background: layers[key] ? `${LAYER_META[key].color}22` : "transparent",
                color: layers[key] ? LAYER_META[key].color : COLORS.inkDim,
                fontSize: 11.5, fontWeight: 600, cursor: "pointer",
              }}
            >
              {layers[key] ? "● " : "○ "}{LAYER_META[key].label}
            </button>
          ))}
          {layers.body && (
            <div style={{ display: "flex", gap: 4, marginLeft: 4, paddingLeft: 10, borderLeft: `1px solid ${COLORS.grid}` }}>
              {[
                { key: "symbolic", label: "Symbolic (illustrative)" },
                { key: "systems", label: "Body Systems (reference)" },
              ].map((v) => (
                <button
                  key={v.key}
                  onClick={() => setBodyView(v.key)}
                  style={{
                    padding: "5px 11px", borderRadius: 999,
                    border: `1px solid ${bodyView === v.key ? COLORS.coral : COLORS.grid}`,
                    background: bodyView === v.key ? `${COLORS.coral}18` : "transparent",
                    color: bodyView === v.key ? COLORS.coral : COLORS.inkDim,
                    fontSize: 10.5, cursor: "pointer",
                  }}
                >
                  {v.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <select
            value=""
            onChange={(e) => jumpTo(e.target.value)}
            style={{ padding: "5px 10px", borderRadius: 999, border: `1px solid ${COLORS.grid}`, background: COLORS.bg, color: COLORS.ink, fontSize: 11, cursor: "pointer" }}
          >
            <option value="">Jump to anything…</option>
            <optgroup label="Architecture">
              {PROFILE_NODES.map((n) => <option key={n.key} value={`architecture:${n.key}`}>{n.label}</option>)}
            </optgroup>
            {symbolTags.length > 0 && (
              <optgroup label="Your Symbols">
                {symbolTags.map((tag) => <option key={tag} value={`symbols:${tag}`}>{tag}</option>)}
              </optgroup>
            )}
            <optgroup label="Body">
              <option value="region:body">Overview</option>
            </optgroup>
            {teamMembers.length > 0 && (
              <optgroup label="Inner Team">
                {teamMembers.map((m) => <option key={m.id} value={`team:${m.id}`}>{m.name}</option>)}
              </optgroup>
            )}
          </select>
          {["black", "white"].map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              style={{
                padding: "5px 12px", borderRadius: 999,
                border: `1px solid ${theme === t ? COLORS.gold : COLORS.grid}`,
                background: theme === t ? `${COLORS.gold}22` : "transparent",
                color: theme === t ? COLORS.gold : COLORS.inkDim,
                fontSize: 11, cursor: "pointer",
              }}
            >
              {t === "black" ? "🌌 Space" : "☀️ Clean"}
            </button>
          ))}
        </div>
      </div>

      {/* Jump menu + breadcrumb -- a reliable way to move around the Body Systems
          map that never depends on clicking precisely on empty 3D space. */}
      {showBodyNav && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, background: COLORS.bgPanelAlt, borderRadius: 10, padding: "8px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontSize: 12 }}>
            <button
              onClick={() => setSelected(null)}
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: bodySelSystem ? COLORS.inkDim : COLORS.coral, fontWeight: bodySelSystem ? 400 : 600 }}
            >
              Overview
            </button>
            {bodySelSystem && (
              <>
                <span style={{ color: COLORS.inkDim }}>›</span>
                <button
                  onClick={() => setSelected(`body-system:${bodySelSystem.key}`)}
                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: bodySelSub ? COLORS.inkDim : COLORS.coral, fontWeight: bodySelSub ? 400 : 600 }}
                >
                  {bodySelSystem.label}
                </button>
              </>
            )}
            {bodySelSub && (
              <>
                <span style={{ color: COLORS.inkDim }}>›</span>
                <span style={{ color: COLORS.coral, fontWeight: 600 }}>{bodySelSub.label}</span>
              </>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {selected && (
              <button
                onClick={() => {
                  if (bodySel.layer === "body-signal") setSelected(`body-sub:${bodySel.systemKey}__${bodySel.subKey}`);
                  else if (bodySel.layer === "body-sub") setSelected(`body-system:${bodySel.systemKey}`);
                  else setSelected(null);
                }}
                style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${COLORS.grid}`, background: "transparent", color: COLORS.ink, fontSize: 11.5, cursor: "pointer" }}
              >
                ← Zoom out
              </button>
            )}
            <select
              value={bodySelSystem?.key || ""}
              onChange={(e) => jumpToSystem(e.target.value || null)}
              style={{ padding: "5px 10px", borderRadius: 8, border: `1px solid ${COLORS.grid}`, background: COLORS.bg, color: COLORS.ink, fontSize: 11.5, cursor: "pointer" }}
            >
              <option value="">Jump to a system…</option>
              {BODY_SYSTEMS.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 620 }}>
          <div style={{ height: 480, borderRadius: 16, overflow: "hidden", border: `1px solid ${COLORS.grid}` }}>
            <Canvas camera={{ position: [0, 5, 22], fov: 55 }} onPointerMissed={() => setSelected(null)}>
              <Scene layers={layers} dreamEntries={dreamEntries} teamMembers={teamMembers} selected={selected} setSelected={setSelected} palette={palette} isDark={theme === "black"} bodyView={bodyView} cameraStateRef={cameraStateRef} controlsRef={controlsRef} />
            </Canvas>
          </div>

          {/* The whole camera, in six buttons. Nothing else moves the view --
              no drag, no scroll-to-zoom, no hover. Click, and only click. */}
          <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "center", flexWrap: "wrap", background: COLORS.bgPanelAlt, borderRadius: 10, padding: "8px 10px" }}>
            <button onClick={() => nudgeYaw(-1)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${COLORS.grid}`, background: "transparent", color: COLORS.ink, fontSize: 13, cursor: "pointer" }}>◄ Turn</button>
            <button onClick={() => nudgePitch(1)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${COLORS.grid}`, background: "transparent", color: COLORS.ink, fontSize: 13, cursor: "pointer" }}>▲</button>
            <button onClick={() => nudgePitch(-1)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${COLORS.grid}`, background: "transparent", color: COLORS.ink, fontSize: 13, cursor: "pointer" }}>▼</button>
            <button onClick={() => nudgeYaw(1)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${COLORS.grid}`, background: "transparent", color: COLORS.ink, fontSize: 13, cursor: "pointer" }}>Turn ►</button>
            <span style={{ width: 1, height: 20, background: COLORS.grid }} />
            <button onClick={() => nudgeZoom(1)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${COLORS.grid}`, background: "transparent", color: COLORS.ink, fontSize: 13, cursor: "pointer" }}>+ Zoom in</button>
            <button onClick={() => nudgeZoom(-1)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${COLORS.grid}`, background: "transparent", color: COLORS.ink, fontSize: 13, cursor: "pointer" }}>− Zoom out</button>
            <span style={{ width: 1, height: 20, background: COLORS.grid }} />
            <button onClick={resetView} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${COLORS.gold}`, background: `${COLORS.gold}18`, color: COLORS.gold, fontSize: 13, cursor: "pointer" }}>Reset View</button>
          </div>
        </div>

        <div style={{ flex: "1 1 240px", minWidth: 240, background: COLORS.bgPanel, borderRadius: 14, padding: "18px 20px" }}>
          {!panel ? (
            <div style={{ fontSize: 12.5, color: COLORS.inkDim, lineHeight: 1.6 }}>
              Tap any point in the map to see the real story behind it -- the camera will move there for
              you. Use Zoom out or Reset View to see all your active regions again.
            </div>
          ) : panel}
        </div>
      </div>
    </div>
  );
}
