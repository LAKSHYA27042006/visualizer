import React from 'react';
import {
  Layers,
  GitFork,
  Cpu,
  MemoryStick,
  Terminal,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Sliders,
  Trash2,
  Server,
} from 'lucide-react';
import { useOS, STATES, COLOR, LABEL, tint } from '../context/OSContext';
import { Glass, StateChip, Eyebrow, Ring, Spark } from './Common';

export function OverviewDashboard() {
  const {
    procs,
    logs,
    tick,
    backendOnline,
    algorithm,
    quantum,
    isSimulating,
    step,
    toggleSimulate,
    setAlgorithm,
    setQuantum,
    reset,
    clearLogs,
  } = useOS();

  const alive = procs.filter((p) => p.state !== 'TERMINATED');
  const running =
    procs.find((p) => p.state === 'RUNNING' && p.pid !== 1) ||
    procs.find((p) => p.state === 'RUNNING');

  const counts = Object.fromEntries(
    STATES.map((s) => [s, procs.filter((p) => p.state === s).length])
  );
  const cpu = Math.min(100, alive.reduce((a, p) => a + p.cpuBurst, 0));
  const mem = alive.reduce((a, p) => a + p.memoryMb, 0);
  const load = Math.min(100, 48 + ((tick * 7) % 46));

  const kpis: [string, string | number, React.ElementType, string][] = [
    ['Total processes', procs.length, Layers, '#3b82f6'],
    ['Active child forks', alive.filter((p) => p.ppid !== 0).length, GitFork, '#10b981'],
    ['CPU allocation', `${cpu}%`, Cpu, '#ff7a59'],
    ['Memory in use', `${mem} MB`, MemoryStick, '#8b5cf6'],
  ];

  const queue = (s: string) =>
    procs
      .filter((p) => p.state === s)
      .sort((a, b) => b.priority - a.priority);

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Simulation Quick Actions Control Bar */}
      <Glass
        className="rise"
        style={{
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={toggleSimulate}
            className={`btn ${isSimulating ? 'btn-danger' : 'btn-primary'}`}
            style={{ padding: '0.45rem 1rem' }}
          >
            {isSimulating ? <Pause size={14} /> : <Play size={14} />}
            {isSimulating ? 'Pause Simulation' : 'Start Simulation'}
          </button>

          <button onClick={step} className="btn" title="Advance one clock tick">
            <SkipForward size={14} />
            Step Tick
          </button>

          <button onClick={reset} className="btn" title="Reset kernel to init">
            <RotateCcw size={14} />
            Reset Init
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          {/* Scheduling Algorithm Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-2)' }}>
              <Sliders size={13} style={{ display: 'inline', verticalAlign: -2, marginRight: 4 }} />
              Algorithm:
            </span>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              className="mono input"
              style={{ padding: '4px 10px', fontSize: 11, borderRadius: 999, width: 'auto' }}
            >
              <option value="ROUND_ROBIN">Round Robin</option>
              <option value="PRIORITY">Preemptive Priority</option>
              <option value="FCFS">First-Come First-Served</option>
            </select>
          </div>

          {algorithm === 'ROUND_ROBIN' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-2)' }}>
                Quantum: <b className="mono">{quantum} ticks</b>
              </span>
              <input
                type="range"
                min={1}
                max={10}
                value={quantum}
                onChange={(e) => setQuantum(Number(e.target.value))}
                style={{ width: 70, accentColor: '#ff7a59' }}
              />
            </div>
          )}

          {/* Backend Status indicator badge */}
          <div
            className="chip mono"
            style={{
              background: backendOnline ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
              color: backendOnline ? '#10b981' : '#f59e0b',
              border: `1px solid ${backendOnline ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
            }}
          >
            <Server size={11} />
            {backendOnline ? 'Django API: Connected' : 'Django API: Offline (Local Mode)'}
          </div>
        </div>
      </Glass>

      {/* Hero strip */}
      <Glass
        className="rise"
        style={{
          padding: 28,
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr',
          gap: 24,
          alignItems: 'center',
        }}
      >
        <div>
          <Eyebrow>Live kernel snapshot · tick {tick}</Eyebrow>
          <h2
            className="serif"
            style={{ fontSize: 38, lineHeight: 1.08, margin: '10px 0 8px', fontWeight: 600 }}
          >
            {alive.length} processes breathing,
            <br />
            <span
              style={{
                background: 'linear-gradient(90deg,#ff7a59,#ff5f8a,#3b82f6)',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
              }}
            >
              one core thinking.
            </span>
          </h2>
          <p style={{ color: 'var(--ink-2)', fontSize: 14, maxWidth: 460 }}>
            Watch scheduling, forking and termination unfold in real time. Every action syncs across the
            tree and the process table instantly.
          </p>

          <div
            style={{
              display: 'flex',
              height: 10,
              borderRadius: 99,
              overflow: 'hidden',
              marginTop: 18,
              background: 'rgba(27,35,64,.06)',
            }}
          >
            {STATES.map((s) => (
              <div
                key={s}
                style={{
                  width: `${(counts[s] / Math.max(1, procs.length)) * 100}%`,
                  background: COLOR[s],
                  transition: 'width .6s',
                }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', gap: 18, marginTop: 10, flexWrap: 'wrap' }}>
            {STATES.map((s) => (
              <span
                key={s}
                style={{
                  fontSize: 12,
                  color: 'var(--ink-2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span className="dot" style={{ background: COLOR[s] }} />
                {LABEL[s]}{' '}
                <b className="mono" style={{ color: 'var(--ink)' }}>
                  {counts[s]}
                </b>
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
          <Ring value={load} color="#0ea5e9" size={150} stroke={12}>
            <div style={{ textAlign: 'center' }}>
              <div className="serif" style={{ fontSize: 34, fontWeight: 600 }}>
                {load}%
              </div>
              <Eyebrow>Core 0</Eyebrow>
            </div>
          </Ring>
          <Ring
            value={Math.min(100, (mem / 1024) * 100)}
            color="#10b981"
            size={150}
            stroke={12}
          >
            <div style={{ textAlign: 'center' }}>
              <div className="serif" style={{ fontSize: 34, fontWeight: 600 }}>
                {mem}
              </div>
              <Eyebrow>MB / 1 GB</Eyebrow>
            </div>
          </Ring>
        </div>
      </Glass>

      {/* KPIs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
          gap: 16,
        }}
      >
        {kpis.map(([l, v, Icon, c], i) => (
          <Glass
            key={l}
            hover
            className="rise"
            style={{ padding: 18, animationDelay: `${i * 70}ms` }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 600 }}>{l}</span>
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  display: 'grid',
                  placeItems: 'center',
                  background: tint(c, 0.14),
                  color: c,
                }}
              >
                <Icon size={16} />
              </span>
            </div>
            <div className="serif" style={{ fontSize: 30, fontWeight: 600, marginTop: 6 }}>
              {v}
            </div>
            <Spark seedN={i + tick * 0.15} color={c} />
          </Glass>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 16 }}>
        {/* CPU Card */}
        <Glass className="rise" style={{ padding: 20, position: 'relative', overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              width: 220,
              height: 220,
              borderRadius: '50%',
              right: -80,
              top: -80,
              background: 'radial-gradient(#9fd4ff,transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <Eyebrow>Active CPU Core 0</Eyebrow>
          {running ? (
            <>
              <div className="serif" style={{ fontSize: 24, fontWeight: 600, marginTop: 6 }}>
                {running.name}
              </div>
              <div style={{ display: 'flex', gap: 8, margin: '6px 0 14px' }}>
                <StateChip state="RUNNING" />
                <span className="chip mono" style={{ background: 'rgba(27,35,64,.06)' }}>
                  PID {running.pid}
                </span>
                <span className="chip mono" style={{ background: 'rgba(27,35,64,.06)' }}>
                  Burst: {running.cpuBurst}
                </span>
              </div>
              <div
                className="mono"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                  fontSize: 11,
                }}
              >
                {[
                  ['PC', (0x400000 + tick * 4 + running.pid * 16) >>> 0],
                  ['SP', (0x7ffd0000 + running.pid * 31) >>> 0],
                  ['RAX', (tick * 2654435761 + running.pid) >>> 0],
                  ['RIP', (0x401000 + tick * 12) >>> 0],
                ].map(([k, v]) => (
                  <div
                    key={k as string}
                    style={{
                      background: 'rgba(255,255,255,.7)',
                      borderRadius: 12,
                      padding: '8px 10px',
                      border: '1px solid var(--hair)',
                    }}
                  >
                    <div style={{ color: 'var(--ink-3)', fontSize: 9 }}>{k}</div>
                    <div>0x{(v as number).toString(16).slice(-8).padStart(8, '0')}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p style={{ color: 'var(--ink-3)', marginTop: 14 }}>Core idle · No running process</p>
          )}
        </Glass>

        {/* Queues */}
        <Glass className="rise" style={{ padding: 20, display: 'grid', gap: 16 }}>
          {(['READY', 'WAITING'] as const).map((s) => (
            <div key={s}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Eyebrow>{LABEL[s]} queue</Eyebrow>
                <span className="mono" style={{ fontSize: 11, color: COLOR[s], fontWeight: 600 }}>
                  {queue(s).length} processes
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  flexWrap: 'wrap',
                  marginTop: 8,
                  maxHeight: 90,
                  overflowY: 'auto',
                }}
              >
                {queue(s).length ? (
                  queue(s).map((p, i) => (
                    <div
                      key={p.pid}
                      className="mono pop"
                      style={{
                        fontSize: 11,
                        padding: '6px 10px',
                        borderRadius: 12,
                        background: '#fff',
                        border: `1px solid ${tint(COLOR[s], 0.35)}`,
                        boxShadow: `0 6px 16px -10px ${COLOR[s]}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <span style={{ color: 'var(--ink-3)' }}>{i + 1}·</span>
                      <b>{p.pid}</b>
                      <span style={{ color: 'var(--ink-2)', fontSize: 10 }}>({p.name})</span>
                      <span style={{ color: COLOR[s], fontWeight: 700 }}>p{p.priority}</span>
                    </div>
                  ))
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Queue is empty</span>
                )}
              </div>
            </div>
          ))}
        </Glass>

        {/* Console dmesg */}
        <Glass className="rise" style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: '1px solid var(--hair)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
                <span key={c} className="dot" style={{ background: c, width: 10, height: 10 }} />
              ))}
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginLeft: 6 }}>
                <Terminal size={11} style={{ verticalAlign: -1, marginRight: 4 }} />
                dmesg -w
              </span>
            </div>
            <button
              onClick={clearLogs}
              title="Clear event log"
              className="btn"
              style={{ padding: '2px 8px', fontSize: 10 }}
            >
              <Trash2 size={11} /> Clear
            </button>
          </div>

          <div
            className="mono"
            style={{
              height: 200,
              overflow: 'auto',
              padding: '10px 16px',
              fontSize: 11,
              lineHeight: 1.75,
            }}
          >
            {logs.map((l, i) => (
              <div key={l.id} className={i === 0 ? 'pop' : ''}>
                <span
                  style={{
                    color:
                      l.lvl === 'ERROR'
                        ? COLOR.TERMINATED
                        : l.lvl === 'WARN'
                        ? COLOR.WAITING
                        : l.lvl === 'SUCCESS'
                        ? COLOR.READY
                        : '#3b82f6',
                    fontWeight: 600,
                  }}
                >
                  [{l.lvl}]
                </span>{' '}
                <span style={{ color: 'var(--ink-2)' }}>{l.msg}</span>
              </div>
            ))}
            <div className="caret" />
          </div>
        </Glass>
      </div>
    </div>
  );
}
