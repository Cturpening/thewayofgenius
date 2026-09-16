import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Sparkles, Billboard, Text, Line } from "@react-three/drei";
import { COLORS } from "../../theme/tokens";
import { buildSymbolGraph, entriesForTag, hashTag, neighborsForTag, SYMBOL_PALETTE } from "./symbolGraph";
import { fibonacciSpherePosition } from "./sphereLayout";
import { HOLOGRAM_PALETTES, useHologramTheme } from "./hologramTheme";

// The literal "design your own universe" version of Your Constellation --
// same real tag frequency and co-occurrence (see symbolGraph.js), same
// data as the 2D view, but out in real 3D space: a personal network of
// real recurring symbols floating the way the app's own architecture
// floats in Hologram. Micro next to macro, on purpose -- your own real
// psyche-network rendered with the same visual language as a real network
// of anything else. Nothing here is invented; an empty universe means an
// empty dream journal, not a placeholder waiting to be dressed up.

function UniverseNode({ tag, count, maxCount, position, color, isSelected, onSelect, palette }) {
  const shellRef = useRef();
  const coreRef = useRef();
  const sizeFrac = Math.max(0.35, count / Math.max(1, maxCount));

  useFrame((state, delta) => {
    if (shellRef.current) shellRef.current.rotation.y += delta * 0.2;
    if (coreRef.current) {
      const pulse = 0.7 + Math.sin(state.clock.elapsedTime * 1.6 + position[0]) * 0.3;
      coreRef.current.material.opacity = 0.5 * pulse;
    }
  });

  const scale = (isSelected ? 1.5 : 1) * (0.6 + sizeFrac * 0.7);

  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onSelect(tag); }}>
      <mesh ref={coreRef} scale={scale}>
        <icosahedronGeometry args={[0.4, 1]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} />
      </mesh>
      <mesh ref={shellRef} scale={scale * 1.35}>
        <icosahedronGeometry args={[0.4, 1]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={isSelected ? 0.95 : 0.5} />
      </mesh>
      <Billboard position={[0, 0.8 * scale, 0]}>
        <Text fontSize={0.24} color={isSelected ? color : palette.labelColor} anchorX="center" anchorY="middle" outlineWidth={0.012} outlineColor={palette.labelOutline}>
          {tag}
        </Text>
      </Billboard>
    </group>
  );
}

function Scene({ nodes, links, selected, setSelected, palette, isDark }) {
  return (
    <>
      <color attach="background" args={[palette.background]} />
      <ambientLight intensity={isDark ? 0.7 : 0.9} />
      <pointLight position={[8, 8, 8]} intensity={60} />
      {isDark && (
        <>
          <Stars radius={70} depth={45} count={2200} factor={2.6} fade speed={0.5} />
          <Sparkles count={70} scale={11} size={2.2} speed={0.25} color={COLORS.gold} />
        </>
      )}

      {links.map((l, i) => (
        <Line
          key={i}
          points={[l.aPos, l.bPos]}
          color={COLORS.inkDim}
          transparent
          opacity={selected && (l.a === selected || l.b === selected) ? 0.7 : 0.2}
          lineWidth={Math.min(2.5, 0.6 + l.count * 0.4)}
        />
      ))}

      {nodes.map((n) => (
        <UniverseNode
          key={n.tag}
          tag={n.tag}
          count={n.count}
          maxCount={n.maxCount}
          position={n.position}
          color={n.color}
          isSelected={selected === n.tag}
          onSelect={setSelected}
          palette={palette}
        />
      ))}

      <OrbitControls enableZoom enablePan={false} autoRotate autoRotateSpeed={0.35} minDistance={4} maxDistance={16} />
    </>
  );
}

export default function YourUniverse({ dreamEntries = [] }) {
  const [selected, setSelected] = useState(null);
  const [theme, setTheme] = useHologramTheme();
  const palette = HOLOGRAM_PALETTES[theme];

  const { nodes, links, maxCount, tagCount } = useMemo(() => {
    const { tagList, freq, links: rawLinks, maxCount } = buildSymbolGraph(dreamEntries);
    const radius = Math.max(3, 2 + tagList.length * 0.18);
    const positions = {};
    const colors = {};
    tagList.forEach((tag, i) => {
      positions[tag] = fibonacciSpherePosition(i, tagList.length, radius);
      colors[tag] = SYMBOL_PALETTE[hashTag(tag) % SYMBOL_PALETTE.length];
    });
    const nodes = tagList.map((tag) => ({
      tag, count: freq.get(tag), maxCount, position: positions[tag], color: colors[tag],
    }));
    const links = rawLinks.map((l) => ({ ...l, aPos: positions[l.a], bPos: positions[l.b] }));
    return { nodes, links, maxCount, tagCount: tagList.length };
  }, [dreamEntries]);

  const selectedEntries = selected ? entriesForTag(dreamEntries, selected) : [];
  const neighbors = selected
    ? neighborsForTag(links.map((l) => ({ a: l.a, b: l.b, count: l.count })), selected)
    : [];
  const selectedColor = nodes.find((n) => n.tag === selected)?.color;

  if (nodes.length === 0) {
    return (
      <div style={{ background: `${COLORS.violet}14`, border: `1px solid ${COLORS.violet}55`, borderRadius: 10, padding: "16px 18px", fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>
        Your universe is real, and it's empty because you haven't logged a tagged dream yet. This isn't
        a placeholder waiting to be filled with sample stars -- log a few dream journal entries and your
        own actual recurring symbols start filling in the space around you.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: `${COLORS.violet}14`, border: `1px solid ${COLORS.violet}55`, borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>
        A network built from your own real symbols, the same shape as any other network -- neurons,
        cities, galaxies. This one is yours: {tagCount} real recurring symbol{tagCount === 1 ? "" : "s"}
        from your own dream journal, connected by real co-occurrence. Drag to move through it, tap a
        symbol to see the actual entries it came from.
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
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

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ width: "100%", maxWidth: 520, height: 440, borderRadius: 16, overflow: "hidden", border: `1px solid ${COLORS.grid}` }}>
          <Canvas camera={{ position: [0, 1, 9], fov: 50 }} onPointerMissed={() => setSelected(null)}>
            <Scene nodes={nodes} links={links} selected={selected} setSelected={setSelected} palette={palette} isDark={theme === "black"} />
          </Canvas>
        </div>

        <div style={{ flex: "1 1 240px", minWidth: 240, background: COLORS.bgPanel, borderRadius: 14, padding: "18px 20px" }}>
          {!selected ? (
            <div style={{ fontSize: 12.5, color: COLORS.inkDim, lineHeight: 1.6 }}>
              Tap any point in your universe to see the real story behind it -- {tagCount} real symbols
              across {dreamEntries.length} entr{dreamEntries.length === 1 ? "y" : "ies"} so far.
            </div>
          ) : (
            <>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: selectedColor, marginBottom: 4 }}>{selected}</div>
              <div style={{ fontSize: 11, color: COLORS.inkDim, marginBottom: 14 }}>
                Appeared in {selectedEntries.length} entr{selectedEntries.length === 1 ? "y" : "ies"}
              </div>

              <div style={{ fontSize: 10, color: COLORS.inkDim, letterSpacing: 0.5, marginBottom: 8 }}>THE STORIES</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: neighbors.length ? 16 : 0 }}>
                {selectedEntries.map((e) => {
                  const snippet = e.lines?.[0]?.text || "";
                  return (
                    <div key={e.id} style={{ fontSize: 12, color: COLORS.ink, background: COLORS.bgPanelAlt, borderRadius: 8, padding: "8px 10px" }}>
                      <div style={{ fontFamily: "Georgia, serif" }}>{e.title || "untitled"}</div>
                      <div style={{ fontSize: 10, color: COLORS.inkDim, marginBottom: snippet ? 4 : 0 }}>{e.date}</div>
                      {snippet && (
                        <div style={{ fontSize: 11, color: COLORS.inkDim, fontStyle: "italic", lineHeight: 1.4 }}>
                          "{snippet.length > 90 ? snippet.slice(0, 90) + "…" : snippet}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {neighbors.length > 0 && (
                <>
                  <div style={{ fontSize: 10, color: COLORS.inkDim, letterSpacing: 0.5, marginBottom: 8 }}>OFTEN SHOWS UP WITH</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {neighbors.map(([tag, count]) => (
                      <button
                        key={tag}
                        onClick={() => setSelected(tag)}
                        style={{
                          padding: "4px 10px", borderRadius: 14, border: `1px solid ${COLORS.grid}`,
                          background: "transparent", color: COLORS.inkDim, fontSize: 10.5, cursor: "pointer",
                        }}
                      >
                        {tag} × {count}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
