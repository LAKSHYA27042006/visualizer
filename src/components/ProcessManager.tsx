import React, { useState } from 'react';
import {
  Search,
  Trash2,
  RefreshCw,
  Plus,
  GitFork,
  Skull,
  Eye,
  Activity,
} from 'lucide-react';
import { useOS, STATES, COLOR, ProcessState, tint } from '../context/OSContext';
import { Glass, StateChip, Eyebrow } from './Common';
import { ProcessStateFlowDiagram } from './ProcessStateFlowDiagram';

export function ProcessManager({
  onInspect,
  openCreate,
}: {
  onInspect: (pid: number) => void;
  openCreate: () => void;
}) {
  const { procs, setState, fork, kill, reap, reset } = useOS();
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<string>('ALL');
  const [showStateDiagram, setShowStateDiagram] = useState<boolean>(true);

  const rows = procs.filter(
    (p) =>
      (tab === 'ALL' || p.state === tab) &&
      (p.name.toLowerCase().includes(q.toLowerCase()) || String(p.pid).includes(q))
  );

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Process State Flow Diagram Section (Explicitly requested for Process Management page) */}
      <div style={{ display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setShowStateDiagram((s) => !s)}
            className="btn"
            style={{ fontSize: 11 }}
          >
            <Activity size={13} />
            {showStateDiagram ? 'Hide State Flow Diagram' : 'Show State Flow Diagram'}
          </button>
        </div>
        {showStateDiagram && <ProcessStateFlowDiagram />}
      </div>

      {/* Process Table Filter & Actions Bar */}
      <Glass
        className="rise"
        style={{
          padding: 14,
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search
            size={15}
            style={{ position: 'absolute', left: 14, top: 12, color: 'var(--ink-3)' }}
          />
          <input
            className="input"
            style={{ paddingLeft: 38, borderRadius: 999 }}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or PID…"
          />
        </div>

        <div
          style={{
            display: 'flex',
            background: 'rgba(27,35,64,.06)',
            borderRadius: 999,
            padding: 3,
            flexWrap: 'wrap',
          }}
        >
          {['ALL', ...STATES].map((s) => (
            <button
              key={s}
              onClick={() => setTab(s)}
              className="mono"
              style={{
                border: 0,
                cursor: 'pointer',
                fontSize: 10,
                fontWeight: 600,
                padding: '7px 12px',
                borderRadius: 999,
                transition: '.2s',
                background: tab === s ? '#fff' : 'transparent',
                color: tab === s ? COLOR[s] || 'var(--ink)' : 'var(--ink-3)',
                boxShadow: tab === s ? '0 4px 12px -6px rgba(40,50,90,.4)' : 'none',
              }}
            >
              {s}{' '}
              <span style={{ opacity: 0.7, marginLeft: 2 }}>
                {s === 'ALL' ? procs.length : procs.filter((p) => p.state === s).length}
              </span>
            </button>
          ))}
        </div>

        <button className="btn btn-danger" onClick={reap} title="Reap zombie / terminated processes">
          <Trash2 size={14} />
          Reap terminated
        </button>

        <button className="btn" onClick={reset} title="Reset process table to init">
          <RefreshCw size={14} />
          Reset init
        </button>

        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={14} />
          New process
        </button>
      </Glass>

      {/* Main Table */}
      <Glass className="rise" style={{ padding: 0, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {['PID', 'PPID', 'Name', 'State (Lifecycle)', 'Priority', 'CPU Burst', 'Memory', 'Actions'].map(
                (h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left',
                      padding: '14px 18px',
                      borderBottom: '1px solid var(--hair)',
                    }}
                  >
                    <Eyebrow>{h}</Eyebrow>
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr
                key={p.pid}
                className="row"
                style={{
                  borderBottom: '1px solid var(--hair)',
                  transition: '.2s',
                  opacity: p.state === 'TERMINATED' ? 0.6 : 1,
                }}
              >
                <td className="mono" style={{ padding: '12px 18px', fontWeight: 600 }}>
                  <span
                    className="dot"
                    style={{
                      display: 'inline-block',
                      background: COLOR[p.state],
                      marginRight: 8,
                    }}
                  />
                  {p.pid}
                </td>

                <td className="mono" style={{ padding: '12px 18px', color: 'var(--ink-3)' }}>
                  {p.ppid}
                </td>

                <td style={{ padding: '12px 18px', fontWeight: 600 }}>{p.name}</td>

                <td style={{ padding: '12px 18px' }}>
                  <select
                    value={p.state}
                    onChange={(e) => setState(p.pid, e.target.value as ProcessState)}
                    className="mono"
                    style={{
                      cursor: 'pointer',
                      fontSize: 10,
                      fontWeight: 600,
                      padding: '5px 12px',
                      borderRadius: 999,
                      outline: 'none',
                      appearance: 'none',
                      background: tint(COLOR[p.state], 0.12),
                      color: COLOR[p.state],
                      border: `1px solid ${tint(COLOR[p.state], 0.35)}`,
                    }}
                  >
                    {STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>

                <td style={{ padding: '12px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 60,
                        height: 5,
                        borderRadius: 9,
                        background: 'rgba(27,35,64,.08)',
                      }}
                    >
                      <div
                        style={{
                          width: `${p.priority * 10}%`,
                          height: '100%',
                          borderRadius: 9,
                          background: 'linear-gradient(90deg,#3b82f6,#ff7a59)',
                        }}
                      />
                    </div>
                    <span className="mono" style={{ fontSize: 11 }}>
                      {p.priority}
                    </span>
                  </div>
                </td>

                <td className="mono" style={{ padding: '12px 18px' }}>
                  {p.cpuBurst} ticks
                </td>

                <td className="mono" style={{ padding: '12px 18px' }}>
                  {p.memoryMb} MB
                </td>

                <td style={{ padding: '12px 18px' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      className="btn"
                      title="Fork Child"
                      disabled={p.state === 'TERMINATED'}
                      onClick={() => fork(p.pid)}
                      style={{ padding: 7, color: COLOR.RUNNING }}
                    >
                      <GitFork size={13} />
                    </button>
                    <button
                      className="btn"
                      title="Terminate (SIGTERM)"
                      disabled={p.state === 'TERMINATED'}
                      onClick={() => kill(p.pid)}
                      style={{ padding: 7, color: COLOR.TERMINATED }}
                    >
                      <Skull size={13} />
                    </button>
                    <button
                      className="btn"
                      title="Inspect Process Control Block (PCB)"
                      onClick={() => onInspect(p.pid)}
                      style={{ padding: 7 }}
                    >
                      <Eye size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={8} style={{ padding: 50, textAlign: 'center', color: 'var(--ink-3)' }}>
                  No processes match the query criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Glass>
    </div>
  );
}
