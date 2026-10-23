import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { PCB, ProcessState } from '../types/process';

interface ProcessContextType {
  processes: PCB[];
  selectedPid: number | null;
  selectedProcess: PCB | null;
  currentTick: number;
  isSimulating: boolean;
  simulationSpeed: number; // ms per tick
  forkCount: number;
  contextSwitchCount: number;
  runningProcess: PCB | null;
  readyQueue: PCB[];
  waitingQueue: PCB[];
  terminatedList: PCB[];
  zombieCount: number;
  orphanCount: number;
  setSelectedPid: (pid: number | null) => void;
  forkProcess: (parentPid: number, customName?: string) => PCB | null;
  createProcess: (data: {
    name: string;
    ppid: number;
    priority: number;
    burstTime: number;
    arrivalTime?: number;
    memoryMB?: number;
  }) => PCB;
  terminateProcess: (pid: number, exitCode?: number) => void;
  reapZombie: (pid: number) => void;
  changeState: (pid: number, newState: ProcessState) => void;
  stepClock: () => void;
  toggleSimulation: () => void;
  setSimulationSpeed: (speed: number) => void;
  resetToDefault: () => void;
  killAllChildren: (parentPid: number) => void;
}

const INITIAL_PROCESSES: PCB[] = [
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

const ProcessContext = createContext<ProcessContextType | undefined>(undefined);

export const ProcessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [processes, setProcesses] = useState<PCB[]>(INITIAL_PROCESSES);
  const [selectedPid, setSelectedPid] = useState<number | null>(1);
  const [currentTick, setCurrentTick] = useState<number>(14);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1000);
  const [forkCount, setForkCount] = useState<number>(7);
  const [contextSwitchCount, setContextSwitchCount] = useState<number>(12);

  const selectedProcess = useMemo(() => {
    return processes.find(p => p.pid === selectedPid) || null;
  }, [processes, selectedPid]);

  const runningProcess = useMemo(() => {
    return processes.find(p => p.state === 'running') || null;
  }, [processes]);

  const readyQueue = useMemo(() => {
    return processes.filter(p => p.state === 'ready');
  }, [processes]);

  const waitingQueue = useMemo(() => {
    return processes.filter(p => p.state === 'waiting');
  }, [processes]);

  const terminatedList = useMemo(() => {
    return processes.filter(p => p.state === 'terminated');
  }, [processes]);

  const zombieCount = useMemo(() => {
    return processes.filter(p => p.state === 'zombie').length;
  }, [processes]);

  const orphanCount = useMemo(() => {
    return processes.filter(p => p.isOrphan).length;
  }, [processes]);

  const getNextPid = useCallback(() => {
    const existing = new Set(processes.map(p => p.pid));
    let next = 100;
    while (existing.has(next)) {
      next++;
    }
    return next;
  }, [processes]);

  // Fork a process: child duplicates parent's attributes, gets new PID, PPID = parent.PID
  const forkProcess = useCallback((parentPid: number, customName?: string): PCB | null => {
    let newChild: PCB | null = null;
    setProcesses(prev => {
      const parent = prev.find(p => p.pid === parentPid);
      if (!parent || parent.state === 'terminated' || parent.state === 'zombie') {
        return prev;
      }

      const nextPid = (() => {
        const existing = new Set(prev.map(p => p.pid));
        let candidate = Math.max(...prev.map(p => p.pid)) + 1;
        while (existing.has(candidate)) candidate++;
        return candidate;
      })();

      newChild = {
        pid: nextPid,
        ppid: parent.pid,
        name: customName || `fork_of_${parent.name.split(' ')[0]}_${nextPid}`,
        state: 'ready',
        priority: parent.priority,
        arrivalTime: currentTick,
        burstTime: Math.floor(Math.random() * 8) + 4,
        remainingTime: Math.floor(Math.random() * 8) + 4,
        memoryMB: Math.max(8, Math.round(parent.memoryMB * 0.8)),
        programCounter: parent.programCounter,
        registers: {
          rax: '0x00000000', // fork() returns 0 to child!
          rbx: parent.registers.rbx,
          rcx: parent.registers.rcx,
          rsp: parent.registers.rsp,
        },
        openFiles: [...parent.openFiles],
        createdAt: currentTick,
        children: [],
      };

      setForkCount(c => c + 1);

      // Add child to parent's children array
      return prev.map(p => {
        if (p.pid === parent.pid) {
          return {
            ...p,
            children: [...p.children, nextPid],
          };
        }
        return p;
      }).concat(newChild);
    });

    return newChild;
  }, [currentTick]);

  // Create an explicit new process
  const createProcess = useCallback((data: {
    name: string;
    ppid: number;
    priority: number;
    burstTime: number;
    arrivalTime?: number;
    memoryMB?: number;
  }): PCB => {
    const nextPid = getNextPid();
    const newProc: PCB = {
      pid: nextPid,
      ppid: data.ppid,
      name: data.name || `proc_${nextPid}`,
      state: 'ready',
      priority: data.priority || 5,
      arrivalTime: data.arrivalTime ?? currentTick,
      burstTime: data.burstTime || 6,
      remainingTime: data.burstTime || 6,
      memoryMB: data.memoryMB || 16,
      programCounter: '0x00401000',
      registers: {
        rax: '0x00000000',
        rbx: '0x00000000',
        rcx: '0x00000000',
        rsp: '0x7FFF0000',
      },
      openFiles: ['/dev/stdin', '/dev/stdout', '/dev/stderr'],
      createdAt: currentTick,
      children: [],
    };

    setProcesses(prev => {
      // If ppid exists, add as child
      const updated = prev.map(p => {
        if (p.pid === data.ppid) {
          return { ...p, children: [...p.children, nextPid] };
        }
        return p;
      });
      return [...updated, newProc];
    });

    return newProc;
  }, [getNextPid, currentTick]);

  // Terminate a process: if parent is still alive and has not reaped, becomes ZOMBIE.
  // If terminated process has children, children become ORPHANS and reparent to PID 1 (init)!
  const terminateProcess = useCallback((pid: number, exitCode: number = 0) => {
    setProcesses(prev => {
      const target = prev.find(p => p.pid === pid);
      if (!target || target.state === 'terminated') return prev;

      // Handle orphans: reparent all children of target to PID 1
      const childrenPids = target.children;
      let nextList = prev.map(p => {
        if (childrenPids.includes(p.pid)) {
          return { ...p, ppid: 1, isOrphan: true };
        }
        if (p.pid === 1) {
          return { ...p, children: Array.from(new Set([...p.children, ...childrenPids])) };
        }
        return p;
      });

      // Target transition: if parent is alive, become zombie; if parent terminated or init, can terminate
      const parent = prev.find(p => p.pid === target.ppid);
      const becomesZombie = parent && parent.state !== 'terminated';

      return nextList.map(p => {
        if (p.pid === pid) {
          return {
            ...p,
            state: becomesZombie ? 'zombie' : 'terminated',
            remainingTime: 0,
            exitCode,
            children: [],
          };
        }
        return p;
      });
    });
  }, []);

  // Reap a zombie process via simulated wait()/waitpid()
  const reapZombie = useCallback((pid: number) => {
    setProcesses(prev => {
      return prev.map(p => {
        if (p.pid === pid) {
          return { ...p, state: 'terminated' };
        }
        // Remove from parent's children
        if (p.children.includes(pid)) {
          return { ...p, children: p.children.filter(c => c !== pid) };
        }
        return p;
      });
    });
  }, []);

  // Change lifecycle state
  const changeState = useCallback((pid: number, newState: ProcessState) => {
    setProcesses(prev => {
      const target = prev.find(p => p.pid === pid);
      if (!target) return prev;

      // If moving to running, preempt currently running process to ready
      if (newState === 'running') {
        setContextSwitchCount(c => c + 1);
        return prev.map(p => {
          if (p.pid === pid) {
            return { ...p, state: 'running' };
          }
          if (p.state === 'running') {
            return { ...p, state: 'ready' };
          }
          return p;
        });
      }

      if (newState === 'terminated') {
        terminateProcess(pid, 0);
        return prev;
      }

      return prev.map(p => (p.pid === pid ? { ...p, state: newState } : p));
    });
  }, [terminateProcess]);

  // Kill all children of a parent
  const killAllChildren = useCallback((parentPid: number) => {
    setProcesses(prev => {
      const parent = prev.find(p => p.pid === parentPid);
      if (!parent || parent.children.length === 0) return prev;
      const childPids = new Set(parent.children);

      return prev.map(p => {
        if (childPids.has(p.pid)) {
          return { ...p, state: 'terminated', remainingTime: 0, exitCode: 137 };
        }
        if (p.pid === parentPid) {
          return { ...p, children: [] };
        }
        return p;
      });
    });
  }, []);

  // Step simulation clock 1 tick forward
  const stepClock = useCallback(() => {
    setCurrentTick(t => t + 1);

    setProcesses(prev => {
      let running = prev.find(p => p.state === 'running');
      let readyProcs = prev.filter(p => p.state === 'ready');

      // If running process finished burst
      if (running) {
        if (running.remainingTime <= 1) {
          // Finished!
          const nextRunning = readyProcs.length > 0 ? readyProcs[0] : null;
          if (nextRunning) setContextSwitchCount(c => c + 1);

          return prev.map(p => {
            if (p.pid === running!.pid) {
              return { ...p, state: 'terminated', remainingTime: 0, exitCode: 0 };
            }
            if (nextRunning && p.pid === nextRunning.pid) {
              return { ...p, state: 'running' };
            }
            return p;
          });
        } else {
          // Decrement burst
          return prev.map(p => {
            if (p.pid === running!.pid) {
              return { ...p, remainingTime: p.remainingTime - 1 };
            }
            return p;
          });
        }
      } else if (readyProcs.length > 0) {
        // Pick next ready process to run
        const next = readyProcs[0];
        setContextSwitchCount(c => c + 1);
        return prev.map(p => {
          if (p.pid === next.pid) {
            return { ...p, state: 'running' };
          }
          return p;
        });
      }

      return prev;
    });
  }, []);

  // Simulation timer loop
  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      stepClock();
    }, simulationSpeed);

    return () => clearInterval(interval);
  }, [isSimulating, simulationSpeed, stepClock]);

  const toggleSimulation = useCallback(() => {
    setIsSimulating(prev => !prev);
  }, []);

  const resetToDefault = useCallback(() => {
    setProcesses(INITIAL_PROCESSES);
    setSelectedPid(1);
    setCurrentTick(14);
    setIsSimulating(false);
    setForkCount(7);
    setContextSwitchCount(12);
  }, []);

  return (
    <ProcessContext.Provider
      value={{
        processes,
        selectedPid,
        selectedProcess,
        currentTick,
        isSimulating,
        simulationSpeed,
        forkCount,
        contextSwitchCount,
        runningProcess,
        readyQueue,
        waitingQueue,
        terminatedList,
        zombieCount,
        orphanCount,
        setSelectedPid,
        forkProcess,
        createProcess,
        terminateProcess,
        reapZombie,
        changeState,
        stepClock,
        toggleSimulation,
        setSimulationSpeed,
        resetToDefault,
        killAllChildren,
      }}
    >
      {children}
    </ProcessContext.Provider>
  );
};

export const useProcess = () => {
  const context = useContext(ProcessContext);
  if (!context) {
    throw new Error('useProcess must be used within a ProcessProvider');
  }
  return context;
};
