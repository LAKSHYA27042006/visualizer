import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Cpu,
  GitFork,
  ListTree,
  CalendarClock,
  BookOpen,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Terminal,
  Activity,
  Layers,
  AlertCircle,
  CheckCircle2,
  Hourglass,
  Sparkles,
  ArrowRight,
  Database,
  Zap,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Trash2,
  Plus,
  Skull,
  Sliders,
  FileCode,
  HardDrive,
  X,
  Search,
  ArrowUpDown,
  Timer,
  BarChart3,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

// ==========================================
// 1. SCHEDULING ALGORITHMS ENGINE
// ==========================================
function runSchedulingSimulation(algorithm, processes, timeQuantum = 2) {
  if (!processes || processes.length === 0) {
    return {
      algorithm,
      ganttChart: [],
      processMetrics: [],
      avgWaitingTime: 0,
      avgTurnaroundTime: 0,
      avgResponseTime: 0,
      cpuUtilization: 0,
      throughput: 0,
      totalTime: 0,
    };
  }

  const procList = processes.map(p => ({
    ...p,
    remainingTime: p.burstTime,
    completionTime: 0,
    firstResponseTime: -1,
  }));

  const rawGantt = [];
  let currentTime = 0;
  const n = procList.length;
  let completed = 0;

  if (algorithm === 'FCFS') {
    const sorted = [...procList].sort((a, b) => a.arrivalTime - b.arrivalTime || a.pid - b.pid);
    for (const p of sorted) {
      if (currentTime < p.arrivalTime) {
        for (let t = currentTime; t < p.arrivalTime; t++) {
          rawGantt.push({ pid: 'IDLE', time: t });
        }
        currentTime = p.arrivalTime;
      }
      p.firstResponseTime = currentTime;
      for (let t = 0; t < p.burstTime; t++) {
        rawGantt.push({ pid: p.pid, time: currentTime + t });
      }
      currentTime += p.burstTime;
      p.completionTime = currentTime;
      p.remainingTime = 0;
    }
  } else if (algorithm === 'SJF') {
    while (completed < n) {
      const available = procList.filter(p => p.arrivalTime <= currentTime && p.remainingTime > 0);
      if (available.length === 0) {
        rawGantt.push({ pid: 'IDLE', time: currentTime });
        currentTime++;
        continue;
      }
      available.sort((a, b) => a.burstTime - b.burstTime || a.arrivalTime - b.arrivalTime || a.pid - b.pid);
      const chosen = available[0];
      chosen.firstResponseTime = currentTime;
      for (let t = 0; t < chosen.burstTime; t++) {
        rawGantt.push({ pid: chosen.pid, time: currentTime + t });
      }
      currentTime += chosen.burstTime;
      chosen.completionTime = currentTime;
      chosen.remainingTime = 0;
      completed++;
    }
  } else if (algorithm === 'SRTF') {
    const maxTime = 10000;
    while (completed < n && currentTime < maxTime) {
      const available = procList.filter(p => p.arrivalTime <= currentTime && p.remainingTime > 0);
      if (available.length === 0) {
        rawGantt.push({ pid: 'IDLE', time: currentTime });
        currentTime++;
        continue;
      }
      available.sort((a, b) => a.remainingTime - b.remainingTime || a.arrivalTime - b.arrivalTime || a.pid - b.pid);
      const chosen = available[0];
      if (chosen.firstResponseTime === -1) chosen.firstResponseTime = currentTime;
      rawGantt.push({ pid: chosen.pid, time: currentTime });
      chosen.remainingTime--;
      currentTime++;
      if (chosen.remainingTime === 0) {
        chosen.completionTime = currentTime;
        completed++;
      }
    }
  } else if (algorithm === 'RR') {
    const queue = [];
    const inQueue = new Set();
    let time = 0;
    const q = Math.max(1, timeQuantum);

    const checkArrivals = (t) => {
      procList.forEach(p => {
        if (p.arrivalTime <= t && p.remainingTime > 0 && !inQueue.has(p.pid)) {
          queue.push(p);
          inQueue.add(p.pid);
        }
      });
    };

    checkArrivals(time);

    while (completed < n && time < 10000) {
      if (queue.length === 0) {
        const nextArrival = procList
          .filter(p => p.remainingTime > 0)
          .reduce((min, p) => (p.arrivalTime < min ? p.arrivalTime : min), Infinity);
        if (nextArrival !== Infinity && nextArrival > time) {
          while (time < nextArrival) {
            rawGantt.push({ pid: 'IDLE', time });
            time++;
          }
        } else {
          rawGantt.push({ pid: 'IDLE', time });
          time++;
        }
        checkArrivals(time);
        continue;
      }

      const current = queue.shift();
      inQueue.delete(current.pid);
      if (current.firstResponseTime === -1) current.firstResponseTime = time;

      const execDuration = Math.min(q, current.remainingTime);
      for (let i = 0; i < execDuration; i++) {
        rawGantt.push({ pid: current.pid, time: time + i });
        checkArrivals(time + i + 1);
      }

      time += execDuration;
      current.remainingTime -= execDuration;

      if (current.remainingTime === 0) {
        current.completionTime = time;
        completed++;
      } else {
        checkArrivals(time);
        queue.push(current);
        inQueue.add(current.pid);
      }
    }
    currentTime = time;
  } else if (algorithm === 'PRIORITY') {
    while (completed < n) {
      const available = procList.filter(p => p.arrivalTime <= currentTime && p.remainingTime > 0);
      if (available.length === 0) {
        rawGantt.push({ pid: 'IDLE', time: currentTime });
        currentTime++;
        continue;
      }
      available.sort((a, b) => a.priority - b.priority || a.arrivalTime - b.arrivalTime || a.pid - b.pid);
      const chosen = available[0];
      chosen.firstResponseTime = currentTime;
      for (let t = 0; t < chosen.burstTime; t++) {
        rawGantt.push({ pid: chosen.pid, time: currentTime + t });
      }
      currentTime += chosen.burstTime;
      chosen.completionTime = currentTime;
      chosen.remainingTime = 0;
      completed++;
    }
  } else if (algorithm === 'PRIORITY_PREEMPTIVE') {
    const maxTime = 10000;
    while (completed < n && currentTime < maxTime) {
      const available = procList.filter(p => p.arrivalTime <= currentTime && p.remainingTime > 0);
      if (available.length === 0) {
        rawGantt.push({ pid: 'IDLE', time: currentTime });
        currentTime++;
        continue;
      }
      available.sort((a, b) => a.priority - b.priority || a.arrivalTime - b.arrivalTime || a.pid - b.pid);
      const chosen = available[0];
      if (chosen.firstResponseTime === -1) chosen.firstResponseTime = currentTime;
      rawGantt.push({ pid: chosen.pid, time: currentTime });
      chosen.remainingTime--;
      currentTime++;
      if (chosen.remainingTime === 0) {
        chosen.completionTime = currentTime;
        completed++;
      }
    }
  }

  // Compress raw timeline into contiguous Gantt blocks
  const ganttChart = [];
  if (rawGantt.length > 0) {
    let currentBlock = {
      pid: rawGantt[0].pid,
      startTime: 0,
      endTime: 1,
      duration: 1,
      processName: rawGantt[0].pid === 'IDLE' ? 'IDLE' : procList.find(p => p.pid === rawGantt[0].pid)?.name,
    };

    for (let i = 1; i < rawGantt.length; i++) {
      const item = rawGantt[i];
      if (item.pid === currentBlock.pid) {
        currentBlock.endTime++;
        currentBlock.duration++;
      } else {
        ganttChart.push(currentBlock);
        currentBlock = {
          pid: item.pid,
          startTime: i,
          endTime: i + 1,
          duration: 1,
          processName: item.pid === 'IDLE' ? 'IDLE' : procList.find(p => p.pid === item.pid)?.name,
        };
      }
    }
    ganttChart.push(currentBlock);
  }

  const processMetrics = procList.map(p => {
    const tat = p.completionTime - p.arrivalTime;
    const wt = tat - p.burstTime;
    const rt = (p.firstResponseTime !== -1 ? p.firstResponseTime : p.arrivalTime) - p.arrivalTime;
    return {
      pid: p.pid,
      name: p.name,
      arrivalTime: p.arrivalTime,
      burstTime: p.burstTime,
      priority: p.priority,
      completionTime: p.completionTime,
      turnaroundTime: Math.max(0, tat),
      waitingTime: Math.max(0, wt),
      responseTime: Math.max(0, rt),
    };
  });

  const totalTime = currentTime || 1;
  const busyTicks = rawGantt.filter(g => g.pid !== 'IDLE').length;
  const cpuUtilization = Number(((busyTicks / totalTime) * 100).toFixed(1));
  const throughput = Number((n / totalTime).toFixed(3));

  const avgWaitingTime = Number(
    (processMetrics.reduce((sum, p) => sum + p.waitingTime, 0) / n).toFixed(2)
  );
  const avgTurnaroundTime = Number(
    (processMetrics.reduce((sum, p) => sum + p.turnaroundTime, 0) / n).toFixed(2)
  );
  const avgResponseTime = Number(
    (processMetrics.reduce((sum, p) => sum + p.responseTime, 0) / n).toFixed(2)
  );

  return {
    algorithm,
    ganttChart,
    processMetrics,
    avgWaitingTime,
    avgTurnaroundTime,
    avgResponseTime,
    cpuUtilization,
    throughput,
    totalTime,
  };
}

// ==========================================
// 2. TREE LAYOUT COMPUTATION
// ==========================================
const NODE_WIDTH = 220;
const NODE_HEIGHT = 100;
const HORIZONTAL_GAP = 50;
const VERTICAL_GAP = 90;

function calculateTreeLayout(processes, rootPid = 1) {
  const activeProcesses = processes.filter(p => p.state !== 'terminated');
  const procMap = new Map();
  processes.forEach(p => procMap.set(p.pid, p));

  let rootPcb = procMap.get(rootPid);
  if (!rootPcb && processes.length > 0) {
    rootPcb = processes.find(p => p.ppid === 0) || processes[0];
  }

  if (!rootPcb) {
    return { nodes: [], links: [], width: 800, height: 600 };
  }

  function buildSubtree(currentPcb, level) {
    const childPcbs = activeProcesses.filter(p => p.ppid === currentPcb.pid && p.pid !== currentPcb.pid);
    const children = childPcbs.map(c => buildSubtree(c, level + 1));
    return {
      pcb: currentPcb,
      children,
      x: 0,
      y: level * (NODE_HEIGHT + VERTICAL_GAP),
      level,
      subtreeWidth: 0,
    };
  }

  const rootNode = buildSubtree(rootPcb, 0);

  function computeWidths(node) {
    if (node.children.length === 0) {
      node.subtreeWidth = NODE_WIDTH;
      return NODE_WIDTH;
    }
    let totalChildWidth = 0;
    for (const child of node.children) {
      totalChildWidth += computeWidths(child);
    }
    totalChildWidth += (node.children.length - 1) * HORIZONTAL_GAP;
    node.subtreeWidth = Math.max(NODE_WIDTH, totalChildWidth);
    return node.subtreeWidth;
  }

  computeWidths(rootNode);

  function assignPositions(node, leftX) {
    if (node.children.length === 0) {
      node.x = leftX + (node.subtreeWidth - NODE_WIDTH) / 2;
      return;
    }
    let currentLeft = leftX;
    for (const child of node.children) {
      assignPositions(child, currentLeft);
      currentLeft += child.subtreeWidth + HORIZONTAL_GAP;
    }
    const firstChildCenter = node.children[0].x + NODE_WIDTH / 2;
    const lastChildCenter = node.children[node.children.length - 1].x + NODE_WIDTH / 2;
    node.x = (firstChildCenter + lastChildCenter) / 2 - NODE_WIDTH / 2;
  }

  assignPositions(rootNode, 40);

  const nodes = [];
  const links = [];

  function collectNodes(node) {
    nodes.push({
      pcb: node.pcb,
      x: node.x,
      y: node.y + 40,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      level: node.level,
    });
    for (const child of node.children) {
      links.push({
        id: `${node.pcb.pid}->${child.pcb.pid}`,
        fromPid: node.pcb.pid,
        toPid: child.pcb.pid,
        fromX: node.x + NODE_WIDTH / 2,
        fromY: node.y + 40 + NODE_HEIGHT,
        toX: child.x + NODE_WIDTH / 2,
        toY: child.y + 40,
      });
      collectNodes(child);
    }
  }

  collectNodes(rootNode);

  const includedPids = new Set(nodes.map(n => n.pcb.pid));
  const unattached = activeProcesses.filter(p => !includedPids.has(p.pid));
  if (unattached.length > 0) {
    let unattachedX = (nodes.length > 0 ? Math.max(...nodes.map(n => n.x + n.width)) : 0) + 80;
    unattached.forEach((p, idx) => {
      nodes.push({
        pcb: p,
        x: unattachedX + idx * (NODE_WIDTH + 30),
        y: 40,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        level: 0,
      });
    });
  }

  const maxX = Math.max(...nodes.map(n => n.x + n.width), 800);
  const maxY = Math.max(...nodes.map(n => n.y + n.height), 600);

  return {
    nodes,
    links,
    width: maxX + 100,
    height: maxY + 100,
  };
}

// ==========================================
// 3. INITIAL SAMPLE PROCESSES DATA
// ==========================================
const INITIAL_PROCESSES = [
  {
    pid: 1,
    ppid: 0,
    name: 'systemd (init)',
    state: 'running',
    priority: 1,
    arrivalTime: 0,
    burstTime: 20,
    remainingTime: 18,
    memoryMB: 32,
    programCounter: '0x7FFF0040',
    registers: { rax: '0x00000001', rbx: '0x00000000', rcx: '0x00001000', rsp: '0x7FFFFFFE' },
    openFiles: ['/dev/null', '/var/log/syslog', '/run/systemd/system'],
    createdAt: 0,
    children: [101, 102, 103],
  },
  {
    pid: 101,
    ppid: 1,
    name: 'sshd: listener',
    state: 'waiting',
    priority: 2,
    arrivalTime: 2,
    burstTime: 14,
    remainingTime: 10,
    memoryMB: 18,
    programCounter: '0x004012A0',
    registers: { rax: '0x00000016', rbx: '0x00000004', rcx: '0x00000000', rsp: '0x7FFFB100' },
    openFiles: ['/etc/ssh/sshd_config', 'tcp:0.0.0.0:22'],
    createdAt: 2,
    children: [201],
  },
  {
    pid: 102,
    ppid: 1,
    name: 'bash [session 1]',
    state: 'ready',
    priority: 4,
    arrivalTime: 4,
    burstTime: 10,
    remainingTime: 8,
    memoryMB: 12,
    programCounter: '0x00404C18',
    registers: { rax: '0x00000000', rbx: '0x00000001', rcx: '0x00007890', rsp: '0x7FFFC200' },
    openFiles: ['/dev/pts/0', '/dev/pts/0', '/dev/pts/0'],
    createdAt: 4,
    children: [301, 302],
  },
  {
    pid: 103,
    ppid: 1,
    name: 'dockerd',
    state: 'ready',
    priority: 3,
    arrivalTime: 5,
    burstTime: 16,
    remainingTime: 14,
    memoryMB: 64,
    programCounter: '0x00408F90',
    registers: { rax: '0x00000002', rbx: '0x00000000', rcx: '0x00003000', rsp: '0x7FFFD000' },
    openFiles: ['/var/run/docker.sock'],
    createdAt: 5,
    children: [401],
  },
  {
    pid: 201,
    ppid: 101,
    name: 'sshd: worker [user]',
    state: 'waiting',
    priority: 3,
    arrivalTime: 6,
    burstTime: 8,
    remainingTime: 6,
    memoryMB: 14,
    programCounter: '0x004023B0',
    registers: { rax: '0x00000000', rbx: '0x00000000', rcx: '0x00000000', rsp: '0x7FFFE100' },
    openFiles: ['/dev/pts/1'],
    createdAt: 6,
    children: [],
  },
  {
    pid: 301,
    ppid: 102,
    name: 'compiler: gcc',
    state: 'ready',
    priority: 5,
    arrivalTime: 8,
    burstTime: 12,
    remainingTime: 9,
    memoryMB: 48,
    programCounter: '0x0040E010',
    registers: { rax: '0x00000004', rbx: '0x00000002', rcx: '0x00005000', rsp: '0x7FFFF200' },
    openFiles: ['main.c', '/tmp/ccXyZ1.s'],
    createdAt: 8,
    children: [],
  },
  {
    pid: 302,
    ppid: 102,
    name: 'child_helper',
    state: 'zombie',
    priority: 6,
    arrivalTime: 9,
    burstTime: 4,
    remainingTime: 0,
    memoryMB: 6,
    programCounter: '0x00000000',
    registers: { rax: '0x00000000', rbx: '0x00000000', rcx: '0x00000000', rsp: '0x00000000' },
    openFiles: [],
    createdAt: 9,
    children: [],
    exitCode: 0,
  },
  {
    pid: 401,
    ppid: 103,
    name: 'container: redis-cache',
    state: 'ready',
    priority: 2,
    arrivalTime: 11,
    burstTime: 25,
    remainingTime: 22,
    memoryMB: 80,
    programCounter: '0x00406AA8',
    registers: { rax: '0x00000005', rbx: '0x00000003', rcx: '0x00002000', rsp: '0x7FFFC800' },
    openFiles: ['/data/dump.rdb', 'tcp:0.0.0.0:6379'],
    createdAt: 11,
    children: [],
  },
];

// ==========================================
// 4. MAIN EXPORTABLE REACT COMPONENT
// ==========================================
export default function ProcessManagementVisualizer() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [processes, setProcesses] = useState(INITIAL_PROCESSES);
  const [selectedPid, setSelectedPid] = useState(1);
  const [currentTick, setCurrentTick] = useState(14);
  const [isSimulating, setIsSimulating] = useState(false);
  const [forkCount, setForkCount] = useState(7);
  const [contextSwitchCount, setContextSwitchCount] = useState(12);

  // Modals & UI States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Derived state
  const selectedProcess = useMemo(() => processes.find(p => p.pid === selectedPid) || null, [processes, selectedPid]);
  const runningProcess = useMemo(() => processes.find(p => p.state === 'running') || null, [processes]);
  const readyQueue = useMemo(() => processes.filter(p => p.state === 'ready'), [processes]);
  const waitingQueue = useMemo(() => processes.filter(p => p.state === 'waiting'), [processes]);
  const terminatedList = useMemo(() => processes.filter(p => p.state === 'terminated'), [processes]);
  const zombieCount = useMemo(() => processes.filter(p => p.state === 'zombie').length, [processes]);
  const orphanCount = useMemo(() => processes.filter(p => p.isOrphan).length, [processes]);

  // Actions
  const forkProcess = useCallback((parentPid, customName) => {
    setProcesses(prev => {
      const parent = prev.find(p => p.pid === parentPid);
      if (!parent || parent.state === 'terminated' || parent.state === 'zombie') return prev;

      const nextPid = Math.max(...prev.map(p => p.pid)) + 1;
      const newChild = {
        pid: nextPid,
        ppid: parent.pid,
        name: customName || `fork_${parent.name.split(' ')[0]}_${nextPid}`,
        state: 'ready',
        priority: parent.priority,
        arrivalTime: currentTick,
        burstTime: Math.floor(Math.random() * 8) + 4,
        remainingTime: Math.floor(Math.random() * 8) + 4,
        memoryMB: Math.max(8, Math.round(parent.memoryMB * 0.8)),
        programCounter: parent.programCounter,
        registers: { rax: '0x00000000', rbx: parent.registers.rbx, rcx: parent.registers.rcx, rsp: parent.registers.rsp },
        openFiles: [...parent.openFiles],
        createdAt: currentTick,
        children: [],
      };

      setForkCount(c => c + 1);
      return prev.map(p => (p.pid === parent.pid ? { ...p, children: [...p.children, nextPid] } : p)).concat(newChild);
    });
  }, [currentTick]);

  const terminateProcess = useCallback((pid) => {
    setProcesses(prev => {
      const target = prev.find(p => p.pid === pid);
      if (!target || target.state === 'terminated') return prev;

      const childrenPids = target.children;
      let nextList = prev.map(p => {
        if (childrenPids.includes(p.pid)) return { ...p, ppid: 1, isOrphan: true };
        if (p.pid === 1) return { ...p, children: Array.from(new Set([...p.children, ...childrenPids])) };
        return p;
      });

      const parent = prev.find(p => p.pid === target.ppid);
      const becomesZombie = parent && parent.state !== 'terminated';

      return nextList.map(p => {
        if (p.pid === pid) {
          return {
            ...p,
            state: becomesZombie ? 'zombie' : 'terminated',
            remainingTime: 0,
            exitCode: 0,
            children: [],
          };
        }
        return p;
      });
    });
  }, []);

  const reapZombie = useCallback((pid) => {
    setProcesses(prev =>
      prev.map(p => {
        if (p.pid === pid) return { ...p, state: 'terminated' };
        if (p.children.includes(pid)) return { ...p, children: p.children.filter(c => c !== pid) };
        return p;
      })
    );
  }, []);

  const changeState = useCallback((pid, newState) => {
    setProcesses(prev => {
      if (newState === 'running') {
        setContextSwitchCount(c => c + 1);
        return prev.map(p => {
          if (p.pid === pid) return { ...p, state: 'running' };
          if (p.state === 'running') return { ...p, state: 'ready' };
          return p;
        });
      }
      if (newState === 'terminated') {
        terminateProcess(pid);
        return prev;
      }
      return prev.map(p => (p.pid === pid ? { ...p, state: newState } : p));
    });
  }, [terminateProcess]);

  const stepClock = useCallback(() => {
    setCurrentTick(t => t + 1);
    setProcesses(prev => {
      let running = prev.find(p => p.state === 'running');
      let readyProcs = prev.filter(p => p.state === 'ready');

      if (running) {
        if (running.remainingTime <= 1) {
          const nextRunning = readyProcs[0] || null;
          if (nextRunning) setContextSwitchCount(c => c + 1);
          return prev.map(p => {
            if (p.pid === running.pid) return { ...p, state: 'terminated', remainingTime: 0 };
            if (nextRunning && p.pid === nextRunning.pid) return { ...p, state: 'running' };
            return p;
          });
        } else {
          return prev.map(p => (p.pid === running.pid ? { ...p, remainingTime: p.remainingTime - 1 } : p));
        }
      } else if (readyProcs.length > 0) {
        const next = readyProcs[0];
        setContextSwitchCount(c => c + 1);
        return prev.map(p => (p.pid === next.pid ? { ...p, state: 'running' } : p));
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(stepClock, 1000);
    return () => clearInterval(interval);
  }, [isSimulating, stepClock]);

  const resetToDefault = () => {
    setProcesses(INITIAL_PROCESSES);
    setSelectedPid(1);
    setCurrentTick(14);
    setIsSimulating(false);
    setForkCount(7);
    setContextSwitchCount(12);
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-40 bg-[#0b101b]/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base tracking-tight text-white">OS Kernel Visualizer</span>
                <span className="px-1.5 py-0.5 text-[11px] font-mono font-medium bg-cyan-950/80 text-cyan-300 border border-cyan-800/50 rounded">
                  v2.4
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Process Management & Fork Tree Visualizer</p>
            </div>
          </div>

          <nav className="flex items-center space-x-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs font-medium">
            {[
              { id: 'dashboard', label: 'Overview', icon: Activity },
              { id: 'forkTree', label: 'Fork Tree', icon: GitFork },
              { id: 'processManager', label: 'Process Table', icon: ListTree },
              { id: 'scheduling', label: 'CPU Scheduling', icon: CalendarClock },
              { id: 'learn', label: 'Learn OS / Syscalls', icon: BookOpen },
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg font-mono text-xs">
              <span className="text-slate-500">Tick:</span>
              <span className="font-bold text-cyan-400">{currentTick}</span>
            </div>

            <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
              <button
                onClick={() => setIsSimulating(p => !p)}
                className={`p-1.5 rounded transition ${
                  isSimulating ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                }`}
                title={isSimulating ? 'Pause Clock' : 'Start Simulation'}
              >
                {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={stepClock}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition"
                title="Step +1 Tick"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={resetToDefault}
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition"
                title="Reset OS Simulation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-[0_0_12px_rgba(6,182,212,0.25)] transition"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Process</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. BODY CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6">
        {/* OVERVIEW DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 pb-8">
            {/* Hero banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-[#0e172a] to-slate-900 border border-slate-800 p-6 shadow-xl">
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/40 text-cyan-300 text-xs font-mono mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>OS Process Subsystem & Fork Visualizer</span>
                  </div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Process Lifecycle & Fork Tree Engine</h1>
                  <p className="text-sm text-slate-400 max-w-2xl mt-1">
                    Inspect hierarchical process trees, explore Process Control Block (PCB) state transitions, and simulate real CPU scheduling algorithms.
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setIsSimulating(p => !p)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition ${
                      isSimulating
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                    }`}
                  >
                    {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{isSimulating ? 'Pause Engine' : 'Run Simulation'}</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('forkTree')}
                    className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
                  >
                    <GitFork className="w-4 h-4 text-cyan-400" />
                    <span>Open Tree Canvas</span>
                  </button>
                </div>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#0f172a]/80 border border-slate-800/80 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Processes</span>
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400"><Layers className="w-4 h-4" /></div>
                </div>
                <div className="mt-2 flex items-baseline space-x-2">
                  <span className="text-2xl font-bold font-mono text-white">{processes.filter(p => p.state !== 'terminated').length}</span>
                  <span className="text-xs text-slate-500 font-mono">/ {processes.length} total</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                  <span>Running: <strong className="text-emerald-400 font-mono">{runningProcess ? 1 : 0}</strong></span>
                  <span>Ready: <strong className="text-cyan-400 font-mono">{readyQueue.length}</strong></span>
                  <span>Waiting: <strong className="text-amber-400 font-mono">{waitingQueue.length}</strong></span>
                </div>
              </div>

              <div className="bg-[#0f172a]/80 border border-slate-800/80 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Fork Operations</span>
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400"><GitFork className="w-4 h-4" /></div>
                </div>
                <div className="mt-2 flex items-baseline space-x-2">
                  <span className="text-2xl font-bold font-mono text-purple-400">{forkCount}</span>
                  <span className="text-xs text-slate-500">invocations</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                  <span>Context Switches:</span>
                  <span className="font-mono text-slate-200">{contextSwitchCount}</span>
                </div>
              </div>

              <div className="bg-[#0f172a]/80 border border-slate-800/80 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">CPU Core #0</span>
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400"><Cpu className="w-4 h-4" /></div>
                </div>
                <div className="mt-2 flex items-baseline space-x-2">
                  <span className="text-2xl font-bold font-mono text-emerald-400">{runningProcess ? '88.5%' : '0%'}</span>
                  <span className="text-xs text-emerald-500/80 flex items-center"><Activity className="w-3 h-3 mr-1 inline" /> Active</span>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800/60">
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: runningProcess ? '88.5%' : '5%' }} />
                  </div>
                </div>
              </div>

              <div className="bg-[#0f172a]/80 border border-slate-800/80 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Simulation Clock</span>
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400"><Timer className="w-4 h-4" /></div>
                </div>
                <div className="mt-2 flex items-baseline space-x-2">
                  <span className="text-2xl font-bold font-mono text-amber-400">{currentTick}</span>
                  <span className="text-xs text-slate-500 font-mono">kernel ticks</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                  <span>Status:</span>
                  <span className={isSimulating ? 'text-emerald-400 font-medium' : 'text-slate-400'}>
                    {isSimulating ? 'Running (1 Hz)' : 'Paused'}
                  </span>
                </div>
              </div>
            </div>

            {/* Core & Queues Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* CPU status */}
              <div className="bg-[#0f172a]/90 border border-slate-800 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-semibold text-sm text-white">CPU Execution Core</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {runningProcess ? 'Executing' : 'Idle'}
                  </span>
                </div>

                {runningProcess ? (
                  <div className="mt-4 space-y-3">
                    <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs text-slate-400">Process</span>
                          <p className="font-semibold text-sm text-cyan-300 font-mono">{runningProcess.name}</p>
                        </div>
                        <span className="px-2 py-1 bg-cyan-950/80 text-cyan-400 font-mono text-xs rounded border border-cyan-800/50">
                          PID {runningProcess.pid}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-3 text-xs pt-2 border-t border-slate-800">
                        <div><span className="text-slate-500">PPID:</span> <span className="font-mono text-slate-300">{runningProcess.ppid}</span></div>
                        <div><span className="text-slate-500">Prio:</span> <span className="font-mono text-slate-300">{runningProcess.priority}</span></div>
                        <div><span className="text-slate-500">Burst Rem:</span> <span className="font-mono text-amber-300">{runningProcess.remainingTime}t</span></div>
                        <div><span className="text-slate-500">PC:</span> <span className="font-mono text-slate-300 truncate">{runningProcess.programCounter}</span></div>
                      </div>
                    </div>
                    <button
                      onClick={() => forkProcess(runningProcess.pid)}
                      className="w-full py-1.5 px-3 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-medium flex items-center justify-center space-x-1.5 transition"
                    >
                      <GitFork className="w-3.5 h-3.5" />
                      <span>fork() this process</span>
                    </button>
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    No active process currently dispatched. Click Step Clock to schedule next.
                  </div>
                )}
              </div>

              {/* Ready Queue */}
              <div className="bg-[#0f172a]/90 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                      <h3 className="font-semibold text-sm text-white">Ready Queue</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-cyan-950/60 text-cyan-400 border border-cyan-800/50">
                      {readyQueue.length} jobs
                    </span>
                  </div>
                  <div className="mt-3 space-y-2 max-h-52 overflow-y-auto pr-1">
                    {readyQueue.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-500">Ready queue is empty.</div>
                    ) : (
                      readyQueue.map(p => (
                        <div key={p.pid} className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-xs font-bold text-cyan-400">PID {p.pid}</span>
                              <span className="text-xs text-slate-200">{p.name}</span>
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono">Prio: {p.priority} | Burst: {p.remainingTime}t</span>
                          </div>
                          <button
                            onClick={() => forkProcess(p.pid)}
                            className="p-1 text-slate-400 hover:text-cyan-300 rounded"
                            title="Fork child"
                          >
                            <GitFork className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Blocked Queue & Anomalies */}
              <div className="bg-[#0f172a]/90 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center space-x-2">
                      <Hourglass className="w-4 h-4 text-amber-400" />
                      <h3 className="font-semibold text-sm text-white">Blocked / I/O Queue</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-950/60 text-amber-400 border border-amber-800/50">
                      {waitingQueue.length} blocked
                    </span>
                  </div>
                  <div className="mt-3 space-y-2 max-h-40 overflow-y-auto pr-1">
                    {waitingQueue.length === 0 ? (
                      <div className="py-4 text-center text-xs text-slate-500">No processes waiting for I/O.</div>
                    ) : (
                      waitingQueue.map(p => (
                        <div key={p.pid} className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                          <div>
                            <span className="font-mono text-xs font-bold text-amber-400">PID {p.pid}</span>
                            <span className="text-xs text-slate-200 ml-2">{p.name}</span>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                            I/O Wait
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {(zombieCount > 0 || orphanCount > 0) && (
                    <div className="mt-3 p-2.5 rounded-lg bg-pink-950/30 border border-pink-800/40 text-xs text-slate-300 space-y-1">
                      <div className="flex items-center space-x-1.5 text-pink-400 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Kernel Alert</span>
                      </div>
                      {zombieCount > 0 && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span>{zombieCount} Zombie process(es)</span>
                          <button
                            onClick={() => {
                              const z = processes.find(p => p.state === 'zombie');
                              if (z) reapZombie(z.pid);
                            }}
                            className="text-pink-400 hover:underline font-mono"
                          >
                            Reap
                          </button>
                        </div>
                      )}
                      {orphanCount > 0 && (
                        <p className="text-slate-400 text-[11px]">{orphanCount} Orphan reparented to PID 1.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FORK TREE CANVAS */}
        {activeTab === 'forkTree' && (
          <ForkTreeVisualizerSection
            processes={processes}
            selectedPid={selectedPid}
            setSelectedPid={setSelectedPid}
            selectedProcess={selectedProcess}
            forkProcess={forkProcess}
            terminateProcess={terminateProcess}
            reapZombie={reapZombie}
            changeState={changeState}
            resetToDefault={resetToDefault}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
          />
        )}

        {/* PROCESS TABLE */}
        {activeTab === 'processManager' && (
          <ProcessManagerSection
            processes={processes}
            changeState={changeState}
            terminateProcess={terminateProcess}
            reapZombie={reapZombie}
            forkProcess={forkProcess}
            resetToDefault={resetToDefault}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onInspectProcess={(pid) => {
              setSelectedPid(pid);
              setActiveTab('forkTree');
            }}
          />
        )}

        {/* CPU SCHEDULING */}
        {activeTab === 'scheduling' && <CpuSchedulingSection />}

        {/* LEARN OS & SYSTEM CALLS */}
        {activeTab === 'learn' && <LearnSection />}
      </main>

      {/* CREATE PROCESS MODAL */}
      {isCreateModalOpen && (
        <CreateProcessModalSimple
          processes={processes}
          currentTick={currentTick}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={(newProc) => {
            setProcesses(prev => {
              const updated = prev.map(p => {
                if (p.pid === newProc.ppid) return { ...p, children: [...p.children, newProc.pid] };
                return p;
              });
              return [...updated, newProc];
            });
            setIsCreateModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

// ==========================================
// 5. SUB-SECTIONS (Tree, Table, Scheduling, Learn)
// ==========================================

function ForkTreeVisualizerSection({
  processes,
  selectedPid,
  setSelectedPid,
  selectedProcess,
  forkProcess,
  terminateProcess,
  reapZombie,
  changeState,
  resetToDefault,
  onOpenCreateModal,
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showDetails, setShowDetails] = useState(true);

  const layout = useMemo(() => calculateTreeLayout(processes, 1), [processes]);

  const handleMouseDown = (e) => {
    if (e.target.closest('.tree-node')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseUp = () => setIsDragging(false);

  const getStateClasses = (st) => {
    switch (st) {
      case 'running':
        return { border: 'border-emerald-500/80', dot: 'bg-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300' };
      case 'ready':
        return { border: 'border-cyan-500/60', dot: 'bg-cyan-400', badge: 'bg-cyan-500/20 text-cyan-300' };
      case 'waiting':
        return { border: 'border-amber-500/60', dot: 'bg-amber-400', badge: 'bg-amber-500/20 text-amber-300' };
      case 'zombie':
        return { border: 'border-pink-500/80 animate-pulse', dot: 'bg-pink-400', badge: 'bg-pink-500/20 text-pink-300' };
      default:
        return { border: 'border-slate-700', dot: 'bg-slate-500', badge: 'bg-slate-800 text-slate-400' };
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[600px] border border-slate-800 rounded-xl overflow-hidden bg-[#080d1a] relative select-none">
      {/* Canvas top bar */}
      <div className="bg-[#0f172a]/95 backdrop-blur border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 z-20">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <GitFork className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-sm text-white">Fork Tree Canvas</span>
          </div>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">Nodes: {layout.nodes.length}</span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button onClick={() => setZoom(z => Math.min(1.8, z + 0.15))} className="p-1.5 text-slate-400 hover:text-white rounded"><ZoomIn className="w-3.5 h-3.5" /></button>
            <span className="px-1.5 text-[11px] font-mono text-slate-400 min-w-[36px] text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.max(0.5, z - 0.15))} className="p-1.5 text-slate-400 hover:text-white rounded"><ZoomOut className="w-3.5 h-3.5" /></button>
            <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="p-1.5 text-slate-400 hover:text-white rounded"><Maximize2 className="w-3.5 h-3.5" /></button>
          </div>

          {selectedProcess && selectedProcess.state !== 'terminated' && (
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => forkProcess(selectedProcess.pid)}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-medium transition"
              >
                <GitFork className="w-3.5 h-3.5" />
                <span>Fork PID {selectedProcess.pid}</span>
              </button>

              {selectedProcess.state === 'zombie' ? (
                <button
                  onClick={() => reapZombie(selectedProcess.pid)}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-pink-600/20 hover:bg-pink-600/30 text-pink-300 border border-pink-500/40 text-xs font-medium transition"
                >
                  <Skull className="w-3.5 h-3.5" />
                  <span>Reap</span>
                </button>
              ) : (
                <button
                  onClick={() => terminateProcess(selectedProcess.pid)}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 text-xs font-medium transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Terminate</span>
                </button>
              )}
            </div>
          )}

          <button
            onClick={onOpenCreateModal}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Node</span>
          </button>

          <button onClick={() => setShowDetails(p => !p)} className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300">
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative overflow-hidden flex">
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="flex-1 h-full overflow-hidden relative cursor-grab bg-slate-950"
        >
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'top center',
              width: `${Math.max(layout.width, 1000)}px`,
              height: `${Math.max(layout.height, 800)}px`,
              position: 'relative',
              margin: '0 auto',
            }}
          >
            {/* SVG Connecting Bézier Lines */}
            <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
              {layout.links.map(link => {
                const dy = link.toY - link.fromY;
                const pathD = `M ${link.fromX} ${link.fromY} C ${link.fromX} ${link.fromY + dy * 0.5}, ${link.toX} ${link.toY - dy * 0.5}, ${link.toX} ${link.toY}`;
                const isSelected = selectedPid === link.toPid || selectedPid === link.fromPid;

                return (
                  <g key={link.id}>
                    <path
                      d={pathD}
                      fill="none"
                      stroke={isSelected ? '#38bdf8' : '#334155'}
                      strokeWidth={isSelected ? 3 : 2}
                      strokeOpacity={isSelected ? 0.9 : 0.6}
                    />
                    <circle cx={link.toX} cy={link.toY} r={3} fill={isSelected ? '#38bdf8' : '#0ea5e9'} />
                  </g>
                );
              })}
            </svg>

            {/* DOM Process Cards */}
            {layout.nodes.map(node => {
              const pcb = node.pcb;
              const isSelected = selectedPid === pcb.pid;
              const style = getStateClasses(pcb.state);

              return (
                <div
                  key={pcb.pid}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPid(pcb.pid);
                  }}
                  className={`tree-node absolute rounded-xl p-3 border cursor-pointer transition-all ${
                    style.border
                  } ${
                    isSelected ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#080d1a] scale-105 z-10' : 'hover:scale-[1.02]'
                  }`}
                  style={{
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    width: `${node.width}px`,
                    backgroundColor: '#0f172a',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                      <span className="font-mono text-xs font-bold text-white">PID: {pcb.pid}</span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-400">PPID: {pcb.ppid}</span>
                  </div>

                  <div className="mt-1.5">
                    <p className="font-medium text-xs text-cyan-200 truncate">{pcb.name}</p>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className={`px-2 py-0.5 rounded-full border uppercase font-mono font-medium ${style.badge}`}>
                      {pcb.state}
                    </span>
                    <span className="text-slate-400 font-mono">Prio {pcb.priority}</span>
                  </div>

                  {pcb.state !== 'terminated' && pcb.state !== 'zombie' && (
                    <div className="mt-2">
                      <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                        <div
                          className="bg-cyan-500 h-1 rounded-full"
                          style={{
                            width: `${Math.min(100, ((pcb.burstTime - pcb.remainingTime) / pcb.burstTime) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {pcb.isOrphan && (
                    <div className="mt-1 flex items-center space-x-1 text-[10px] text-amber-400 font-mono">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Orphaned (rep. init)</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Process Details Panel */}
        {showDetails && selectedProcess && (
          <aside className="w-80 md:w-96 border-l border-slate-800 bg-[#0f172a]/95 backdrop-blur-md flex flex-col z-20 shadow-2xl overflow-y-auto p-4 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider">PCB Inspector</span>
                <h3 className="font-bold text-base text-white truncate max-w-[200px]">{selectedProcess.name}</h3>
              </div>
              <button onClick={() => setShowDetails(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            <div className="bg-slate-900 rounded-lg p-3 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Current State:</span>
                <span className="font-mono uppercase font-semibold text-cyan-300">{selectedProcess.state}</span>
              </div>
              <div className="flex items-center space-x-1.5 pt-1">
                <button
                  onClick={() => changeState(selectedProcess.pid, 'running')}
                  disabled={selectedProcess.state === 'running' || selectedProcess.state === 'terminated'}
                  className="flex-1 py-1 px-2 rounded bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-[11px] disabled:opacity-30"
                >
                  Run
                </button>
                <button
                  onClick={() => changeState(selectedProcess.pid, 'ready')}
                  disabled={selectedProcess.state === 'ready' || selectedProcess.state === 'terminated'}
                  className="flex-1 py-1 px-2 rounded bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 text-[11px] disabled:opacity-30"
                >
                  Ready
                </button>
                <button
                  onClick={() => changeState(selectedProcess.pid, 'waiting')}
                  disabled={selectedProcess.state === 'waiting' || selectedProcess.state === 'terminated'}
                  className="flex-1 py-1 px-2 rounded bg-amber-600/20 text-amber-300 border border-amber-500/30 text-[11px] disabled:opacity-30"
                >
                  Wait/IO
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Kernel Descriptors</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-900 p-2 rounded border border-slate-800"><span className="text-slate-500">PID:</span> <strong className="font-mono text-white ml-1">{selectedProcess.pid}</strong></div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800"><span className="text-slate-500">PPID:</span> <strong className="font-mono text-cyan-400 ml-1">{selectedProcess.ppid}</strong></div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800"><span className="text-slate-500">Prio:</span> <span className="font-mono text-slate-200 ml-1">{selectedProcess.priority}</span></div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800"><span className="text-slate-500">Memory:</span> <span className="font-mono text-slate-200 ml-1">{selectedProcess.memoryMB} MB</span></div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800"><span className="text-slate-500">Burst Rem:</span> <span className="font-mono text-amber-300 ml-1">{selectedProcess.remainingTime}t</span></div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800"><span className="text-slate-500">Total Burst:</span> <span className="font-mono text-slate-200 ml-1">{selectedProcess.burstTime}t</span></div>
              </div>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1">
                <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                <span>CPU Registers & PC</span>
              </h4>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] space-y-1">
                <div className="flex justify-between"><span className="text-slate-500">PC:</span> <span className="text-cyan-400">{selectedProcess.programCounter}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">RAX:</span> <span className="text-slate-300">{selectedProcess.registers.rax}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">RBX:</span> <span className="text-slate-300">{selectedProcess.registers.rbx}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">RSP:</span> <span className="text-slate-300">{selectedProcess.registers.rsp}</span></div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-2">
              <button
                onClick={() => forkProcess(selectedProcess.pid)}
                className="w-full py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs flex items-center justify-center space-x-1.5 transition"
              >
                <GitFork className="w-3.5 h-3.5" />
                <span>Fork New Child from PID {selectedProcess.pid}</span>
              </button>

              {selectedProcess.state === 'zombie' ? (
                <button
                  onClick={() => reapZombie(selectedProcess.pid)}
                  className="w-full py-2 px-3 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-medium text-xs flex items-center justify-center space-x-1.5 transition"
                >
                  <Skull className="w-3.5 h-3.5" />
                  <span>Reap Zombie via wait()</span>
                </button>
              ) : (
                <button
                  onClick={() => terminateProcess(selectedProcess.pid)}
                  className="w-full py-2 px-3 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 font-medium text-xs flex items-center justify-center space-x-1.5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Terminate Process</span>
                </button>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

function ProcessManagerSection({
  processes,
  changeState,
  terminateProcess,
  reapZombie,
  forkProcess,
  resetToDefault,
  onOpenCreateModal,
  onInspectProcess,
}) {
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('all');

  const filtered = processes.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.pid.toString().includes(search);
    const matchesState = stateFilter === 'all' || p.state === stateFilter;
    return matchesSearch && matchesState;
  });

  return (
    <div className="space-y-4 pb-8">
      <div className="bg-[#0f172a]/90 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ListTree className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Process Table & Lifecycle Manager</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">POSIX kernel process control block table and state manipulation.</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenCreateModal}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Process</span>
          </button>
          <button onClick={resetToDefault} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-[#0f172a]/70 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search PID, name..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto">
          {['all', 'running', 'ready', 'waiting', 'zombie', 'terminated'].map(st => (
            <button
              key={st}
              onClick={() => setStateFilter(st)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono uppercase transition ${
                stateFilter === st ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="border border-slate-800 rounded-xl bg-[#0f172a]/90 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">PID</th>
                <th className="py-3 px-3">PPID</th>
                <th className="py-3 px-3 font-sans">Name</th>
                <th className="py-3 px-3">State</th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-3">Burst Rem/Tot</th>
                <th className="py-3 px-3">Memory</th>
                <th className="py-3 px-4 text-right font-sans">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map(p => (
                <tr key={p.pid} className="hover:bg-slate-900/60 transition">
                  <td className="py-3 px-4 font-bold text-cyan-400">{p.pid}</td>
                  <td className="py-3 px-3 text-slate-400">{p.ppid}</td>
                  <td className="py-3 px-3 font-sans text-slate-200">
                    {p.name} {p.isOrphan && <span className="text-[10px] text-amber-400 bg-amber-500/20 px-1 py-0.5 rounded font-mono ml-1">orphan</span>}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded uppercase text-[11px] font-bold border border-slate-700 bg-slate-800">
                      {p.state}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-300">{p.priority}</td>
                  <td className="py-3 px-3 text-amber-300">{p.remainingTime} / {p.burstTime}t</td>
                  <td className="py-3 px-3 text-slate-400">{p.memoryMB} MB</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1.5 font-sans">
                      {p.state !== 'terminated' && p.state !== 'zombie' && (
                        <>
                          <button onClick={() => changeState(p.pid, 'running')} className="p-1 rounded bg-emerald-500/10 text-emerald-400" title="Run on CPU"><Play className="w-3 h-3" /></button>
                          <button onClick={() => changeState(p.pid, 'ready')} className="p-1 rounded bg-cyan-500/10 text-cyan-400" title="Ready queue"><CheckCircle2 className="w-3 h-3" /></button>
                          <button onClick={() => changeState(p.pid, 'waiting')} className="p-1 rounded bg-amber-500/10 text-amber-400" title="Block I/O"><Hourglass className="w-3 h-3" /></button>
                          <button onClick={() => forkProcess(p.pid)} className="p-1 rounded bg-purple-500/10 text-purple-400" title="fork()"><GitFork className="w-3 h-3" /></button>
                          <button onClick={() => terminateProcess(p.pid)} className="p-1 rounded bg-red-500/10 text-red-400" title="Terminate"><Trash2 className="w-3 h-3" /></button>
                        </>
                      )}
                      {p.state === 'zombie' && (
                        <button onClick={() => reapZombie(p.pid)} className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 text-xs font-mono">Reap</button>
                      )}
                      <button onClick={() => onInspectProcess(p.pid)} className="p-1 rounded bg-slate-800 text-slate-300" title="Inspect in Tree"><Sliders className="w-3 h-3" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CpuSchedulingSection() {
  const [algo, setAlgo] = useState('RR');
  const [timeQuantum, setTimeQuantum] = useState(3);
  const [procs, setProcs] = useState([
    { pid: 1, name: 'P1 (Compiler)', arrivalTime: 0, burstTime: 8, priority: 3, color: '#38bdf8' },
    { pid: 2, name: 'P2 (Web Server)', arrivalTime: 1, burstTime: 4, priority: 1, color: '#10b981' },
    { pid: 3, name: 'P3 (DB Query)', arrivalTime: 2, burstTime: 9, priority: 4, color: '#f59e0b' },
    { pid: 4, name: 'P4 (Audio Sync)', arrivalTime: 3, burstTime: 3, priority: 2, color: '#ec4899' },
    { pid: 5, name: 'P5 (Backup Job)', arrivalTime: 4, burstTime: 5, priority: 5, color: '#8b5cf6' },
  ]);

  const sim = useMemo(() => runSchedulingSimulation(algo, procs, timeQuantum), [algo, procs, timeQuantum]);

  return (
    <div className="space-y-6 pb-8">
      <div className="bg-[#0f172a]/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center space-x-2">
          <CalendarClock className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white tracking-tight">CPU Scheduling Simulator & Gantt Analysis</h2>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">Simulate and evaluate operating system process dispatch algorithms.</p>
      </div>

      <div className="bg-[#0f172a]/80 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1.5 font-mono text-xs">
          {['FCFS', 'SJF', 'SRTF', 'RR', 'PRIORITY', 'PRIORITY_PREEMPTIVE'].map(a => (
            <button
              key={a}
              onClick={() => setAlgo(a)}
              className={`px-3 py-1.5 rounded-lg transition ${
                algo === a ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              {a}
            </button>
          ))}
        </div>

        {algo === 'RR' && (
          <div className="flex items-center space-x-3 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono">
            <span className="text-slate-400">Time Quantum:</span>
            <input
              type="range"
              min={1}
              max={8}
              value={timeQuantum}
              onChange={e => setTimeQuantum(Number(e.target.value))}
              className="accent-cyan-400 cursor-pointer w-20"
            />
            <span className="font-bold text-cyan-400">{timeQuantum}t</span>
          </div>
        )}
      </div>

      {/* Gantt Area */}
      <div className="bg-[#0f172a]/95 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-white">Execution Gantt Chart</h3>
          <span className="text-xs font-mono text-cyan-400">Total: {sim.totalTime} ticks</span>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="min-w-[650px]">
            <div className="flex h-12 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 p-0.5 gap-0.5">
              {sim.ganttChart.map((block, idx) => {
                const widthPercent = (block.duration / sim.totalTime) * 100;
                const isIdle = block.pid === 'IDLE';
                const color = isIdle ? '#1e293b' : procs.find(p => p.pid === block.pid)?.color || '#38bdf8';

                return (
                  <div
                    key={idx}
                    style={{ width: `${Math.max(widthPercent, 3)}%`, backgroundColor: color }}
                    className="h-full flex flex-col items-center justify-center rounded text-slate-950 font-bold font-mono text-[11px]"
                    title={`${block.processName || block.pid}: ${block.startTime} -> ${block.endTime} (${block.duration}t)`}
                  >
                    <span>{isIdle ? 'IDLE' : `P${block.pid}`}</span>
                  </div>
                );
              })}
            </div>
            <div className="relative h-5 mt-1 flex text-[10px] font-mono text-slate-500">
              <span className="absolute left-0">0</span>
              {sim.ganttChart.map((b, i) => (
                <span key={i} className="absolute transform -translate-x-1/2" style={{ left: `${(b.endTime / sim.totalTime) * 100}%` }}>
                  {b.endTime}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-3.5">
          <span className="text-[11px] text-slate-400 uppercase font-medium">Avg Waiting Time</span>
          <p className="text-xl font-bold font-mono text-cyan-400 mt-1">{sim.avgWaitingTime} <span className="text-xs text-slate-500 font-sans">ticks</span></p>
        </div>
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-3.5">
          <span className="text-[11px] text-slate-400 uppercase font-medium">Avg Turnaround Time</span>
          <p className="text-xl font-bold font-mono text-emerald-400 mt-1">{sim.avgTurnaroundTime} <span className="text-xs text-slate-500 font-sans">ticks</span></p>
        </div>
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-3.5">
          <span className="text-[11px] text-slate-400 uppercase font-medium">Avg Response Time</span>
          <p className="text-xl font-bold font-mono text-purple-400 mt-1">{sim.avgResponseTime} <span className="text-xs text-slate-500 font-sans">ticks</span></p>
        </div>
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-3.5">
          <span className="text-[11px] text-slate-400 uppercase font-medium">CPU Utilization</span>
          <p className="text-xl font-bold font-mono text-amber-400 mt-1">{sim.cpuUtilization}%</p>
        </div>
      </div>

      {/* Metrics Table */}
      <div className="bg-[#0f172a]/90 border border-slate-800 rounded-xl p-4 shadow-sm">
        <h3 className="font-semibold text-sm text-white mb-2">Process Metrics Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[11px]">
              <tr>
                <th className="py-2 px-3">PID</th>
                <th className="py-2 px-3">Arrival (AT)</th>
                <th className="py-2 px-3">Burst (BT)</th>
                <th className="py-2 px-3">Priority</th>
                <th className="py-2 px-3 text-cyan-400">Completion (CT)</th>
                <th className="py-2 px-3 text-emerald-400">Turnaround (TAT)</th>
                <th className="py-2 px-3 text-amber-400">Waiting (WT)</th>
                <th className="py-2 px-3 text-purple-400">Response (RT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {sim.processMetrics.map(m => (
                <tr key={m.pid} className="hover:bg-slate-900/60">
                  <td className="py-2 px-3 font-bold text-white">P{m.pid}</td>
                  <td className="py-2 px-3 text-slate-400">{m.arrivalTime}</td>
                  <td className="py-2 px-3 text-slate-300">{m.burstTime}</td>
                  <td className="py-2 px-3 text-slate-400">{m.priority}</td>
                  <td className="py-2 px-3 text-cyan-300 font-bold">{m.completionTime}</td>
                  <td className="py-2 px-3 text-emerald-300 font-bold">{m.turnaroundTime}</td>
                  <td className="py-2 px-3 text-amber-300 font-bold">{m.waitingTime}</td>
                  <td className="py-2 px-3 text-purple-300 font-bold">{m.responseTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function LearnSection() {
  return (
    <div className="space-y-6 pb-8">
      <div className="bg-[#0f172a]/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white tracking-tight">Operating Systems Knowledge Base</h2>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">Reference for POSIX process concepts, system calls, and tree properties.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* fork() */}
        <div className="bg-[#0f172a]/90 border border-slate-800 rounded-xl p-5 space-y-3">
          <h3 className="font-bold text-base text-white flex items-center space-x-2">
            <GitFork className="w-4 h-4 text-cyan-400" />
            <span>fork() System Call</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            <code className="font-mono text-cyan-300">fork()</code> clones the calling process to produce a child. It returns twice: <strong className="text-cyan-400">&gt;0</strong> (child's PID) to parent, and <strong className="text-cyan-400">0</strong> to child.
          </p>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-slate-300">
            <pre>{`pid_t pid = fork();
if (pid == 0) {
    // Child process code
} else {
    // Parent process code
}`}</pre>
          </div>
        </div>

        {/* Zombies vs Orphans */}
        <div className="bg-[#0f172a]/90 border border-slate-800 rounded-xl p-5 space-y-3">
          <h3 className="font-bold text-base text-white flex items-center space-x-2">
            <Skull className="w-4 h-4 text-pink-400" />
            <span>Zombies vs Orphans</span>
          </h3>
          <div className="text-xs text-slate-300 space-y-2">
            <p>
              <strong className="text-pink-400">Zombie:</strong> Child exits, but parent hasn't reaped it via <code className="font-mono text-cyan-300">wait()</code>. The PCB remains in the process table.
            </p>
            <p>
              <strong className="text-amber-400">Orphan:</strong> Parent terminates before child. Linux reparents child to <code className="font-mono text-cyan-300">PID 1 (init/systemd)</code>.
            </p>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-slate-300">
            <pre>{`// Reaping zombie child:
waitpid(child_pid, &status, 0);`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateProcessModalSimple({ processes, currentTick, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [ppid, setPpid] = useState(1);
  const [burst, setBurst] = useState(6);
  const [priority, setPriority] = useState(3);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const nextPid = Math.max(...processes.map(p => p.pid)) + 1;
    onCreate({
      pid: nextPid,
      ppid,
      name: name.trim(),
      state: 'ready',
      priority,
      arrivalTime: currentTick,
      burstTime: burst,
      remainingTime: burst,
      memoryMB: 16,
      programCounter: '0x00401000',
      registers: { rax: '0x0', rbx: '0x0', rcx: '0x0', rsp: '0x7FFF0000' },
      openFiles: ['/dev/stdin', '/dev/stdout'],
      createdAt: currentTick,
      children: [],
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="font-bold text-base text-white">Create New Process</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-300 mb-1">Process Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. worker_daemon"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100"
            />
          </div>
          <div>
            <label className="block text-slate-300 mb-1">Parent PID (PPID)</label>
            <select
              value={ppid}
              onChange={e => setPpid(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100"
            >
              {processes.filter(p => p.state !== 'terminated').map(p => (
                <option key={p.pid} value={p.pid}>PID {p.pid} — {p.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1">Burst Time</label>
              <input
                type="number"
                min={1}
                value={burst}
                onChange={e => setBurst(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Priority (1 = high)</label>
              <input
                type="number"
                min={1}
                max={10}
                value={priority}
                onChange={e => setPriority(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100"
              />
            </div>
          </div>
          <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300">Cancel</button>
            <button type="submit" className="px-4 py-1.5 rounded-lg bg-cyan-600 text-white font-semibold">Spawn Process</button>
          </div>
        </form>
      </div>
    </div>
  );
}
