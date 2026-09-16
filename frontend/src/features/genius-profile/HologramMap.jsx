import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Sparkles, Billboard, Text, Line } from "@react-three/drei";
import { COLORS } from "../../theme/tokens";
import { CROSS_LINKS, PROFILE_NODES } from "./data/profileNodes";

// The real holographic version of the Weave View -- same real node data
// (PROFILE_NODES, CROSS_LINKS), same honest live/illustrative/planned
// status labeling, rendered as an actual 3D scene instead of a flat SVG.
// Drag to orbit, scroll to zoom, click a node to inspect it -- this is
// Phase 1 of the "walk into a living map" direction: real depth and real
// camera control, not a 2D image pretending to have them.

const STATUS_OPACITY = { live: 0.55, illustrative: 0.4, planned: 0.22 };

function fibonacciSpherePosition(index, total, radius) {
  const offset = 2 / total;
  const increment = Math.PI * (3 - Math.sqrt(5));
  const y = index * offset - 1 + offset / 2;
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  const phi = index * increment;
  return [Math.cos(phi) * r * radius, y * radius, Math.sin(phi) * r * radius];
}

function HologramNode({ node, position, isSelected, onSelect }) {
  const shellRef = useRef();
  const coreRef = useRef();
  const baseOpacity = STATUS_OPACITY[node.status];

  useFrame((state, delta) => {
    if (shellRef.current) shellRef.current.rotation.y += delta * 0.25;
    if (coreRef.current && node.status === "live") {
      const pulse = 0.75 + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.25;
      coreRef.current.material.opacity = baseOpacity * pulse;
    }
  });

  const scale = isSelected ? 1.5 : 1;

  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onSelect(node.key); }}>
      <mesh ref={coreRef} scale={scale}>
        <icosahedronGeometry args={[0.42, 1]} />
        <meshBasicMaterial color={node.color} transparent opacity={baseOpacity} />
      </mesh>
      <mesh ref={shellRef} scale={scale * 1.35}>
        <icosahedronGeometry args={[0.42, 1]} />
        <meshBasicMaterial color={node.color} wireframe transparent opacity={isSelected ? 0.95 : 0.5} />
      </mesh>
      <Billboard position={[0, 0.85 * scale, 0]}>
        <Text fontSize={0.26} color={isSelected ? node.color : "#EAF2ED"} anchorX="center" anchorY="middle" outlineWidth={0.012} outlineColor={COLORS.ink}>
          {node.label}
        </Text>
      </Billboard>
    </group>
  );
}

function Scene({ selected, setSelected }) {
  const positions = useMemo(() => {
    const map = {};
    PROFILE_NODES.forEach((n, i) => {
      map[n.key] = fibonacciSpherePosition(i, PROFILE_NODES.length, 4.2);
    });
    return map;
  }, []);

  return (
    <>
      <color attach="background" args={[COLORS.ink]} />
      <ambientLight intensity={0.7} />
      <pointLight position={[8, 8, 8]} intensity={60} />
      <Stars radius={70} depth={45} count={2200} factor={2.6} fade speed={0.5} />
      <Sparkles count={70} scale={11} size={2.2} speed={0.25} color={COLORS.gold} />

      {/* Hub */}
      <group onClick={(e) => e.stopPropagation()}>
        <mesh>
          <icosahedronGeometry args={[0.85, 1]} />
          <meshBasicMaterial color={COLORS.gold} transparent opacity={0.3} />
        </mesh>
        <mesh>
          <icosahedronGeometry args={[1.15, 1]} />
          <meshBasicMaterial color={COLORS.gold} wireframe transparent opacity={0.6} />
        </mesh>
        <Billboard position={[0, 1.6, 0]}>
          <Text fontSize={0.3} color={COLORS.gold} anchorX="center" anchorY="middle" outlineWidth={0.012} outlineColor={COLORS.ink}>
            Genius Profile
          </Text>
        </Billboard>
      </group>

      {/* Spokes -- hub to every real node */}
      {PROFILE_NODES.map((n) => (
        <Line key={n.key + "-spoke"} points={[[0, 0, 0], positions[n.key]]} color={n.color} transparent opacity={n.status === "planned" ? 0.15 : 0.35} lineWidth={1} />
      ))}

      {/* Cross-links -- real relationships between nodes, same as Weave View */}
      {CROSS_LINKS.map((link, i) => (
        <Line key={i} points={[positions[link.from], positions[link.to]]} color={link.color} transparent opacity={0.55} lineWidth={1.5} dashed dashSize={0.15} gapSize={0.1} />
      ))}

      {PROFILE_NODES.map((n) => (
        <HologramNode key={n.key} node={n} position={positions[n.key]} isSelected={selected === n.key} onSelect={setSelected} />
      ))}

      <OrbitControls enableZoom enablePan={false} autoRotate autoRotateSpeed={0.4} minDistance={5} maxDistance={16} />
    </>
  );
}

export default function HologramMap() {
  const [selected, setSelected] = useState(null);
  const node = PROFILE_NODES.find((n) => n.key === selected);
  const statusColor = { live: COLORS.teal, illustrative: COLORS.gold, planned: COLORS.inkDim };
  const statusLabel = { live: "LIVE — REAL DATA", illustrative: "ILLUSTRATIVE — INVENTED", planned: "PLANNED — NO DATA YET" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: `${COLORS.gold}14`, border: `1px solid ${COLORS.gold}55`, borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>
        Same real nodes and real relationships as Weave View, in an actual 3D space instead of a flat
        diagram. Drag to orbit, scroll to zoom, tap a node to inspect it. This is the first real step
        toward a living map you move through, not a picture of one.
      </div>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ width: "100%", maxWidth: 520, height: 440, borderRadius: 16, overflow: "hidden", border: `1px solid ${COLORS.grid}` }}>
          <Canvas camera={{ position: [0, 1, 11], fov: 50 }} onPointerMissed={() => setSelected(null)}>
            <Scene selected={selected} setSelected={setSelected} />
          </Canvas>
        </div>

        <div style={{ flex: "1 1 240px", minWidth: 240, background: COLORS.bgPanel, borderRadius: 14, padding: "18px 20px" }}>
          {!node ? (
            <div style={{ fontSize: 12.5, color: COLORS.inkDim, lineHeight: 1.6 }}>
              Tap any glowing node in the hologram to zoom into what's actually there -- real data,
              honestly-labeled illustrative content, or an honest "planned," same as Weave View.
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: node.color }}>{node.label}</div>
                <div style={{ fontSize: 9, color: statusColor[node.status], letterSpacing: 0.4 }}>{statusLabel[node.status]}</div>
              </div>
              <div style={{ fontSize: 12.5, color: COLORS.ink, marginBottom: 14, lineHeight: 1.5 }}>{node.detail}</div>
              <div style={{ background: COLORS.bgPanelAlt, borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
                <div style={{ fontSize: 18, color: node.color, fontFamily: "Georgia, serif" }}>{node.stat}</div>
                <div style={{ fontSize: 10.5, color: COLORS.inkDim }}>{node.statLabel}</div>
              </div>
              <div style={{ fontSize: 11, color: COLORS.inkDim, lineHeight: 1.5 }}>{node.note}</div>
            </>
          )}
        </div>
      </div>

      <div style={{ fontSize: 11, color: COLORS.inkDim, lineHeight: 1.5, fontStyle: "italic" }}>
        This scene auto-rotates gently when you're not touching it and stays still while you drag --
        real camera control, not a spinning GIF. Bloom/glow shaders, a real "fly into a node" camera
        move, and richer particle atmosphere are the next layer on top of this, not a rebuild of it.
      </div>
    </div>
  );
}
