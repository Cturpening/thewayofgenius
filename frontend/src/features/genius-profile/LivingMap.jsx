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

// Rotating the scene from raw mouse *movement* (regardless of clicking)
// turned out to fight the exact thing people needed to do most: hold the
// view still and click through nodes -- moving toward a node to click it
// also spun the scene out from under the cursor. Standard click-and-drag
// orbit (OrbitControls, below) doesn't have that problem: a plain click
// selects a node, a deliberate drag orbits, and the two don't compete.
// True 360 still works, it just takes an intentional drag instead of any
// mouse movement at all.

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

function RegionLabel({ offset, text, palette }) {
  return (
    <Billboard position={[offset[0], 3.6, offset[2]]}>
      <Text fontSize={0.32} color={COLORS.gold} anchorX="center" anchorY="middle" outlineWidth={0.014} outlineColor={palette.labelOutline}>
        {text}
      </Text>
    </Billboard>
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
      <mesh>
        <icosahedronGeometry args={[0.65, 1]} />
        <meshBasicMaterial color={COLORS.gold} transparent opacity={0.3} />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[0.9, 1]} />
        <meshBasicMaterial color={COLORS.gold} wireframe transparent opacity={0.6} />
      </mesh>
      {PROFILE_NODES.map((n) => (
        <Line key={n.key + "-spoke"} points={[[0, 0, 0], positions[n.key]]} color={n.color} transparent opacity={n.status === "planned" ? 0.15 : 0.35} lineWidth={1} />
      ))}
      {CROSS_LINKS.map((link, i) => (
        <Line key={i} points={[positions[link.from], positions[link.to]]} color={link.color} transparent opacity={0.5} lineWidth={1.3} dashed dashSize={0.15} gapSize={0.1} />
      ))}
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

// heightFrac/cy both run head-to-foot (0/low = head, 1/high = feet) --
// this shared mapping is what lets the symbolic points (BODY_SYMBOLS) and
// the real physiological systems (BODY_SYSTEMS) line up on the same
// spine even though they come from two different data files.
const SPINE_TOP = 2.6, SPINE_BOTTOM = -2.6;
function bodyHeightFromFrac(frac) {
  return SPINE_TOP + frac * (SPINE_BOTTOM - SPINE_TOP);
}

// A small sphere-shell cluster of points around a center, reusing the same
// fibonacci distribution the Architecture/Symbols regions use -- reads as
// a cell cluster or a neuron cluster instead of a flat ring, closer to how
// these things actually sit in three dimensions.
function spherePositions(center, radius, count) {
  return Array.from({ length: count }, (_, i) => {
    const p = fibonacciSpherePosition(i, count, radius);
    return [center[0] + p[0], center[1] + p[1], center[2] + p[2]];
  });
}

const CELLS_PER_SYSTEM = 6;
const NEURONS_PER_CELL = 8;

// Drilling into a system moves and scales the whole Body content so the
// thing you tapped ends up centered and larger -- an actual zoom, not just
// new points appearing in place. Lerped each frame so it reads as motion
// ("zooms into a clearer layer") rather than a jump cut.
function FocusGroup({ target, scale, children }) {
  const ref = useRef();
  useFrame((_, delta) => {
    if (!ref.current) return;
    const t = Math.min(1, delta * 4);
    const [tx, ty, tz] = target || [0, 0, 0];
    ref.current.position.x += (-tx - ref.current.position.x) * t;
    ref.current.position.y += (-ty - ref.current.position.y) * t;
    ref.current.position.z += (-tz - ref.current.position.z) * t;
    const s = ref.current.scale;
    s.x += (scale - s.x) * t;
    s.y += (scale - s.y) * t;
    s.z += (scale - s.z) * t;
  });
  return <group ref={ref}>{children}</group>;
}

// The symbolic chakra-style points and the real physiological systems are
// two full datasets on the same spine -- shown together they read as one
// overcrowded map instead of two clear ones. bodyView picks which one is
// actually on screen; the spine itself stays as a shared anchor either way.
//
// Within Systems view, "down to cells and neurons" is a real zoom, not a
// denser default: tap a system and the whole Body content re-centers and
// scales up on it (FocusGroup) while every other system disappears --
// "artwork inside of artwork," one holographic layer at a time, Magic
// School Bus style, instead of everything visible and crowded at once.
// Tap a cell inside it and the same thing happens one layer deeper, into
// a small sphere-cluster of neurons. Tap empty space to zoom back out.
// Ids: body-system:<key>, body-cell:<systemKey>__<i>,
// body-neuron:<systemKey>__<i>__<j> ("__" separates parts within a layer
// so the top-level "layer:key" split on ":" still works).
function BodyRegion({ selected, onSelect, palette, bodyView }) {
  const offset = REGION_OFFSET.body;
  const cyMin = Math.min(...BODY_SYMBOLS.map((s) => s.cy));
  const cyMax = Math.max(...BODY_SYMBOLS.map((s) => s.cy));
  const symbolY = (cy) => bodyHeightFromFrac((cy - cyMin) / (cyMax - cyMin));

  const systemPositions = useMemo(() => {
    return BODY_SYSTEMS.map((s, i) => {
      const angle = (i / BODY_SYSTEMS.length) * Math.PI * 2;
      const y = bodyHeightFromFrac(s.heightFrac);
      return { ...s, position: [Math.cos(angle) * 1.5, y, Math.sin(angle) * 1.5] };
    });
  }, []);

  const [selLayer, selRest] = selected ? selected.split(":") : [null, null];
  const openSystemKey = ["body-system", "body-cell", "body-neuron"].includes(selLayer) ? selRest.split("__")[0] : null;
  const openCellId = selLayer === "body-cell" || selLayer === "body-neuron" ? selRest.split("__").slice(0, 2).join("__") : null;
  const openSystem = systemPositions.find((s) => s.key === openSystemKey);

  let focusTarget = null, focusScale = 1;
  if (openSystem) {
    if (selLayer === "body-cell" || selLayer === "body-neuron") {
      const cellIdx = parseInt(openCellId.split("__")[1], 10);
      focusTarget = spherePositions(openSystem.position, 1.1, CELLS_PER_SYSTEM)[cellIdx];
      focusScale = 3.4;
    } else {
      focusTarget = openSystem.position;
      focusScale = 1.9;
    }
  }

  return (
    <group position={offset}>
      {!openSystemKey && (
        <>
          {/* Simple spine + head indicator so the points read as "on a body," not floating at random */}
          <Line points={[[0, SPINE_TOP, 0], [0, SPINE_BOTTOM, 0]]} color={COLORS.grid} transparent opacity={0.5} lineWidth={1} />
          <mesh position={[0, SPINE_TOP + 0.2, 0]}>
            <sphereGeometry args={[0.35, 12, 12]} />
            <meshBasicMaterial color={COLORS.grid} wireframe transparent opacity={0.5} />
          </mesh>
        </>
      )}

      {bodyView === "symbolic" && BODY_SYMBOLS.map((s) => (
        <MapNode key={s.key} id={`body:${s.key}`} label={s.label} color={s.color} position={[0, symbolY(s.cy), 0]} pulsing isSelected={selected === `body:${s.key}`} onSelect={onSelect} palette={palette} />
      ))}

      {bodyView === "systems" && (
        <FocusGroup target={focusTarget} scale={focusScale}>
          {!openSystemKey && SYSTEM_LINKS.map(([aKey, bKey], i) => {
            const a = systemPositions.find((s) => s.key === aKey);
            const b = systemPositions.find((s) => s.key === bKey);
            if (!a || !b) return null;
            return <Line key={i} points={[a.position, b.position]} color={COLORS.gold} transparent opacity={0.45} lineWidth={1} dashed dashSize={0.12} gapSize={0.08} />;
          })}

          {systemPositions.filter((s) => !openSystemKey || s.key === openSystemKey).map((s) => {
            const isOpen = openSystemKey === s.key;
            const cellPositions = isOpen ? spherePositions(s.position, 1.1, CELLS_PER_SYSTEM) : null;
            return (
              <group key={s.key}>
                {!openSystemKey && <Line points={[[0, s.position[1], 0], s.position]} color={s.color} transparent opacity={0.3} lineWidth={0.8} />}
                <MapNode id={`body-system:${s.key}`} label={s.label} color={s.color} size={0.85} position={s.position} pulsing={false} isSelected={selected === `body-system:${s.key}`} onSelect={onSelect} palette={palette} />

                {isOpen && cellPositions.map((pos, i) => {
                  const cellId = `body-cell:${s.key}__${i}`;
                  const isCellOpen = openCellId === `${s.key}__${i}`;
                  const neuronPositions = isCellOpen ? spherePositions(pos, 0.6, NEURONS_PER_CELL) : null;
                  return (
                    <group key={cellId}>
                      <Line points={[s.position, pos]} color={s.color} transparent opacity={0.35} lineWidth={0.6} />
                      <MapNode id={cellId} label={`Cell ${i + 1}`} color={s.color} size={0.5} position={pos} pulsing isSelected={selected === cellId} onSelect={onSelect} palette={palette} />

                      {isCellOpen && neuronPositions.map((npos, j) => {
                        const neuronId = `body-neuron:${s.key}__${i}__${j}`;
                        const prev = neuronPositions[(j + NEURONS_PER_CELL - 1) % NEURONS_PER_CELL];
                        return (
                          <group key={neuronId}>
                            <Line points={[pos, npos]} color={s.color} transparent opacity={0.35} lineWidth={0.5} />
                            {/* synapse-style cross-links between neighboring neurons -- brain-cluster look, not a flat ring */}
                            <Line points={[npos, prev]} color={s.color} transparent opacity={0.2} lineWidth={0.4} />
                            <MapNode id={neuronId} label={`Neuron ${j + 1}`} color={s.color} size={0.3} position={npos} pulsing isSelected={selected === neuronId} onSelect={onSelect} palette={palette} />
                          </group>
                        );
                      })}
                    </group>
                  );
                })}
              </group>
            );
          })}
        </FocusGroup>
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
      <mesh>
        <icosahedronGeometry args={[0.5, 1]} />
        <meshBasicMaterial color={COLORS.violet} transparent opacity={0.3} />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[0.7, 1]} />
        <meshBasicMaterial color={COLORS.violet} wireframe transparent opacity={0.6} />
      </mesh>
      {teamMembers.map((m) => (
        <Line key={m.id + "-spoke"} points={[[0, 0, 0], positions[m.id]]} color={m.color} transparent opacity={0.4} lineWidth={1} />
      ))}
      {teamMembers.map((m) => (
        <MapNode key={m.id} id={`team:${m.id}`} label={m.name} color={m.color} position={positions[m.id]} pulsing={m.mode === "front"} isSelected={selected === `team:${m.id}`} onSelect={onSelect} palette={palette} />
      ))}
    </group>
  );
}

function Scene({ layers, dreamEntries, teamMembers, selected, setSelected, palette, isDark, bodyView }) {
  const selLayer = selected ? selected.split(":")[0] : null;
  // Drilled into a specific body system -- everything else (other regions,
  // other systems) hides so the zoom reads as one clear holographic layer
  // instead of the zoomed-in system fighting for space with everything
  // else still on screen behind it.
  const bodyDrillActive = layers.body && bodyView === "systems" && ["body-system", "body-cell", "body-neuron"].includes(selLayer);

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

      <OrbitControls enableZoom enableRotate enablePan minDistance={2} maxDistance={40} />
    </>
  );
}

const LAYER_META = {
  architecture: { label: "Architecture", color: COLORS.gold },
  symbols: { label: "Your Symbols", color: COLORS.teal },
  body: { label: "Body", color: COLORS.coral },
  team: { label: "Inner Team", color: COLORS.violet },
};

export default function LivingMap({ dreamEntries = [], teamMembers = [] }) {
  const [layers, setLayers] = useState({ architecture: true, symbols: true, body: false, team: false });
  const [bodyView, setBodyView] = useState("symbolic"); // symbolic | systems -- one at a time, not both
  const [selected, setSelected] = useState(null);
  const [theme, setTheme] = useHologramTheme();
  const palette = HOLOGRAM_PALETTES[theme];

  const toggleLayer = (key) => setLayers((prev) => ({ ...prev, [key]: !prev[key] }));

  // Resolve whatever's selected into real content, regardless of which
  // region it came from -- id is "layer:key" (see MapNode). "body-system"
  // is its own layer prefix even though it renders inside the Body region,
  // since it's a distinct real dataset (see bodySystems.js's own note).
  const [selLayer, selKey] = selected ? selected.split(":") : [null, null];
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
  } else if (selLayer === "body-system") {
    const s = BODY_SYSTEMS.find((x) => x.key === selKey);
    if (s) panel = (
      <>
        <div style={{ fontSize: 9, color: COLORS.violet, letterSpacing: 0.4, marginBottom: 6 }}>REFERENCE — REAL PHYSIOLOGY, NOT CLIENT DATA</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: s.color, marginBottom: 10 }}>{s.label}</div>
        <div style={{ fontSize: 12.5, color: COLORS.ink, marginBottom: 12, lineHeight: 1.5 }}>{s.function}</div>
        <div style={{ background: COLORS.bgPanelAlt, borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: COLORS.inkDim, letterSpacing: 0.5, marginBottom: 4 }}>OFTEN SHOWS UP SYMBOLICALLY AS</div>
          <div style={{ fontSize: 12, color: COLORS.ink, lineHeight: 1.5 }}>{s.symbolicParallel}</div>
        </div>
        <div style={{ fontSize: 11, color: COLORS.inkDim, fontStyle: "italic" }}>
          Cells for this system just opened up in the map -- tap one to go deeper.
        </div>
      </>
    );
  } else if (selLayer === "body-cell") {
    const [sysKey, cellIdxStr] = selKey.split("__");
    const s = BODY_SYSTEMS.find((x) => x.key === sysKey);
    if (s) panel = (
      <>
        <div style={{ fontSize: 9, color: COLORS.violet, letterSpacing: 0.4, marginBottom: 6 }}>ILLUSTRATIVE — SCALE, NOT A REAL SCAN</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: s.color, marginBottom: 10 }}>{s.label} — Cell {parseInt(cellIdxStr, 10) + 1}</div>
        <div style={{ fontSize: 12.5, color: COLORS.ink, marginBottom: 12, lineHeight: 1.5 }}>
          Same {s.label.toLowerCase()} story, one layer in -- the pattern doesn't change with scale, only
          the resolution you're looking at it with.
        </div>
        <div style={{ fontSize: 11, color: COLORS.inkDim, fontStyle: "italic" }}>Tap this cell's neurons to go one layer deeper still.</div>
      </>
    );
  } else if (selLayer === "body-neuron") {
    const [sysKey, , neuronIdxStr] = selKey.split("__");
    const s = BODY_SYSTEMS.find((x) => x.key === sysKey);
    if (s) panel = (
      <>
        <div style={{ fontSize: 9, color: COLORS.violet, letterSpacing: 0.4, marginBottom: 6 }}>ILLUSTRATIVE — SCALE, NOT A REAL SCAN</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: s.color, marginBottom: 10 }}>{s.label} — Neuron {parseInt(neuronIdxStr, 10) + 1}</div>
        <div style={{ fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>
          This is as deep as the map goes -- a single signal in the {s.label.toLowerCase()}, the same one
          your symbols and story keep circling back to at the surface.
        </div>
      </>
    );
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: `${COLORS.gold}14`, border: `1px solid ${COLORS.gold}55`, borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>
        One universe, four real regions, the Body at the center since everything else is understood in
        relation to it -- toggle any combination on. Drag to orbit all the way around, scroll to zoom, tap
        a point to select it -- a plain click won't spin the view out from under you. In Body Systems view,
        gold lines show how the systems actually relate; tap one to zoom into it (everything else clears
        away), tap a cell inside it to zoom in again to its neurons. Tap empty space to zoom back out.
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
        <div style={{ display: "flex", gap: 6 }}>
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

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ width: "100%", maxWidth: 620, height: 480, borderRadius: 16, overflow: "hidden", border: `1px solid ${COLORS.grid}` }}>
          <Canvas camera={{ position: [0, 5, 22], fov: 55 }} onPointerMissed={() => setSelected(null)}>
            <Scene layers={layers} dreamEntries={dreamEntries} teamMembers={teamMembers} selected={selected} setSelected={setSelected} palette={palette} isDark={theme === "black"} bodyView={bodyView} />
          </Canvas>
        </div>

        <div style={{ flex: "1 1 240px", minWidth: 240, background: COLORS.bgPanel, borderRadius: 14, padding: "18px 20px" }}>
          {!panel ? (
            <div style={{ fontSize: 12.5, color: COLORS.inkDim, lineHeight: 1.6 }}>
              Tap any point in the map to see the real story behind it. Pull back (scroll out) to see all
              your active regions floating together around the Body at the center; zoom into one to
              explore it closely.
            </div>
          ) : panel}
        </div>
      </div>
    </div>
  );
}
