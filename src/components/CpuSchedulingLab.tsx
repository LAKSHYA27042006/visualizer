import React, { useState, useMemo } from 'react';
import {
  CalendarClock,
  Play,
  Plus,
  Trash2,
  RotateCcw,
  BarChart3,
  TrendingUp,
  Timer,
  Activity,
  Zap,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { Glass, Eyebrow } from './Common';
import { api } from '../services/api';

interface SchedulingProcess {
  pid: number;
  name: string;
  arrivalTime: number;
  burstTime: number;
  priority: number;
  color: string;
}

const DEFAULT_PROCESSES: SchedulingProcess[] = [
  { pid: 1, name: 'P1 (Compiler)', arrivalTime: 0, burstTime: 8, priority: 3, color: '#38bdf8' },
  { pid: 2, name: 'P2 (Web Server)', arrivalTime: 1, burstTime: 4, priority: 1, color: '#10b981' },
  { pid: 3, name: 'P3 (DB Query)', arrivalTime: 2, burstTime: 9, priority: 4, color: '#f59e0b' },
  { pid: 4, name: 'P4 (Audio Sync)', arrivalTime: 3, burstTime: 3, priority: 2, color: '#ec4899' },
  { pid: 5, name: 'P5 (Background Backup)', arrivalTime: 4, burstTime: 5, priority: 5, color: '#8b5cf6' },
];

const PALETTE = ['#38bdf8', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316'];

export function CpuSchedulingLab() {
  const [algorithm, setAlgorithm] = useState<'FCFS' | 'SJF' | 'SRTF' | 'RR' | 'PRIORITY'>('RR');
  const [quantum, setQuantum] = useState<number>(3);
  const [processes, setProcesses] = useState<SchedulingProcess[]>(DEFAULT_PROCESSES);
  const [newProc, setNewProc] = useState({ name: '', arrivalTime: 0, burstTime: 4, priority: 3 });

  // Local scheduling simulation engine
  const simulation = useMemo(() => {
    const list = processes.map((p) => ({
      ...p,
      rem: p.burstTime,
    }));
    let time = 0;
    let completed = 0;
    const n = list.length;
    const timeline: Array<{ pid: number; name: string; start: number; end: number; color: string }> = [];
    const finishTimes: Record<number, number> = {};

    if (n === 0) {
      return { timeline: [], results: [], avgTAT: 0, avgWT: 0, cpuUtil: 0, totalTime: 0 };
    }

    if (algorithm === 'FCFS') {
      const sorted = [...list].sort((a, b) => a.arrivalTime - b.arrivalTime || a.pid - b.pid);
      for (const p of sorted) {
        if (time < p.arrivalTime) time = p.arrivalTime;
        const start = time;
        time += p.burstTime;
        timeline.push({ pid: p.pid, name: p.name, start, end: time, color: p.color });
        finishTimes[p.pid] = time;
      }
    } else if (algorithm === 'SJF') {
      while (completed < n) {
        const available = list.filter((p) => p.arrivalTime <= time && p.rem > 0);
        if (!available.length) {
          const unstarted = list.filter((p) => p.rem > 0);
          time = Math.min(...unstarted.map((p) => p.arrivalTime));
          continue;
        }
        available.sort((a, b) => a.burstTime - b.burstTime || a.arrivalTime - b.arrivalTime);
        const p = available[0];
        const start = time;
        time += p.burstTime;
        p.rem = 0;
        completed++;
        timeline.push({ pid: p.pid, name: p.name, start, end: time, color: p.color });
        finishTimes[p.pid] = time;
      }
    } else if (algorithm === 'SRTF') {
      let currPid: number | null = null;
      let currStart = 0;
      while (completed < n) {
        const available = list.filter((p) => p.arrivalTime <= time && p.rem > 0);
        if (!available.length) {
          if (currPid !== null) {
            const p = list.find((x) => x.pid === currPid)!;
            timeline.push({ pid: p.pid, name: p.name, start: currStart, end: time, color: p.color });
            currPid = null;
          }
          time++;
          continue;
        }
        available.sort((a, b) => a.rem - b.rem || a.arrivalTime - b.arrivalTime);
        const best = available[0];

        if (currPid !== best.pid) {
          if (currPid !== null) {
            const p = list.find((x) => x.pid === currPid)!;
            timeline.push({ pid: p.pid, name: p.name, start: currStart, end: time, color: p.color });
          }
          currPid = best.pid;
          currStart = time;
        }

        best.rem--;
        time++;

        if (best.rem === 0) {
          completed++;
          finishTimes[best.pid] = time;
          timeline.push({ pid: best.pid, name: best.name, start: currStart, end: time, color: best.color });
          currPid = null;
        }
      }
    } else if (algorithm === 'RR') {
      const queue: typeof list = [];
      const inQueue = new Set<number>();
      const sorted = [...list].sort((a, b) => a.arrivalTime - b.arrivalTime);

      time = sorted[0].arrivalTime;
      for (const p of sorted) {
        if (p.arrivalTime <= time && !inQueue.has(p.pid)) {
          queue.push(p);
          inQueue.add(p.pid);
        }
      }

      while (completed < n) {
        if (!queue.length) {
          const unstarted = list.filter((p) => p.rem > 0);
          if (!unstarted.length) break;
          time = Math.min(...unstarted.map((p) => p.arrivalTime));
          for (const p of list) {
            if (p.arrivalTime <= time && !inQueue.has(p.pid) && p.rem > 0) {
              queue.push(p);
              inQueue.add(p.pid);
            }
          }
          continue;
        }

        const p = queue.shift()!;
        inQueue.delete(p.pid);
        const runTime = Math.min(quantum, p.rem);
        const start = time;
        time += runTime;
        p.rem -= runTime;
        timeline.push({ pid: p.pid, name: p.name, start, end: time, color: p.color });

        for (const other of list) {
          if (
            other.arrivalTime <= time &&
            !inQueue.has(other.pid) &&
            other.rem > 0 &&
            other.pid !== p.pid
          ) {
            queue.push(other);
            inQueue.add(other.pid);
          }
        }

        if (p.rem > 0) {
          queue.push(p);
          inQueue.add(p.pid);
        } else {
          completed++;
          finishTimes[p.pid] = time;
        }
      }
    } else if (algorithm === 'PRIORITY') {
      while (completed < n) {
        const available = list.filter((p) => p.arrivalTime <= time && p.rem > 0);
        if (!available.length) {
          const unstarted = list.filter((p) => p.rem > 0);
          time = Math.min(...unstarted.map((p) => p.arrivalTime));
          continue;
        }
        available.sort((a, b) => a.priority - b.priority || a.arrivalTime - b.arrivalTime);
        const p = available[0];
        const start = time;
        time += p.burstTime;
        p.rem = 0;
        completed++;
        timeline.push({ pid: p.pid, name: p.name, start, end: time, color: p.color });
        finishTimes[p.pid] = time;
      }
    }

    let totalTAT = 0;
    let totalWT = 0;
    const results = processes.map((p) => {
      const ct = finishTimes[p.pid] ?? p.arrivalTime + p.burstTime;
      const tat = ct - p.arrivalTime;
      const wt = tat - p.burstTime;
      totalTAT += tat;
      totalWT += wt;
      return {
        ...p,
        completionTime: ct,
        turnaroundTime: tat,
        waitingTime: wt,
      };
    });

    const totalBusy = processes.reduce((acc, p) => acc + p.burstTime, 0);
    const cpuUtil = time > 0 ? Math.min(100, Math.round((totalBusy / time) * 1000) / 10) : 0;

    return {
      timeline,
      results,
      avgTAT: +(totalTAT / Math.max(1, n)).toFixed(2),
      avgWT: +(totalWT / Math.max(1, n)).toFixed(2),
      cpuUtil,
      totalTime: time,
    };
  }, [processes, algorithm, quantum]);

  // Comparison matrix simulation
  const comparison = useMemo(() => {
    const algos: Array<'FCFS' | 'SJF' | 'SRTF' | 'RR' | 'PRIORITY'> = [
      'FCFS',
      'SJF',
      'SRTF',
      'RR',
      'PRIORITY',
    ];
    return algos.map((alg) => {
      const list = processes.map((p) => ({ ...p, rem: p.burstTime }));
      let time = 0;
      let completed = 0;
      const n = list.length;
      const finishTimes: Record<number, number> = {};

      if (alg === 'FCFS') {
        const sorted = [...list].sort((a, b) => a.arrivalTime - b.arrivalTime);
        for (const p of sorted) {
          if (time < p.arrivalTime) time = p.arrivalTime;
          time += p.burstTime;
          finishTimes[p.pid] = time;
        }
      } else if (alg === 'SJF') {
        while (completed < n) {
          const available = list.filter((p) => p.arrivalTime <= time && p.rem > 0);
          if (!available.length) {
            time = Math.min(...list.filter((p) => p.rem > 0).map((p) => p.arrivalTime));
            continue;
          }
          available.sort((a, b) => a.burstTime - b.burstTime);
          const p = available[0];
          time += p.burstTime;
          p.rem = 0;
          completed++;
          finishTimes[p.pid] = time;
        }
      } else if (alg === 'SRTF') {
        while (completed < n) {
          const available = list.filter((p) => p.arrivalTime <= time && p.rem > 0);
          if (!available.length) {
            time++;
            continue;
          }
          available.sort((a, b) => a.rem - b.rem);
          const best = available[0];
          best.rem--;
          time++;
          if (best.rem === 0) {
            completed++;
            finishTimes[best.pid] = time;
          }
        }
      } else if (alg === 'RR') {
        const qList = [...list];
        let qIdx = 0;
        while (completed < n) {
          const available = qList.filter((p) => p.arrivalTime <= time && p.rem > 0);
          if (!available.length) {
            time++;
            continue;
          }
          const p = available[qIdx % available.length];
          const slice = Math.min(quantum, p.rem);
          time += slice;
          p.rem -= slice;
          if (p.rem === 0) {
            completed++;
            finishTimes[p.pid] = time;
          }
          qIdx++;
        }
      } else if (alg === 'PRIORITY') {
        while (completed < n) {
          const available = list.filter((p) => p.arrivalTime <= time && p.rem > 0);
          if (!available.length) {
            time = Math.min(...list.filter((p) => p.rem > 0).map((p) => p.arrivalTime));
            continue;
          }
          available.sort((a, b) => a.priority - b.priority);
          const p = available[0];
          time += p.burstTime;
          p.rem = 0;
          completed++;
          finishTimes[p.pid] = time;
        }
      }

      let totTAT = 0;
      let totWT = 0;
      processes.forEach((p) => {
        const ct = finishTimes[p.pid] ?? p.arrivalTime + p.burstTime;
        const tat = ct - p.arrivalTime;
        totTAT += tat;
        totWT += tat - p.burstTime;
      });

      return {
        algorithm: alg,
        avgTAT: +(totTAT / Math.max(1, n)).toFixed(2),
        avgWT: +(totWT / Math.max(1, n)).toFixed(2),
        completionTime: time,
      };
    });
  }, [processes, quantum]);

  const handleAddProcess = (e: React.FormEvent) => {
    e.preventDefault();
    const pid = processes.length ? Math.max(...processes.map((p) => p.pid)) + 1 : 1;
    const name = newProc.name.trim() || `P${pid}`;
    const color = PALETTE[pid % PALETTE.length];
    setProcesses([
      ...processes,
      {
        pid,
        name,
        arrivalTime: Math.max(0, +newProc.arrivalTime),
        burstTime: Math.max(1, +newProc.burstTime),
        priority: Math.max(1, Math.min(10, +newProc.priority)),
        color,
      },
    ]);
    setNewProc({ name: '', arrivalTime: 0, burstTime: 4, priority: 3 });
  };

  const handleDelete = (pid: number) => {
    setProcesses(processes.filter((p) => p.pid !== pid));
  };

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Header controls bar */}
      <Glass
        className="rise"
        style={{
          padding: '16px 22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarClock size={16} color="#ff7a59" />
            <Eyebrow>OS Scheduling Lab & Timeline Simulation</Eyebrow>
          </div>
          <h2 className="serif" style={{ fontSize: 24, margin: '4px 0 0', fontWeight: 700 }}>
            CPU Scheduling Algorithms & Gantt Chart
          </h2>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Algorithm selector pills */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(27,35,64,.06)',
              borderRadius: 999,
              padding: 3,
            }}
          >
            {(['FCFS', 'SJF', 'SRTF', 'RR', 'PRIORITY'] as const).map((a) => (
              <button
                key={a}
                onClick={() => setAlgorithm(a)}
                className="mono"
                style={{
                  border: 0,
                  cursor: 'pointer',
                  fontSize: 10,
                  fontWeight: 600,
                  padding: '7px 12px',
                  borderRadius: 999,
                  transition: '.2s',
                  background: algorithm === a ? '#fff' : 'transparent',
                  color: algorithm === a ? '#ff7a59' : 'var(--ink-3)',
                  boxShadow: algorithm === a ? '0 4px 12px -6px rgba(40,50,90,.4)' : 'none',
                }}
              >
                {a}
              </button>
            ))}
          </div>

          {algorithm === 'RR' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-2)' }}>
                Quantum: <b className="mono">{quantum}</b>
              </span>
              <input
                type="range"
                min={1}
                max={10}
                value={quantum}
                onChange={(e) => setQuantum(+e.target.value)}
                style={{ width: 65, accentColor: '#ff7a59' }}
              />
            </div>
          )}

          <button
            onClick={() => setProcesses(DEFAULT_PROCESSES)}
            className="btn"
            title="Reset workload to defaults"
          >
            <RotateCcw size={13} />
            Reset Workload
          </button>
        </div>
      </Glass>

      {/* KPI Metrics Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
          gap: 16,
        }}
      >
        {[
          ['Avg Turnaround Time', `${simulation.avgTAT} ticks`, Timer, '#3b82f6', 'TAT = CT - AT'],
          ['Avg Waiting Time', `${simulation.avgWT} ticks`, TrendingUp, '#10b981', 'WT = TAT - BT'],
          ['CPU Utilization', `${simulation.cpuUtil}%`, Activity, '#ff7a59', 'Active / Total Time'],
          ['Schedule Length', `${simulation.totalTime} ticks`, BarChart3, '#8b5cf6', 'Max Completion'],
        ].map(([title, val, Icon, c, formula], i) => (
          <Glass key={title as string} hover className="rise" style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 600 }}>{title}</span>
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  display: 'grid',
                  placeItems: 'center',
                  background: `${c}22`,
                  color: c,
                }}
              >
                <Icon size={16} />
              </span>
            </div>
            <div className="serif" style={{ fontSize: 28, fontWeight: 700, marginTop: 6 }}>
              {val}
            </div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 4 }}>
              {formula}
            </div>
          </Glass>
        ))}
      </div>

      {/* Interactive Gantt Chart Timeline */}
      <Glass className="rise" style={{ padding: 22, display: 'grid', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Eyebrow>Execution Timeline View</Eyebrow>
            <h3 className="serif" style={{ fontSize: 20, margin: '2px 0 0', fontWeight: 700 }}>
              Interactive Gantt Chart ({algorithm})
            </h3>
          </div>
          <span className="chip mono" style={{ background: 'rgba(27,35,64,.06)' }}>
            Total Duration: {simulation.totalTime} units
          </span>
        </div>

        {/* Timeline track */}
        <div style={{ overflowX: 'auto', paddingBottom: 10 }}>
          <div style={{ minWidth: 680, position: 'relative' }}>
            <div
              style={{
                display: 'flex',
                height: 52,
                borderRadius: 14,
                overflow: 'hidden',
                background: 'rgba(27,35,64,.06)',
                border: '1px solid var(--hair)',
              }}
            >
              {simulation.timeline.map((slice, i) => {
                const widthPct =
                  simulation.totalTime > 0
                    ? ((slice.end - slice.start) / simulation.totalTime) * 100
                    : 0;
                return (
                  <div
                    key={i}
                    title={`${slice.name} [t=${slice.start} → t=${slice.end}]`}
                    style={{
                      width: `${widthPct}%`,
                      background: slice.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 700,
                      position: 'relative',
                      borderRight: '1px solid rgba(255,255,255,0.3)',
                      transition: 'all .25s',
                      cursor: 'pointer',
                    }}
                  >
                    <span className="mono" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
                      {slice.name.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Time tick labels */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 6,
                fontSize: 10,
                color: 'var(--ink-3)',
              }}
              className="mono"
            >
              <span>t=0</span>
              {simulation.timeline.map((s, idx) => (
                <span key={idx}>t={s.end}</span>
              ))}
            </div>
          </div>
        </div>
      </Glass>

      {/* Process Table & Add Form */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        {/* Results Table */}
        <Glass className="rise" style={{ padding: 0, overflow: 'auto' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--hair)' }}>
            <Eyebrow>Simulation Schedule</Eyebrow>
            <h4 className="serif" style={{ fontSize: 18, margin: '2px 0 0', fontWeight: 700 }}>
              Per-Process Metrics Table
            </h4>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {['Process', 'AT', 'BT', 'Priority', 'CT', 'TAT', 'WT', ''].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left',
                      padding: '10px 16px',
                      borderBottom: '1px solid var(--hair)',
                    }}
                  >
                    <Eyebrow>{h}</Eyebrow>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {simulation.results.map((p) => (
                <tr key={p.pid} className="row" style={{ borderBottom: '1px solid var(--hair)' }}>
                  <td style={{ padding: '10px 16px', fontWeight: 600 }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: p.color,
                        marginRight: 8,
                      }}
                    />
                    {p.name}
                  </td>
                  <td className="mono" style={{ padding: '10px 16px' }}>
                    {p.arrivalTime}
                  </td>
                  <td className="mono" style={{ padding: '10px 16px' }}>
                    {p.burstTime}
                  </td>
                  <td className="mono" style={{ padding: '10px 16px' }}>
                    P{p.priority}
                  </td>
                  <td className="mono" style={{ padding: '10px 16px', fontWeight: 600 }}>
                    {p.completionTime}
                  </td>
                  <td className="mono" style={{ padding: '10px 16px', color: '#3b82f6' }}>
                    {p.turnaroundTime}
                  </td>
                  <td className="mono" style={{ padding: '10px 16px', color: '#10b981' }}>
                    {p.waitingTime}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <button
                      onClick={() => handleDelete(p.pid)}
                      className="btn btn-danger"
                      style={{ padding: 4 }}
                      title="Remove process"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Glass>

        {/* Add Process Form */}
        <Glass className="rise" style={{ padding: 20 }}>
          <Eyebrow>Workload Editor</Eyebrow>
          <h4 className="serif" style={{ fontSize: 18, margin: '2px 0 14px', fontWeight: 700 }}>
            Add Custom Process
          </h4>
          <form onSubmit={handleAddProcess} style={{ display: 'grid', gap: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)' }}>
              Process Name
              <input
                className="input"
                style={{ marginTop: 4 }}
                value={newProc.name}
                onChange={(e) => setNewProc({ ...newProc, name: e.target.value })}
                placeholder="e.g. P6 (Video Render)"
              />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)' }}>
                Arrival Time
                <input
                  type="number"
                  min={0}
                  className="input mono"
                  style={{ marginTop: 4 }}
                  value={newProc.arrivalTime}
                  onChange={(e) => setNewProc({ ...newProc, arrivalTime: +e.target.value })}
                />
              </label>

              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)' }}>
                Burst Time
                <input
                  type="number"
                  min={1}
                  className="input mono"
                  style={{ marginTop: 4 }}
                  value={newProc.burstTime}
                  onChange={(e) => setNewProc({ ...newProc, burstTime: +e.target.value })}
                />
              </label>
            </div>

            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)' }}>
              Priority (1 = Highest)
              <input
                type="number"
                min={1}
                max={10}
                className="input mono"
                style={{ marginTop: 4 }}
                value={newProc.priority}
                onChange={(e) => setNewProc({ ...newProc, priority: +e.target.value })}
              />
            </label>

            <button type="submit" className="btn btn-primary" style={{ marginTop: 6, justifyContent: 'center' }}>
              <Plus size={14} />
              Add to Workload
            </button>
          </form>
        </Glass>
      </div>

      {/* Side-by-side Benchmark Comparison Matrix */}
      <Glass className="rise" style={{ padding: 22, display: 'grid', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Eyebrow>Algorithm Benchmark Matrix</Eyebrow>
            <h3 className="serif" style={{ fontSize: 20, margin: '2px 0 0', fontWeight: 700 }}>
              Comparative Performance on Identical Workload
            </h3>
          </div>
          <span className="chip mono" style={{ background: 'rgba(255,122,89,0.12)', color: '#ff7a59' }}>
            <Sparkles size={11} style={{ marginRight: 4 }} />
            Automated Analysis
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
          {comparison.map((item) => {
            const isSelected = item.algorithm === algorithm;
            return (
              <div
                key={item.algorithm}
                onClick={() => setAlgorithm(item.algorithm)}
                className="glass glass-hover"
                style={{
                  padding: 14,
                  borderRadius: 16,
                  cursor: 'pointer',
                  border: isSelected ? '2px solid #ff7a59' : '1px solid var(--hair)',
                  background: isSelected ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <b className="mono" style={{ fontSize: 14 }}>
                    {item.algorithm}
                  </b>
                  {isSelected && <span className="dot" style={{ background: '#ff7a59' }} />}
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: 'var(--ink-2)', display: 'grid', gap: 4 }}>
                  <div>
                    Avg TAT: <b className="mono" style={{ color: '#3b82f6' }}>{item.avgTAT} ticks</b>
                  </div>
                  <div>
                    Avg WT: <b className="mono" style={{ color: '#10b981' }}>{item.avgWT} ticks</b>
                  </div>
                  <div>
                    Total: <span className="mono">{item.completionTime} ticks</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Glass>
    </div>
  );
}
