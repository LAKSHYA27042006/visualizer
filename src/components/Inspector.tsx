import React from 'react';
import { X, GitFork, Skull, Eye } from 'lucide-react';
import { useOS, COLOR, ProcessState } from '../context/OSContext';
import { StateChip, Eyebrow } from './Common';

export function Inspector({
  pid,
  onClose,
}: {
  pid: number | null;
  onClose: () => void;
}) {
  const { procs, tick, fork, kill } = useOS();
  const p = procs.find((x) => x.pid === pid);
  if (!p) return null;

  const reg = (n: number) =>
    '0x' + (((p.pid * 2654435761) ^ (n * 40503) ^ tick) >>> 0).toString(16).padStart(8, '0');

  const fds: [string, string, string][] = [
    ['0', 'stdin', '/dev/pts/0'],
    ['1', 'stdout', '/dev/pts/0'],
    ['2', 'stderr', '/dev/pts/0'],
    ...(p.name.includes('web') ? ([['3', 'socket', 'TCP *:443']] as [string, string, string][]) : []),
    ...(p.name.includes('db') ? ([['3', 'socket', '/run/pg.sock']] as [string, string, string][]) : []),
    ...(p.name.includes('worker')
      ? ([['3', 'pipe', `[fd:${p.ppid % 9}]`]] as [string, string, string][])
      : []),
  ];

  const Sec: React.FC<{ t: string; children: React.ReactNode }> = ({ t, children }) => (
    <div
      style={{
        padding: 14,
        borderRadius: 18,
        background: 'rgba(255,255,255,.65)',
        border: '1px solid var(--hair)',
      }}
    >
      <Eyebrow>{t}</Eyebrow>
      <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>{children}</div>
    </div>
  );

  const Row: React.FC<{ k: string; v: React.ReactNode }> = ({ k, v }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
      <span style={{ color: 'var(--ink-3)' }}>{k}</span>
      <span className="mono">{v}</span>
    </div>
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        justifyContent: 'flex-end',
        background: 'rgba(246,243,238,.35)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <aside
        className="glass glass-strong slide"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 420,
          margin: 14,
          padding: 24,
          overflow: 'auto',
          display: 'grid',
          gap: 14,
          alignContent: 'start',
          boxShadow: '0 25px 60px -20px rgba(40,50,90,.35)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <Eyebrow>Process Control Block (PCB)</Eyebrow>
            <div className="serif" style={{ fontSize: 32, fontWeight: 700, margin: '2px 0' }}>
              PID {p.pid}
            </div>
            <div style={{ color: 'var(--ink-2)', fontSize: 13 }}>{p.name}</div>
          </div>
          <button className="btn" onClick={onClose} style={{ padding: 8 }}>
            <X size={16} />
          </button>
        </div>

        <div
          style={{
            height: 6,
            borderRadius: 99,
            background: `linear-gradient(90deg,${COLOR[p.state]},transparent)`,
          }}
        />

        <Sec t="Process Identity & Scheduling">
          <Row k="Parent PID (PPID)" v={p.ppid} />
          <Row k="Current State" v={<StateChip state={p.state} />} />
          <Row k="Static Priority" v={`${p.priority} / 10`} />
          <Row k="Remaining CPU Burst" v={`${p.cpuBurst} ticks`} />
          <Row k="Memory Allocation" v={`${p.memoryMb} MB`} />
        </Sec>

        <Sec t="CPU Registers (Saved in PCB)">
          <div
            className="mono"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 6,
              fontSize: 11,
            }}
          >
            {['PC', 'SP', 'RAX', 'RBX', 'RCX', 'RDX'].map((r, i) => (
              <div
                key={r}
                style={{
                  background: '#fff',
                  borderRadius: 10,
                  padding: '6px 8px',
                  border: '1px solid var(--hair)',
                }}
              >
                <span style={{ color: 'var(--ink-3)' }}>{r}</span> {reg(i)}
              </div>
            ))}
          </div>
        </Sec>

        <Sec t={`Child Processes · ${p.childrenPids?.length || 0}`}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {p.childrenPids?.length ? (
              p.childrenPids.map((c) => (
                <span
                  key={c}
                  className="chip mono"
                  style={{ background: '#fff', border: '1px solid var(--hair)', fontSize: 11 }}
                >
                  PID {c}
                </span>
              ))
            ) : (
              <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>No active children</span>
            )}
          </div>
        </Sec>

        <Sec t="Open File Descriptors">
          {fds.map(([fd, t, path]) => (
            <div
              key={fd + t + path}
              className="mono"
              style={{ fontSize: 11, display: 'flex', gap: 10 }}
            >
              <b style={{ color: 'var(--accent)' }}>{fd}</b>
              <span style={{ color: 'var(--ink-3)', width: 50 }}>{t}</span>
              <span style={{ color: 'var(--ink-2)' }}>{path}</span>
            </div>
          ))}
        </Sec>

        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button
            className="btn btn-primary"
            disabled={p.state === 'TERMINATED'}
            onClick={() => fork(p.pid)}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <GitFork size={14} />
            Fork child
          </button>
          <button
            className="btn btn-danger"
            disabled={p.state === 'TERMINATED'}
            onClick={() => kill(p.pid)}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <Skull size={14} />
            SIGTERM
          </button>
        </div>
      </aside>
    </div>
  );
}
