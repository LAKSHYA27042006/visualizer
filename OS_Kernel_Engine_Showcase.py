"""
================================================================================
OPERATING SYSTEMS PROJECT: PROCESS MANAGEMENT & FORK TREE VISUALIZER
Core OS Kernel Simulation Engine (Presentation Showcase)
Authors: Ajitesh Mohan
Architecture: PCB, fork() Syscall, CPU Scheduler (Round-Robin & Priority), Context Switching
================================================================================
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
import time

# ----------------------------------------------------------------------
# 1. PROCESS CONTROL BLOCK (PCB)
# ----------------------------------------------------------------------
@dataclass
class ProcessControlBlock:
    pid: int
    ppid: int
    name: str
    state: str = "READY"          # NEW, READY, RUNNING, WAITING, TERMINATED
    priority: int = 5             # 1 (Highest) to 10 (Lowest)
    cpu_burst: int = 10           # Remaining CPU execution ticks
    total_burst: int = 10         # Initial burst time
    memory_mb: int = 32           # Virtual memory footprint in MB
    children: List[int] = field(default_factory=list)
    
    # Simulated Hardware CPU Registers
    pc: str = "0x00400000"        # Program Counter
    sp: str = "0x7ffd0000"        # Stack Pointer
    rax: str = "0x00000000"       # Accumulator Register
    rip: str = "0x00401000"       # Instruction Pointer


# ----------------------------------------------------------------------
# 2. OS KERNEL ENGINE
# ----------------------------------------------------------------------
class OSKernel:
    def __init__(self, quantum: int = 4):
        self.process_table: Dict[int, ProcessControlBlock] = {}
        self.next_pid: int = 100
        self.tick: int = 0
        self.quantum: int = quantum
        self.quantum_remaining: int = quantum
        self.current_running: Optional[int] = None
        self._boot()

    def _boot(self):
        """Kernel bootstrap: Spawn PID 1 (systemd / init)."""
        init = ProcessControlBlock(pid=1, ppid=0, name="systemd", state="RUNNING", priority=10, cpu_burst=999)
        self.process_table[1] = init
        self.current_running = 1

    def fork(self, parent_pid: int, name: str, priority: int = 5, burst: int = 8) -> int:
        """POSIX fork() simulation: Allocates PID, copies context, links parent/child."""
        if parent_pid not in self.process_table:
            raise ValueError(f"Parent PID {parent_pid} does not exist.")
        
        self.next_pid += 1
        child_pid = self.next_pid
        
        child_pcb = ProcessControlBlock(
            pid=child_pid,
            ppid=parent_pid,
            name=name,
            state="READY",
            priority=priority,
            cpu_burst=burst,
            total_burst=burst,
            pc=f"0x{0x00400000 + child_pid * 0x100:08x}",
            sp=f"0x{0x7ffd0000 + child_pid * 0x20:08x}"
        )
        
        self.process_table[child_pid] = child_pcb
        self.process_table[parent_pid].children.append(child_pid)
        return child_pid

    def schedule_next(self, algorithm: str = "ROUND_ROBIN"):
        """CPU Scheduler: Selects next process from the Ready Queue."""
        ready_queue = [p for p in self.process_table.values() if p.state == "READY"]
        if not ready_queue:
            return

        if algorithm == "PRIORITY":
            ready_queue.sort(key=lambda p: (p.priority, p.pid))
        else: # Round-Robin (FIFO based on arrival)
            ready_queue.sort(key=lambda p: p.pid)

        # Context Switch
        next_proc = ready_queue[0]
        next_proc.state = "RUNNING"
        self.current_running = next_proc.pid
        self.quantum_remaining = self.quantum

    def step(self, algorithm: str = "ROUND_ROBIN"):
        """Advances CPU clock by 1 tick: decrements burst, updates registers, checks preemption."""
        self.tick += 1
        curr = self.process_table.get(self.current_running)

        if curr and curr.state == "RUNNING" and curr.pid != 1:
            curr.cpu_burst -= 1
            # Advance CPU registers
            curr.pc = f"0x{(int(curr.pc, 16) + 4):08x}"
            curr.rax = f"0x{(self.tick * 2654435761 + curr.pid) & 0xFFFFFFFF:08x}"

            # Process completion check
            if curr.cpu_burst <= 0:
                curr.state = "TERMINATED"
                curr.memory_mb = 0
                self.current_running = None
                self.schedule_next(algorithm)
                return

            # Round-Robin Quantum Preemption check
            if algorithm == "ROUND_ROBIN":
                self.quantum_remaining -= 1
                if self.quantum_remaining <= 0:
                    curr.state = "READY"
                    self.current_running = None
                    self.schedule_next(algorithm)
        else:
            self.schedule_next(algorithm)

    def reap_zombies(self):
        """POSIX waitpid() simulation: Cleans terminated tasks & re-parents orphans to PID 1."""
        dead_pids = [pid for pid, p in self.process_table.items() if p.state == "TERMINATED"]
        for pid in dead_pids:
            # Re-parent orphaned children to PID 1 (init adoption)
            for child_pid in self.process_table[pid].children:
                if child_pid in self.process_table:
                    self.process_table[child_pid].ppid = 1
                    self.process_table[1].children.append(child_pid)
            del self.process_table[pid]


# ----------------------------------------------------------------------
# 3. DEMONSTRATION & VERIFICATION
# ----------------------------------------------------------------------
if __name__ == "__main__":
    kernel = OSKernel(quantum=2)
    print("=== Kernel Booted. Init PID 1 Online ===")
    
    # 1. Simulate process forking
    p1 = kernel.fork(parent_pid=1, name="web-server", priority=2, burst=4)
    p2 = kernel.fork(parent_pid=p1, name="worker-thread", priority=1, burst=3)
    
    print(f"Forked PID {p1} (web-server) and child PID {p2} (worker-thread)")
    
    # 2. Simulate 5 clock ticks
    for _ in range(5):
        kernel.step(algorithm="ROUND_ROBIN")
        running = kernel.process_table.get(kernel.current_running)
        print(f"Tick {kernel.tick}: Running PID {kernel.current_running} ({running.name if running else 'idle'}) | PC: {running.pc if running else '-'}")
