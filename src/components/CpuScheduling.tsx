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
  Layers, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { SchedulingAlgorithm, SchedulingProcessInput } from '../types/process';
import { runSchedulingSimulation } from '../utils/schedulingAlgorithms';

const DEFAULT_PROCESSES: SchedulingProcessInput[] = [
  { pid: 1, name: 'P1 (Compiler)', arrivalTime: 0, burstTime: 8, priority: 3, color: '#38bdf8' },
  { pid: 2, name: 'P2 (Web Server)', arrivalTime: 1, burstTime: 4, priority: 1, color: '#10b981' },
  { pid: 3, name: 'P3 (DB Query)', arrivalTime: 2, burstTime: 9, priority: 4, color: '#f59e0b' },
  { pid: 4, name: 'P4 (Audio Sync)', arrivalTime: 3, burstTime: 3, priority: 2, color: '#ec4899' },
  { pid: 5, name: 'P5 (Background Backup)', arrivalTime: 4, burstTime: 5, priority: 5, color: '#8b5cf6' },
];

export const CpuScheduling: React.FC = () => {
  const [algorithm, setAlgorithm] = useState<SchedulingAlgorithm>('RR');
  const [timeQuantum, setTimeQuantum] = useState<number>(3);
  const [processes, setProcesses] = useState<SchedulingProcessInput[]>(DEFAULT_PROCESSES);
  const [showComparisonModal, setShowComparisonModal] = useState<boolean>(false);

  // Run simulation on current data & selected algorithm
  const simulation = useMemo(() => {
    return runSchedulingSimulation(algorithm, processes, timeQuantum);
  }, [algorithm, processes, timeQuantum]);

  // Color map for PIDs
  const pidColorMap = useMemo(() => {
    const map = new Map<number | 'IDLE', string>();
    processes.forEach(p => map.set(p.pid, p.color || '#38bdf8'));
    map.set('IDLE', '#334155');
    return map;
  }, [processes]);

  // Comparison matrix across all algorithms
  const comparisonResults = useMemo(() => {
    if (!showComparisonModal) return [];
    const algos: SchedulingAlgorithm[] = ['FCFS', 'SJF', 'SRTF', 'RR', 'PRIORITY', 'PRIORITY_PREEMPTIVE'];
    return algos.map(alg => ({
      algoName: alg,
      summary: runSchedulingSimulation(alg, processes, timeQuantum),
    }));
  }, [showComparisonModal, processes, timeQuantum]);

  // Add process row
  const handleAddProcess = () => {
    const nextPid = processes.length > 0 ? Math.max(...processes.map(p => p.pid)) + 1 : 1;
    const colors = ['#06b6d4', '#14b8a6', '#f97316', '#a855f7', '#6366f1', '#e11d48'];
    const color = colors[nextPid % colors.length];

    setProcesses(prev => [
      ...prev,
      {
        pid: nextPid,
        name: `P${nextPid}`,
        arrivalTime: prev.length > 0 ? prev[prev.length - 1].arrivalTime + 1 : 0,
        burstTime: 4,
        priority: 3,
        color,
      },
    ]);
  };

  // Remove process row
  const handleRemoveProcess = (pid: number) => {
    setProcesses(prev => prev.filter(p => p.pid !== pid));
  };

  // Update process field
  const handleUpdateProcess = (pid: number, field: keyof SchedulingProcessInput, value: any) => {
    setProcesses(prev =>
      prev.map(p => {
        if (p.pid === pid) {
          return { ...p, [field]: value };
        }
        return p;
      })
    );
  };

  // Workload presets
  const loadPreset = (type: 'standard' | 'cpu_bound' | 'quick_jobs' | 'priority_test') => {
    if (type === 'standard') {
      setProcesses(DEFAULT_PROCESSES);
    } else if (type === 'cpu_bound') {
      setProcesses([
        { pid: 1, name: 'P1 (Tensorflow)', arrivalTime: 0, burstTime: 16, priority: 2, color: '#38bdf8' },
        { pid: 2, name: 'P2 (Matrix Multiply)', arrivalTime: 2, burstTime: 12, priority: 3, color: '#10b981' },
        { pid: 3, name: 'P3 (Video Render)', arrivalTime: 4, burstTime: 20, priority: 4, color: '#f59e0b' },
      ]);
    } else if (type === 'quick_jobs') {
      setProcesses([
        { pid: 1, name: 'P1 (CLI Command)', arrivalTime: 0, burstTime: 2, priority: 2, color: '#38bdf8' },
        { pid: 2, name: 'P2 (Ping Check)', arrivalTime: 1, burstTime: 1, priority: 1, color: '#10b981' },
        { pid: 3, name: 'P3 (File Read)', arrivalTime: 2, burstTime: 3, priority: 3, color: '#f59e0b' },
        { pid: 4, name: 'P4 (DNS Lookup)', arrivalTime: 3, burstTime: 1, priority: 1, color: '#ec4899' },
      ]);
    } else if (type === 'priority_test') {
      setProcesses([
        { pid: 1, name: 'P1 (Low Prio Daemon)', arrivalTime: 0, burstTime: 10, priority: 5, color: '#64748b' },
        { pid: 2, name: 'P2 (Kernel Watchdog)', arrivalTime: 2, burstTime: 4, priority: 1, color: '#ef4444' },
        { pid: 3, name: 'P3 (UI Thread)', arrivalTime: 3, burstTime: 6, priority: 2, color: '#38bdf8' },
      ]);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Top Banner */}
      <div className="bg-[#0f172a]/90 backdrop-blur-sm border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <CalendarClock className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">CPU Scheduling Simulator & Gantt Lab</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluate and compare standard operating system dispatch algorithms with exact timing analysis.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowComparisonModal(true)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-semibold transition"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Compare All 5 Algorithms</span>
          </button>
        </div>
      </div>

      {/* Algorithm Selector & Quantum Settings */}
      <div className="bg-[#0f172a]/80 border border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Selector pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'FCFS', label: 'FCFS (First-Come)' },
            { id: 'SJF', label: 'SJF (Shortest Job)' },
            { id: 'SRTF', label: 'SRTF (Preemptive SJF)' },
            { id: 'RR', label: 'Round Robin (RR)' },
            { id: 'PRIORITY', label: 'Priority (Non-Preemptive)' },
            { id: 'PRIORITY_PREEMPTIVE', label: 'Priority (Preemptive)' },
          ].map(algo => (
            <button
              key={algo.id}
              onClick={() => setAlgorithm(algo.id as SchedulingAlgorithm)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium font-mono transition ${
                algorithm === algo.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent'
              }`}
            >
              {algo.label}
            </button>
          ))}
        </div>

        {/* Round Robin Time Quantum Slider */}
        {algorithm === 'RR' && (
          <div className="flex items-center space-x-3 bg-slate-900 px-3.5 py-1.5 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400 font-mono whitespace-nowrap">Time Quantum ($q$):</span>
            <input
              type="range"
              min={1}
              max={10}
              value={timeQuantum}
              onChange={e => setTimeQuantum(Number(e.target.value))}
              className="w-24 accent-cyan-400 cursor-pointer"
            />
            <span className="font-mono font-bold text-cyan-400 min-w-[24px] text-center">
              {timeQuantum}t
            </span>
          </div>
        )}
      </div>

      {/* Gantt Chart Section */}
      <div className="bg-[#0f172a]/95 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Timer className="w-4 h-4 text-cyan-400" />
            <h3 className="font-semibold text-sm text-white">Execution Gantt Chart</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Total Elapsed Time: <strong className="text-cyan-400">{simulation.totalTime} ticks</strong>
          </span>
        </div>

        {/* Gantt Blocks Container */}
        <div className="pt-2">
          {simulation.ganttChart.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No processes scheduled. Add processes to view timeline.
            </div>
          ) : (
            <div className="overflow-x-auto pb-2">
              <div className="min-w-[700px]">
                {/* Timeline bar */}
                <div className="flex h-12 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 p-0.5 gap-0.5">
                  {simulation.ganttChart.map((block, idx) => {
                    const widthPercent = (block.duration / simulation.totalTime) * 100;
                    const isIdle = block.pid === 'IDLE';
                    const color = isIdle ? '#1e293b' : pidColorMap.get(block.pid) || '#38bdf8';

                    return (
                      <div
                        key={idx}
                        style={{
                          width: `${Math.max(widthPercent, 3)}%`,
                          backgroundColor: color,
                        }}
                        className={`relative group h-full flex flex-col items-center justify-center rounded transition-all hover:brightness-110 cursor-pointer ${
                          isIdle ? 'bg-stripes-slate' : ''
                        }`}
                        title={
                          isIdle
                            ? `CPU IDLE (${block.startTime} -> ${block.endTime})`
                            : `${block.processName} [PID ${block.pid}]: ${block.startTime} -> ${block.endTime} (${block.duration}t)`
                        }
                      >
                        <span className="text-[11px] font-bold font-mono text-slate-950 truncate px-1 drop-shadow-sm">
                          {isIdle ? 'IDLE' : `P${block.pid}`}
                        </span>

                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                          <div className="bg-slate-900 border border-slate-700 text-slate-200 text-[10px] font-mono px-2 py-1 rounded shadow-lg whitespace-nowrap">
                            <span>{block.processName || `PID ${block.pid}`}</span>
                            <div className="text-cyan-400">
                              [{block.startTime} → {block.endTime}] ({block.duration}t)
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Timeline axis ticks */}
                <div className="relative h-6 mt-1 flex text-[10px] font-mono text-slate-500">
                  <span className="absolute left-0">0</span>
                  {simulation.ganttChart.map((block, idx) => {
                    const leftPercent = (block.endTime / simulation.totalTime) * 100;
                    return (
                      <span
                        key={idx}
                        className="absolute transform -translate-x-1/2"
                        style={{ left: `${leftPercent}%` }}
                      >
                        {block.endTime}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-3.5">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Avg Waiting Time</span>
          <p className="text-xl font-bold font-mono text-cyan-400 mt-1">{simulation.avgWaitingTime} <span className="text-xs text-slate-500 font-sans">ticks</span></p>
          <span className="text-[10px] text-slate-500">Time spent in ready queue</span>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-3.5">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Avg Turnaround Time</span>
          <p className="text-xl font-bold font-mono text-emerald-400 mt-1">{simulation.avgTurnaroundTime} <span className="text-xs text-slate-500 font-sans">ticks</span></p>
          <span className="text-[10px] text-slate-500">Completion - Arrival</span>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-3.5">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Avg Response Time</span>
          <p className="text-xl font-bold font-mono text-purple-400 mt-1">{simulation.avgResponseTime} <span className="text-xs text-slate-500 font-sans">ticks</span></p>
          <span className="text-[10px] text-slate-500">First CPU schedule - Arrival</span>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-3.5">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">CPU Utilization</span>
          <p className="text-xl font-bold font-mono text-amber-400 mt-1">{simulation.cpuUtilization}%</p>
          <span className="text-[10px] text-slate-500">Busy / Total ratio</span>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-3.5">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Throughput</span>
          <p className="text-xl font-bold font-mono text-pink-400 mt-1">{simulation.throughput} <span className="text-xs text-slate-500 font-sans">p/tick</span></p>
          <span className="text-[10px] text-slate-500">Processes completed per tick</span>
        </div>
      </div>

      {/* Process Inputs & Detailed Metrics Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editable Process Inputs (5 cols) */}
        <div className="lg:col-span-5 bg-[#0f172a]/90 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="font-semibold text-sm text-white">Workload Configuration</h3>
            <div className="flex items-center space-x-1">
              <button
                onClick={handleAddProcess}
                className="px-2 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 rounded text-xs flex items-center space-x-1 transition"
              >
                <Plus className="w-3 h-3" />
                <span>Add Job</span>
              </button>
            </div>
          </div>

          {/* Quick preset selector */}
          <div className="flex items-center space-x-1.5 text-xs text-slate-400">
            <span>Presets:</span>
            <button
              onClick={() => loadPreset('standard')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px]"
            >
              Default
            </button>
            <button
              onClick={() => loadPreset('cpu_bound')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px]"
            >
              CPU Bound
            </button>
            <button
              onClick={() => loadPreset('quick_jobs')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px]"
            >
              Quick I/O
            </button>
            <button
              onClick={() => loadPreset('priority_test')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px]"
            >
              Priority
            </button>
          </div>

          {/* Inputs table */}
          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <tr>
                  <th className="py-2 px-2">Job</th>
                  <th className="py-2 px-2">Arrival (AT)</th>
                  <th className="py-2 px-2">Burst (BT)</th>
                  <th className="py-2 px-2">Priority</th>
                  <th className="py-2 px-1 text-center">Del</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono">
                {processes.map(p => (
                  <tr key={p.pid} className="hover:bg-slate-900/50">
                    <td className="py-2 px-2">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: p.color || '#38bdf8' }}
                        />
                        <span className="font-bold text-white">P{p.pid}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min={0}
                        value={p.arrivalTime}
                        onChange={e => handleUpdateProcess(p.pid, 'arrivalTime', Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs text-cyan-300 focus:outline-none focus:border-cyan-500"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min={1}
                        value={p.burstTime}
                        onChange={e => handleUpdateProcess(p.pid, 'burstTime', Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs text-amber-300 focus:outline-none focus:border-amber-500"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={p.priority}
                        onChange={e => handleUpdateProcess(p.pid, 'priority', Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                      />
                    </td>
                    <td className="py-2 px-1 text-center">
                      <button
                        onClick={() => handleRemoveProcess(p.pid)}
                        className="text-slate-500 hover:text-red-400 p-1"
                        title="Remove process"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Process Timing Metrics (7 cols) */}
        <div className="lg:col-span-7 bg-[#0f172a]/90 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="font-semibold text-sm text-white">Calculated Process Metrics Breakdown</h3>
            <span className="text-[11px] font-mono text-cyan-400 uppercase">
              Algorithm: {algorithm}
            </span>
          </div>

          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[11px]">
                <tr>
                  <th className="py-2 px-2.5">PID</th>
                  <th className="py-2 px-2">AT</th>
                  <th className="py-2 px-2">BT</th>
                  <th className="py-2 px-2">Prio</th>
                  <th className="py-2 px-2 text-cyan-400">Completion (CT)</th>
                  <th className="py-2 px-2 text-emerald-400">Turnaround (TAT)</th>
                  <th className="py-2 px-2 text-amber-400">Waiting (WT)</th>
                  <th className="py-2 px-2 text-purple-400">Response (RT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {simulation.processMetrics.map(m => (
                  <tr key={m.pid} className="hover:bg-slate-900/60">
                    <td className="py-2 px-2.5 font-bold text-white">P{m.pid}</td>
                    <td className="py-2 px-2 text-slate-400">{m.arrivalTime}</td>
                    <td className="py-2 px-2 text-slate-300">{m.burstTime}</td>
                    <td className="py-2 px-2 text-slate-400">{m.priority}</td>
                    <td className="py-2 px-2 text-cyan-300 font-bold">{m.completionTime}</td>
                    <td className="py-2 px-2 text-emerald-300 font-bold">{m.turnaroundTime}</td>
                    <td className="py-2 px-2 text-amber-300 font-bold">{m.waitingTime}</td>
                    <td className="py-2 px-2 text-purple-300 font-bold">{m.responseTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Formulas footnote */}
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono flex flex-wrap gap-x-4 gap-y-1">
            <span>Turnaround Time (TAT) = CT - AT</span>
            <span>Waiting Time (WT) = TAT - BT</span>
            <span>Response Time (RT) = First CPU - AT</span>
          </div>
        </div>
      </div>

      {/* Comparison Modal */}
      {showComparisonModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-base text-white">Algorithm Benchmark Comparison Matrix</h3>
              </div>
              <button
                onClick={() => setShowComparisonModal(false)}
                className="text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 text-xs"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Direct comparison of all scheduling algorithms running on the current workload dataset ({processes.length} processes, Round Robin quantum = {timeQuantum}):
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-3">Algorithm</th>
                    <th className="py-3 px-3 text-cyan-400">Avg Waiting (WT)</th>
                    <th className="py-3 px-3 text-emerald-400">Avg Turnaround (TAT)</th>
                    <th className="py-3 px-3 text-purple-400">Avg Response (RT)</th>
                    <th className="py-3 px-3 text-amber-400">CPU Utilization</th>
                    <th className="py-3 px-3">Total Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {comparisonResults.map(res => {
                    const isLowestWT =
                      res.summary.avgWaitingTime ===
                      Math.min(...comparisonResults.map(c => c.summary.avgWaitingTime));

                    return (
                      <tr key={res.algoName} className="hover:bg-slate-900/50">
                        <td className="py-3 px-3 font-bold text-white flex items-center space-x-2">
                          <span>{res.algoName}</span>
                          {isLowestWT && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              Best WT
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-cyan-300 font-bold">{res.summary.avgWaitingTime} ticks</td>
                        <td className="py-3 px-3 text-emerald-300 font-bold">{res.summary.avgTurnaroundTime} ticks</td>
                        <td className="py-3 px-3 text-purple-300 font-bold">{res.summary.avgResponseTime} ticks</td>
                        <td className="py-3 px-3 text-amber-300 font-bold">{res.summary.cpuUtilization}%</td>
                        <td className="py-3 px-3 text-slate-300">{res.summary.totalTime} ticks</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs text-slate-400">
              <span className="font-semibold text-white">OS Insight: </span>
              SRTF (Preemptive SJF) generally provides the theoretical minimal Average Waiting Time, whereas Round Robin guarantees fair CPU distribution and avoids starvation.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
