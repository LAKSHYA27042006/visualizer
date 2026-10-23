import React, { useMemo, useRef, useState, Component, ErrorInfo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Line, Float, Environment, Lightformer, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import {
  GitFork,
  ZoomIn,
  ZoomOut,
  Crosshair,
  RotateCw,
  Box,
  Network,
  Info,
} from 'lucide-react';
import { useOS, ProcessState, STATES, COLOR, LABEL, tint } from '../context/OSContext';
import { Process } from '../services/api';
import { Glass, StateChip } from './Common';

/* ============================ Tree layout ============================ */
interface PosMap {
  [pid: number]: { x: number; depth: number };
}

function layoutTree(procs: Process[]): { pos: PosMap; leaves: number } {
  const by = Object.fromEntries(procs.map((p) => [p.pid, p]));
  const pos: PosMap = {};
  let leaf = 0;

  const walk = (pid: number, depth: number): number => {
    const proc = by[pid];
    if (!proc) return 0;
    const kids = (proc.childrenPids || []).filter((c) => by[c]);
    if (!kids.length) {
      pos[pid] = { x: leaf++, depth };
      return pos[pid].x;
    }
    const xs = kids.map((k) => walk(k, depth + 1));
    pos[pid] = { x: (xs[0] + xs[xs.length - 1]) / 2, depth };
    return pos[pid].x;
  };

  procs.filter((p) => !by[p.ppid] || p.ppid === 0).forEach((r) => walk(r.pid, 0));
  return { pos, leaves: Math.max(1, leaf) };
}

/* ============================== 3D Tree ============================== */
function Node3D({
  p,
  position,
  selected,
  onSelect,
  onFork,
  onCycle,
  onKill,
}: {
  p: Process;
  position: [number, number, number];
  selected: boolean;
  onSelect: (pid: number) => void;
  onFork: (pid: number) => void;
  onCycle: (p: Process) => void;
  onKill: (pid: number) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hover, setHover] = useState(false);
  const c = COLOR[p.state] || '#0ea5e9';
  const r = 0.32 + Math.min(64, p.memoryMb) / 380;

  useFrame((_, d) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += d * (p.state === 'RUNNING' ? 1.4 : 0.3);
    const target = hover || selected ? 1.18 : 1;
    meshRef.current.scale.lerp(new THREE.Vector3(target, target, target), 1 - Math.exp(-10 * d));
  });

  return (
    <group position={position}>
      <Float speed={p.state === 'TERMINATED' ? 0 : 1.6} floatIntensity={0.35} rotationIntensity={0}>
        <mesh
          ref={meshRef}
          castShadow
          onClick={(e) => {
            e.stopPropagation();
            onSelect(p.pid);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHover(true);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            setHover(false);
            document.body.style.cursor = '';
          }}
        >
          <icosahedronGeometry args={[r, 1]} />
          <meshPhysicalMaterial
            color={c}
            transmission={0.55}
            thickness={0.8}
            roughness={0.12}
            clearcoat={1}
            ior={1.4}
            emissive={c}
            emissiveIntensity={p.state === 'RUNNING' ? 0.35 : 0.08}
            transparent
            opacity={p.state === 'TERMINATED' ? 0.45 : 1}
            flatShading
          />
        </mesh>

        {p.state === 'RUNNING' && (
          <mesh rotation-x={Math.PI / 2}>
            <torusGeometry args={[r + 0.22, 0.02, 8, 64]} />
            <meshBasicMaterial color={c} transparent opacity={0.7} />
          </mesh>
        )}

        <Html center distanceFactor={9} position={[0, r + 0.55, 0]} zIndexRange={[10, 0]}>
          <div
            className="glass glass-strong pop"
            style={{
              padding: '6px 12px',
              borderRadius: 14,
              whiteSpace: 'nowrap',
              textAlign: 'center',
              pointerEvents: 'auto',
              userSelect: 'none',
              boxShadow: selected ? `0 0 0 2px ${c}` : undefined,
            }}
          >
            <div className="mono" style={{ fontSize: 11, fontWeight: 700 }}>
              PID {p.pid} <span style={{ color: 'var(--ink-3)', fontWeight: 400 }}>← {p.ppid}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-2)' }}>{p.name}</div>
            {(hover || selected) && p.state !== 'TERMINATED' && (
              <div style={{ display: 'flex', gap: 4, marginTop: 4, justifyContent: 'center' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFork(p.pid);
                  }}
                  className="mono"
                  style={{
                    fontSize: 9,
                    padding: '2px 7px',
                    borderRadius: 99,
                    border: `1px solid ${tint('#0ea5e9', 0.4)}`,
                    background: tint('#0ea5e9', 0.1),
                    color: '#0ea5e9',
                    cursor: 'pointer',
                  }}
                >
                  Fork
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCycle(p);
                  }}
                  className="mono"
                  style={{
                    fontSize: 9,
                    padding: '2px 7px',
                    borderRadius: 99,
                    border: `1px solid ${tint('#10b981', 0.4)}`,
                    background: tint('#10b981', 0.1),
                    color: '#10b981',
                    cursor: 'pointer',
                  }}
                >
                  State
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onKill(p.pid);
                  }}
                  className="mono"
                  style={{
                    fontSize: 9,
                    padding: '2px 7px',
                    borderRadius: 99,
                    border: `1px solid ${tint('#f43f5e', 0.4)}`,
                    background: tint('#f43f5e', 0.1),
                    color: '#f43f5e',
                    cursor: 'pointer',
                  }}
                >
                  Kill
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(p.pid);
                  }}
                  className="mono"
                  style={{
                    fontSize: 9,
                    padding: '2px 7px',
                    borderRadius: 99,
                    border: '1px solid rgba(27,35,64,0.15)',
                    background: '#fff',
                    color: 'var(--ink)',
                    cursor: 'pointer',
                  }}
                >
                  Inspect
                </button>
              </div>
            )}
          </div>
        </Html>
      </Float>
    </group>
  );
}

function Pulse({
  from,
  to,
  color,
}: {
  from: [number, number, number];
  to: [number, number, number];
  color: string;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const off = useMemo(() => Math.random(), []);

  useFrame(({ clock }) => {
    const t = (clock.elapsedTime * 0.5 + off) % 1;
    ref.current?.position.set(
      from[0] + (to[0] - from[0]) * t,
      from[1] + (to[1] - from[1]) * t,
      from[2] + (to[2] - from[2]) * t
    );
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.06, 12, 12]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

function Tree3DCanvas({
  selected,
  onSelect,
  autoRotate,
  resetKey,
}: {
  selected: number | null;
  onSelect: (pid: number | null) => void;
  autoRotate: boolean;
  resetKey: number;
}) {
  const { procs, fork, setState, kill } = useOS();
  const { pos, leaves } = useMemo(() => layoutTree(procs), [procs]);

  const P = (pid: number): [number, number, number] | null => {
    const q = pos[pid];
    if (!q) return null;
    const a = ((q.x + 0.5) / leaves) * Math.PI * 1.6 - Math.PI * 0.8;
    const rad = q.depth * 2.4;
    return [Math.sin(a) * rad, 4.2 - q.depth * 1.9, Math.cos(a) * rad * 0.7];
  };

  const cycle = (p: Process) => {
    const curIdx = STATES.indexOf(p.state);
    const nextIdx = (curIdx + 1) % 3; // cycle among RUNNING, READY, WAITING
    setState(p.pid, STATES[nextIdx]);
  };

  return (
    <Canvas
      key={resetKey}
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 3, 13], fov: 45 }}
      onPointerMissed={() => onSelect(null)}
    >
      <color attach="background" args={['#f6f3ee']} />
      <fog attach="fog" args={['#f6f3ee', 14, 34]} />
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[6, 10, 6]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <Environment resolution={256}>
        <Lightformer
          intensity={2.2}
          position={[0, 6, 0]}
          scale={[12, 12, 1]}
          rotation-x={Math.PI / 2}
        />
        <Lightformer
          intensity={1.4}
          color="#ffb59c"
          position={[-6, 2, 2]}
          rotation-y={Math.PI / 2}
          scale={[20, 2, 1]}
        />
        <Lightformer
          intensity={1.4}
          color="#9fd4ff"
          position={[6, 2, -2]}
          rotation-y={-Math.PI / 2}
          scale={[20, 2, 1]}
        />
      </Environment>

      {procs.map((p) => {
        const a = P(p.ppid);
        const b = P(p.pid);
        if (!a || !b) return null;
        const mid: [number, number, number] = [
          (a[0] + b[0]) / 2,
          (a[1] + b[1]) / 2 + 0.4,
          (a[2] + b[2]) / 2,
        ];
        return (
          <group key={'e' + p.pid}>
            <Line
              points={[a, mid, b]}
              color={p.state === 'TERMINATED' ? '#f43f5e' : '#8a93b2'}
              lineWidth={1.6}
              dashed={p.state === 'TERMINATED'}
              dashSize={0.15}
              gapSize={0.1}
              transparent
              opacity={0.7}
            />
            {p.state !== 'TERMINATED' && <Pulse from={a} to={b} color={COLOR[p.state]} />}
          </group>
        );
      })}

      {procs.map((p) => {
        const coords = P(p.pid);
        return coords ? (
          <Node3D
            key={p.pid}
            p={p}
            position={coords}
            selected={selected === p.pid}
            onSelect={onSelect}
            onFork={fork}
            onCycle={cycle}
            onKill={kill}
          />
        ) : null;
      })}

      <ContactShadows position={[0, -4.2, 0]} opacity={0.35} scale={30} blur={2.6} far={10} />
      <OrbitControls
        makeDefault
        enableDamping
        autoRotate={autoRotate}
        autoRotateSpeed={0.6}
        minDistance={5}
        maxDistance={26}
        target={[0, 0.5, 0]}
      />
    </Canvas>
  );
}

// Resilient Error Boundary for WebGL/Three.js
class ThreeErrorBoundary extends Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('Three.js Canvas caught an error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

/* ============================== 2D Tree ============================== */
function Tree2D({
  zoom,
  onSelect,
  selected,
}: {
  zoom: number;
  onSelect: (pid: number) => void;
  selected: number | null;
}) {
  const { procs, fork, setState, kill } = useOS();
  const { pos } = useMemo(() => layoutTree(procs), [procs]);
  const W = 210;
  const H = 120;
  const GX = 36;
  const GY = 78;

  const at = (pid: number) =>
    pos[pid] && { x: pos[pid].x * (W + GX), y: pos[pid].depth * (H + GY) };

  const xs = Object.values(pos).map((p) => p.x);
  const depths = Object.values(pos).map((p) => p.depth);
  const w = (xs.length ? Math.max(...xs) : 0) * (W + GX) + W + 60;
  const h = (depths.length ? Math.max(...depths) : 0) * (H + GY) + H + 60;

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
      <div style={{ width: w * zoom + 80, height: h * zoom + 120, padding: '60px 40px 40px' }}>
        <div
          style={{
            position: 'relative',
            width: w,
            height: h,
            transform: `scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          <svg width={w} height={h} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {procs.map((p) => {
              const a = at(p.ppid);
              const b = at(p.pid);
              if (!a || !b) return null;
              const x1 = a.x + W / 2;
              const y1 = a.y + H;
              const x2 = b.x + W / 2;
              const y2 = b.y;
              const m = (y1 + y2) / 2;
              return (
                <path
                  key={p.pid}
                  d={`M${x1},${y1} C${x1},${m} ${x2},${m} ${x2},${y2}`}
                  fill="none"
                  stroke={p.state === 'TERMINATED' ? COLOR.TERMINATED : 'rgba(27,35,64,.28)'}
                  strokeWidth="2.2"
                  strokeDasharray={p.state === 'TERMINATED' ? '6 6' : ''}
                />
              );
            })}
          </svg>

          {procs.map((p) => {
            const q = at(p.pid);
            if (!q) return null;
            const isSelected = selected === p.pid;
            const isTerminated = p.state === 'TERMINATED';

            return (
              <div
                key={p.pid}
                onClick={() => onSelect(p.pid)}
                className="glass glass-strong glass-hover pop"
                style={{
                  position: 'absolute',
                  left: q.x,
                  top: q.y,
                  width: W,
                  height: H,
                  padding: 12,
                  borderRadius: 18,
                  cursor: 'pointer',
                  outline: isSelected ? `2.5px solid ${COLOR[p.state]}` : 'none',
                  opacity: isTerminated ? 0.6 : 1,
                  boxShadow: isSelected
                    ? `0 0 0 4px ${tint(COLOR[p.state], 0.2)}, 0 20px 45px -20px ${COLOR[p.state]}`
                    : `0 18px 40px -22px ${COLOR[p.state]}`,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 14,
                    bottom: 14,
                    width: 3.5,
                    borderRadius: 3,
                    background: COLOR[p.state],
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <b className="mono" style={{ fontSize: 13 }}>
                    PID {p.pid}
                  </b>
                  <span className="chip mono" style={{ background: 'rgba(27,35,64,.06)' }}>
                    PPID {p.ppid}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--ink-2)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {p.name}
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                  <StateChip state={p.state} />
                  <span className="chip mono" style={{ background: 'rgba(27,35,64,.06)' }}>
                    {p.memoryMb}MB · P{p.priority}
                  </span>
                </div>
                <div
                  style={{ display: 'flex', gap: 4, marginTop: 8 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    disabled={isTerminated}
                    onClick={() => fork(p.pid)}
                    className="mono"
                    style={{
                      flex: 1,
                      fontSize: 10,
                      padding: '3px 0',
                      borderRadius: 99,
                      border: `1px solid ${tint(COLOR.RUNNING, 0.35)}`,
                      background: tint(COLOR.RUNNING, 0.08),
                      color: COLOR.RUNNING,
                      cursor: 'pointer',
                      opacity: isTerminated ? 0.35 : 1,
                    }}
                  >
                    Fork
                  </button>
                  <button
                    disabled={isTerminated}
                    onClick={() => {
                      const curIdx = STATES.indexOf(p.state);
                      const next = STATES[(curIdx + 1) % 3];
                      setState(p.pid, next as ProcessState);
                    }}
                    className="mono"
                    style={{
                      flex: 1,
                      fontSize: 10,
                      padding: '3px 0',
                      borderRadius: 99,
                      border: `1px solid ${tint(COLOR.READY, 0.35)}`,
                      background: tint(COLOR.READY, 0.08),
                      color: COLOR.READY,
                      cursor: 'pointer',
                      opacity: isTerminated ? 0.35 : 1,
                    }}
                  >
                    State
                  </button>
                  <button
                    disabled={isTerminated}
                    onClick={() => kill(p.pid)}
                    className="mono"
                    style={{
                      flex: 1,
                      fontSize: 10,
                      padding: '3px 0',
                      borderRadius: 99,
                      border: `1px solid ${tint(COLOR.TERMINATED, 0.35)}`,
                      background: tint(COLOR.TERMINATED, 0.08),
                      color: COLOR.TERMINATED,
                      cursor: 'pointer',
                      opacity: isTerminated ? 0.35 : 1,
                    }}
                  >
                    Kill
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================ ForkTree Component ============================ */
export function ForkTree({
  onInspect,
  inspecting,
}: {
  onInspect: (pid: number | null) => void;
  inspecting: number | null;
}) {
  const { fork } = useOS();
  const [mode, setMode] = useState<'3d' | '2d'>('3d');
  const [zoom, setZoom] = useState(0.9);
  const [spin, setSpin] = useState(true);
  const [resetKey, setResetKey] = useState(0);

  return (
    <Glass
      className="rise"
      style={{
        position: 'relative',
        height: 'calc(100vh - 140px)',
        overflow: 'hidden',
        padding: 0,
      }}
    >
      {/* Background dot pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(rgba(27,35,64,.1) 1px,transparent 1px)',
          backgroundSize: '24px 24px',
          pointerEvents: 'none',
        }}
      />

      {/* Top Toolbar */}
      <div
        className="glass glass-strong"
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 20,
          padding: 6,
          borderRadius: 999,
          display: 'flex',
          gap: 6,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            background: 'rgba(27,35,64,.06)',
            borderRadius: 999,
            padding: 3,
          }}
        >
          {[
            ['3d', Box, '3D View'],
            ['2d', Network, '2D Canvas'],
          ].map(([k, Icon, l]) => (
            <button
              key={k as string}
              onClick={() => setMode(k as '3d' | '2d')}
              className="btn"
              style={{
                border: 0,
                padding: '.35rem .8rem',
                background: mode === k ? '#fff' : 'transparent',
                boxShadow: mode === k ? '0 4px 12px -6px rgba(40,50,90,.4)' : 'none',
              }}
            >
              <Icon size={13} />
              {l as string}
            </button>
          ))}
        </div>

        {mode === '2d' ? (
          <>
            <button
              className="btn"
              onClick={() => setZoom((z) => Math.min(1.8, +(z + 0.1).toFixed(1)))}
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </button>
            <button
              className="btn"
              onClick={() => setZoom((z) => Math.max(0.4, +(z - 0.1).toFixed(1)))}
              title="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>
            <span
              className="mono"
              style={{ fontSize: 11, color: 'var(--ink-3)', padding: '0 4px' }}
            >
              {Math.round(zoom * 100)}%
            </span>
          </>
        ) : (
          <button className="btn" onClick={() => setSpin((s) => !s)}>
            <RotateCw size={14} />
            {spin ? 'Pause orbit' : 'Orbit'}
          </button>
        )}

        <button
          className="btn"
          onClick={() => {
            setZoom(0.9);
            setResetKey((k) => k + 1);
          }}
          title="Reset Camera / View"
        >
          <Crosshair size={14} />
          Reset View
        </button>

        <button
          className="btn btn-primary"
          onClick={() => fork(1)}
          title="Fork a child from PID 1 (init)"
        >
          <GitFork size={14} />
          Fork root (PID 1)
        </button>
      </div>

      {/* Legend in bottom left */}
      <div
        className="glass glass-strong"
        style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          zIndex: 20,
          padding: '8px 14px',
          borderRadius: 999,
          display: 'flex',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        {STATES.map((s) => (
          <span
            key={s}
            style={{
              fontSize: 11,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--ink-2)',
            }}
          >
            <span className="dot" style={{ background: COLOR[s] }} />
            {LABEL[s]}
          </span>
        ))}
      </div>

      {/* Helper hint in bottom right */}
      {mode === '3d' && (
        <div
          className="mono"
          style={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            zIndex: 20,
            fontSize: 10,
            color: 'var(--ink-3)',
            background: 'rgba(255,255,255,0.7)',
            padding: '4px 10px',
            borderRadius: 999,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Info size={11} />
          drag to orbit · scroll to zoom · hover/click a crystal for PCB
        </div>
      )}

      {/* Main Canvas view */}
      <div style={{ position: 'absolute', inset: 0 }}>
        {mode === '3d' ? (
          <ThreeErrorBoundary
            fallback={
              <div
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  height: '100%',
                  color: 'var(--ink-2)',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <p>3D WebGL Canvas could not initialize.</p>
                  <button className="btn btn-primary" onClick={() => setMode('2d')}>
                    Switch to 2D Tree Canvas
                  </button>
                </div>
              </div>
            }
          >
            <Tree3DCanvas
              selected={inspecting}
              onSelect={onInspect}
              autoRotate={spin && inspecting == null}
              resetKey={resetKey}
            />
          </ThreeErrorBoundary>
        ) : (
          <Tree2D zoom={zoom} onSelect={onInspect} selected={inspecting} />
        )}
      </div>
    </Glass>
  );
}
