import React, { useState } from 'react';
import { X, Zap } from 'lucide-react';
import { useOS, COLOR } from '../context/OSContext';
import { Eyebrow } from './Common';

export function CreateModal({ onClose }: { onClose: () => void }) {
  const { procs, fork } = useOS();
  const alive = procs.filter((p) => p.state !== 'TERMINATED');
  const [f, setF] = useState({ name: '', ppid: 1, priority: 5, cpuBurst: 10, memoryMb: 32 });
  const [err, setErr] = useState<{ [key: string]: string }>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: { [key: string]: string } = {};

    if (!/^[a-z0-9-_]{2,24}$/i.test(f.name)) {
      er.name = '2–24 chars: letters, digits, - or _';
    }
    if (!(f.priority >= 1 && f.priority <= 10)) {
      er.priority = 'Must be 1–10';
    }
    if (!(f.cpuBurst >= 1 && f.cpuBurst <= 100)) {
      er.cpuBurst = 'Must be 1–100 ticks';
    }
    if (!(f.memoryMb >= 4 && f.memoryMb <= 512)) {
      er.memoryMb = 'Must be 4–512 MB';
    }

    setErr(er);
    if (Object.keys(er).length) return;

    fork(Number(f.ppid), {
      name: f.name.toLowerCase(),
      priority: Number(f.priority),
      cpuBurst: Number(f.cpuBurst),
      memoryMb: Number(f.memoryMb),
    });
    onClose();
  };

  const L: React.FC<{ t: string; e?: string; children: React.ReactNode }> = ({
    t,
    e,
    children,
  }) => (
    <label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--ink-2)' }}>
      {t}
      {children}
      {e && <span style={{ color: COLOR.TERMINATED, fontWeight: 500 }}>{e}</span>}
    </label>
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'grid',
        placeItems: 'center',
        padding: 16,
        background: 'rgba(246,243,238,.45)',
        backdropFilter: 'blur(6px)',
      }}
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="glass glass-strong pop"
        style={{
          width: '100%',
          maxWidth: 460,
          padding: 28,
          display: 'grid',
          gap: 16,
          boxShadow: '0 30px 70px -25px rgba(40,50,90,.4)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <Eyebrow>Syscall fork() + execve()</Eyebrow>
            <h2 className="serif" style={{ fontSize: 28, margin: '4px 0 0', fontWeight: 700 }}>
              Spawn a process
            </h2>
          </div>
          <button
            type="button"
            className="btn"
            onClick={onClose}
            style={{ padding: 8, alignSelf: 'start' }}
          >
            <X size={16} />
          </button>
        </div>

        <L t="Process Name" e={err.name}>
          <input
            className="input"
            autoFocus
            value={f.name}
            onChange={(e) => setF({ ...f, name: e.target.value })}
            placeholder="e.g. nginx-worker or data-pipe"
          />
        </L>

        <L t="Parent Process (PPID)">
          <select
            className="input"
            value={f.ppid}
            onChange={(e) => setF({ ...f, ppid: Number(e.target.value) })}
          >
            {alive.map((p) => (
              <option key={p.pid} value={p.pid}>
                PID {p.pid} — {p.name} (Priority {p.priority})
              </option>
            ))}
          </select>
        </L>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <L t={`Priority · ${f.priority}`} e={err.priority}>
            <input
              type="range"
              min={1}
              max={10}
              value={f.priority}
              onChange={(e) => setF({ ...f, priority: +e.target.value })}
              style={{ accentColor: '#ff7a59', marginTop: 8 }}
            />
          </L>
          <L t="CPU Burst (Ticks)" e={err.cpuBurst}>
            <input
              type="number"
              className="input mono"
              value={f.cpuBurst}
              onChange={(e) => setF({ ...f, cpuBurst: Number(e.target.value) })}
            />
          </L>
        </div>

        <L t="Memory Allocation (MB)" e={err.memoryMb}>
          <input
            type="number"
            className="input mono"
            value={f.memoryMb}
            onChange={(e) => setF({ ...f, memoryMb: Number(e.target.value) })}
          />
        </L>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            <Zap size={14} />
            Spawn Process
          </button>
        </div>
      </form>
    </div>
  );
}
