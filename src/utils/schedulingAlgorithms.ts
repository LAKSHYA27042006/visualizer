import { SchedulingAlgorithm, SchedulingProcessInput, GanttBlock, ProcessMetrics, SimulationSummary } from '../types/process';

export function runSchedulingSimulation(
  algorithm: SchedulingAlgorithm,
  processes: SchedulingProcessInput[],
  timeQuantum: number = 2
): SimulationSummary {
  if (processes.length === 0) {
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

  // Deep clone to avoid mutating input
  const procList = processes.map(p => ({
    ...p,
    remainingTime: p.burstTime,
    completionTime: 0,
    firstResponseTime: -1,
  }));

  const rawGantt: { pid: number | 'IDLE'; time: number }[] = [];
  let currentTime = 0;
  const n = procList.length;
  let completed = 0;

  if (algorithm === 'FCFS') {
    // Sort by arrival time, then PID
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
    // Non-preemptive Shortest Job First
    while (completed < n) {
      const available = procList.filter(p => p.arrivalTime <= currentTime && p.remainingTime > 0);

      if (available.length === 0) {
        rawGantt.push({ pid: 'IDLE', time: currentTime });
        currentTime++;
        continue;
      }

      // Pick shortest burst time
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
    // Preemptive Shortest Remaining Time First
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

      if (chosen.firstResponseTime === -1) {
        chosen.firstResponseTime = currentTime;
      }

      rawGantt.push({ pid: chosen.pid, time: currentTime });
      chosen.remainingTime--;
      currentTime++;

      if (chosen.remainingTime === 0) {
        chosen.completionTime = currentTime;
        completed++;
      }
    }
  } else if (algorithm === 'RR') {
    // Round Robin with Time Quantum
    const queue: typeof procList = [];
    const inQueue = new Set<number>();
    let time = 0;
    const q = Math.max(1, timeQuantum);

    const checkArrivals = (t: number) => {
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

      const current = queue.shift()!;
      inQueue.delete(current.pid);

      if (current.firstResponseTime === -1) {
        current.firstResponseTime = time;
      }

      const execDuration = Math.min(q, current.remainingTime);
      for (let i = 0; i < execDuration; i++) {
        rawGantt.push({ pid: current.pid, time: time + i });
        // Check arrivals occurring strictly during this step
        checkArrivals(time + i + 1);
      }

      time += execDuration;
      current.remainingTime -= execDuration;

      if (current.remainingTime === 0) {
        current.completionTime = time;
        completed++;
      } else {
        // Re-add to back of queue
        checkArrivals(time);
        queue.push(current);
        inQueue.add(current.pid);
      }
    }
    currentTime = time;
  } else if (algorithm === 'PRIORITY') {
    // Non-preemptive Priority (Lower number = Higher Priority)
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
    // Preemptive Priority
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

      if (chosen.firstResponseTime === -1) {
        chosen.firstResponseTime = currentTime;
      }

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
  const ganttChart: GanttBlock[] = [];
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

  // Calculate metrics
  const processMetrics: ProcessMetrics[] = procList.map(p => {
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
