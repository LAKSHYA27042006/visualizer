import random
import time
from .models import Process, SimulationState, KernelLog


def log_event(level, message):
    log = KernelLog.objects.create(
        level=level,
        message=message,
        timestamp=time.time()
    )
    # keep last 100 logs
    if KernelLog.objects.count() > 120:
        old_ids = KernelLog.objects.values_list('id', flat=True).order_by('-id')[100:]
        KernelLog.objects.filter(id__in=list(old_ids)).delete()
    return log


def get_simulation_state():
    state = SimulationState.objects.first()
    if not state:
        state = SimulationState.objects.create(
            tick=0,
            algorithm='ROUND_ROBIN',
            quantum=4,
            quantum_remaining=4,
            is_running=False
        )
    return state


def seed_default_processes():
    Process.objects.all().delete()
    KernelLog.objects.all().delete()
    
    state = get_simulation_state()
    state.tick = 0
    state.quantum_remaining = state.quantum
    state.save()

    raw = [
        (1, 0, "systemd", "RUNNING", 10, 4, 12),
        (101, 1, "bash", "READY", 6, 8, 6),
        (102, 1, "web-server", "RUNNING", 8, 20, 128),
        (103, 1, "db-client", "WAITING", 7, 14, 64),
        (104, 102, "worker", "READY", 5, 10, 48),
        (105, 102, "worker", "WAITING", 5, 12, 48),
        (106, 101, "vim", "READY", 4, 6, 18),
        (107, 103, "pg-pool", "TERMINATED", 3, 0, 0),
        (108, 102, "cache-sync", "READY", 6, 7, 32),
    ]

    for pid, ppid, name, pstate, priority, cpu_burst, memory_mb in raw:
        Process.objects.create(
            pid=pid,
            ppid=ppid,
            name=name,
            state=pstate,
            priority=priority,
            cpu_burst=cpu_burst,
            total_burst=max(cpu_burst, 1),
            memory_mb=memory_mb,
            pc=f"0x{0x00400000 + pid * 0x100:08x}",
            sp=f"0x{0x7ffd0000 + pid * 0x20:08x}",
            rax=f"0x{(pid * 2654435761) & 0xffffffff:08x}",
            rbx=f"0x{(pid * 40503) & 0xffffffff:08x}",
            rcx=f"0x0000000{priority}",
            rdx=f"0x000000{memory_mb:02x}",
            rip=f"0x{0x00401000 + pid * 0x10:08x}",
        )

    log_event("INFO", "Kernel booted · PID 1 systemd online")
    log_event("INFO", "Initial process table populated with 9 baseline tasks")


def get_all_processes_data():
    if not Process.objects.exists():
        seed_default_processes()
        
    procs = list(Process.objects.all())
    
    # Build children map
    children_map = {}
    for p in procs:
        if p.ppid not in children_map:
            children_map[p.ppid] = []
        children_map[p.ppid].append(p.pid)
        
    return [p.to_dict(children_map) for p in procs]


def get_next_pid():
    max_p = Process.objects.order_by('-pid').first()
    if not max_p:
        return 1
    return max(max_p.pid + 1, 109)


def fork_process(ppid, name=None, priority=None, cpu_burst=None, memory_mb=None):
    parent = Process.objects.filter(pid=ppid).first()
    new_pid = get_next_pid()
    
    if not name:
        if parent:
            base_name = parent.name.split('-')[0]
            name = f"{base_name}-{new_pid}"
        else:
            name = f"proc-{new_pid}"
            
    if priority is None:
        priority = parent.priority if parent else 5
    priority = max(1, min(10, int(priority)))
    
    if cpu_burst is None:
        cpu_burst = random.randint(3, 16)
    cpu_burst = max(1, int(cpu_burst))
    
    if memory_mb is None:
        memory_mb = random.randint(12, 64)
    memory_mb = max(1, int(memory_mb))

    child = Process.objects.create(
        pid=new_pid,
        ppid=ppid,
        name=name,
        state='READY',
        priority=priority,
        cpu_burst=cpu_burst,
        total_burst=cpu_burst,
        memory_mb=memory_mb,
        pc=f"0x{0x00400000 + new_pid * 0x100:08x}",
        sp=f"0x{0x7ffd0000 + new_pid * 0x20:08x}",
        rax=f"0x{(new_pid * 2654435761) & 0xffffffff:08x}",
        rbx=f"0x{(new_pid * 40503) & 0xffffffff:08x}",
        rcx=f"0x0000000{priority}",
        rdx=f"0x000000{memory_mb:02x}",
        rip=f"0x{0x00401000 + new_pid * 0x10:08x}",
    )

    log_event("INFO", f"PID {new_pid} ({name}) forked from parent PID {ppid}")
    return child


def update_process_state(pid, new_state):
    proc = Process.objects.filter(pid=pid).first()
    if not proc:
        return None, "Process not found"
        
    old_state = proc.state
    if old_state == new_state:
        return proc, "State unchanged"
        
    proc.state = new_state
    if new_state == 'TERMINATED':
        proc.memory_mb = 0
        lvl = "ERROR"
    elif new_state == 'WAITING':
        lvl = "WARN"
    else:
        lvl = "INFO"
        
    proc.save()
    log_event(lvl, f"PID {pid} state transitioned: {old_state} → {new_state}")
    return proc, None


def terminate_process(pid):
    if pid == 1:
        log_event("WARN", "Refused SIGTERM to PID 1 (init / systemd)")
        return False, "Cannot terminate init process (PID 1)"
        
    proc = Process.objects.filter(pid=pid).first()
    if not proc:
        return False, "Process not found"
        
    proc.state = 'TERMINATED'
    proc.memory_mb = 0
    proc.save()
    
    log_event("ERROR", f"SIGTERM delivered to PID {pid} ({proc.name})")
    return True, None


def reap_terminated_processes():
    dead = list(Process.objects.filter(state='TERMINATED').values_list('pid', flat=True))
    if not dead:
        return 0
        
    count = len(dead)
    
    # Re-parent orphaned active children of dead processes to PID 1
    Process.objects.filter(ppid__in=dead).update(ppid=1)
    
    # Remove dead processes
    Process.objects.filter(pid__in=dead).delete()
    
    log_event("INFO", f"Reaped {count} zombie / terminated process(es) · orphans re-parented to PID 1")
    return count


def step_simulation():
    state = get_simulation_state()
    state.tick += 1
    tick = state.tick

    # Gather alive processes
    alive = Process.objects.exclude(state='TERMINATED')
    running = alive.filter(state='RUNNING', pid__gt=1).first() or alive.filter(state='RUNNING').first()
    
    ready_queue = list(alive.filter(state='READY'))
    
    # Sort ready queue by algorithm
    if state.algorithm == 'PRIORITY':
        ready_queue.sort(key=lambda p: -p.priority)
    else:
        # Round Robin or FCFS by PID/created
        ready_queue.sort(key=lambda p: p.pid)

    context_switch_occurred = False

    if running:
        # Execute one tick on running process
        running.cpu_burst = max(0, running.cpu_burst - 1)
        
        # Advance registers
        try:
            curr_pc = int(running.pc, 16)
        except Exception:
            curr_pc = 0x00400000
        running.pc = f"0x{(curr_pc + 4) & 0xffffffff:08x}"
        running.rip = f"0x{(curr_pc + 8) & 0xffffffff:08x}"
        running.rax = f"0x{((tick * 2654435761) ^ running.pid) & 0xffffffff:08x}"

        if running.cpu_burst <= 0:
            running.state = 'TERMINATED'
            running.memory_mb = 0
            running.save()
            log_event("ERROR", f"PID {running.pid} ({running.name}) completed execution → TERMINATED")
            running = None
            context_switch_occurred = True
        elif state.algorithm == 'ROUND_ROBIN':
            state.quantum_remaining -= 1
            if state.quantum_remaining <= 0:
                # Time quantum expired
                if ready_queue:
                    running.state = 'READY'
                    running.save()
                    log_event("INFO", f"Timer quantum expired for PID {running.pid} → preempted to READY")
                    running = None
                    context_switch_occurred = True
                state.quantum_remaining = state.quantum
        elif state.algorithm == 'PRIORITY':
            # Preemptive priority check
            if ready_queue and ready_queue[0].priority > running.priority:
                running.state = 'READY'
                running.save()
                log_event("INFO", f"Higher priority PID {ready_queue[0].pid} (p{ready_queue[0].priority}) preempted PID {running.pid} (p{running.priority})")
                running = None
                context_switch_occurred = True
        else:
            running.save()

    # If CPU core is idle, dispatch next ready process
    if not running and ready_queue:
        next_proc = ready_queue[0]
        next_proc.state = 'RUNNING'
        next_proc.save()
        running = next_proc
        state.quantum_remaining = state.quantum
        log_event("INFO", f"CPU Dispatcher scheduled PID {next_proc.pid} ({next_proc.name}) to core 0")

    # Randomly transition waiting processes when I/O completes (every few ticks)
    waiting_procs = list(alive.filter(state='WAITING'))
    if waiting_procs and (tick % 5 == 0):
        io_proc = random.choice(waiting_procs)
        io_proc.state = 'READY'
        io_proc.save()
        log_event("SUCCESS", f"I/O operation completed for PID {io_proc.pid} ({io_proc.name}) → READY")

    state.save()
    return state


def calculate_cpu_scheduling(algorithm, processes, quantum=3):
    """
    Simulates CPU scheduling algorithms (FCFS, SJF, SRTF, RR, Priority)
    and computes Gantt chart timeline slices and metrics (TAT, WT, CT).
    """
    if not processes:
        return {'timeline': [], 'results': [], 'avgTAT': 0, 'avgWT': 0, 'cpuUtilization': 0}

    proc_list = [
        {
            'pid': p.get('pid', i + 1),
            'name': p.get('name', f"P{i+1}"),
            'at': int(p.get('arrivalTime', 0)),
            'bt': int(p.get('burstTime', 1)),
            'rem': int(p.get('burstTime', 1)),
            'priority': int(p.get('priority', 5)),
            'color': p.get('color', '#38bdf8'),
        }
        for i, p in enumerate(processes)
    ]

    time = 0
    completed = 0
    n = len(proc_list)
    timeline = []
    finish_times = {}

    if algorithm == 'FCFS':
        proc_list.sort(key=lambda x: (x['at'], x['pid']))
        for p in proc_list:
            if time < p['at']:
                time = p['at']
            start = time
            time += p['bt']
            timeline.append({'pid': p['pid'], 'name': p['name'], 'start': start, 'end': time, 'color': p['color']})
            finish_times[p['pid']] = time

    elif algorithm == 'SJF':
        # Non-preemptive Shortest Job First
        while completed < n:
            available = [p for p in proc_list if p['at'] <= time and p['rem'] > 0]
            if not available:
                next_arr = min(p['at'] for p in proc_list if p['rem'] > 0)
                time = next_arr
                continue
            available.sort(key=lambda x: (x['bt'], x['at']))
            p = available[0]
            start = time
            time += p['bt']
            p['rem'] = 0
            completed += 1
            timeline.append({'pid': p['pid'], 'name': p['name'], 'start': start, 'end': time, 'color': p['color']})
            finish_times[p['pid']] = time

    elif algorithm == 'SRTF':
        # Preemptive Shortest Remaining Time First
        current_pid = None
        current_start = 0
        while completed < n:
            available = [p for p in proc_list if p['at'] <= time and p['rem'] > 0]
            if not available:
                if current_pid is not None:
                    p = next(x for x in proc_list if x['pid'] == current_pid)
                    timeline.append({'pid': p['pid'], 'name': p['name'], 'start': current_start, 'end': time, 'color': p['color']})
                    current_pid = None
                time += 1
                continue

            available.sort(key=lambda x: (x['rem'], x['at']))
            best = available[0]

            if current_pid != best['pid']:
                if current_pid is not None:
                    p = next(x for x in proc_list if x['pid'] == current_pid)
                    timeline.append({'pid': p['pid'], 'name': p['name'], 'start': current_start, 'end': time, 'color': p['color']})
                current_pid = best['pid']
                current_start = time

            best['rem'] -= 1
            time += 1

            if best['rem'] == 0:
                completed += 1
                finish_times[best['pid']] = time
                timeline.append({'pid': best['pid'], 'name': best['name'], 'start': current_start, 'end': time, 'color': best['color']})
                current_pid = None

    elif algorithm == 'RR':
        # Round Robin
        queue = []
        in_queue = set()
        proc_list.sort(key=lambda x: x['at'])

        # Find first arrival
        time = proc_list[0]['at']
        for p in proc_list:
            if p['at'] <= time and p['pid'] not in in_queue:
                queue.append(p)
                in_queue.add(p['pid'])

        while completed < n:
            if not queue:
                unstarted = [p for p in proc_list if p['rem'] > 0]
                if not unstarted:
                    break
                next_arr = min(p['at'] for p in unstarted)
                time = next_arr
                for p in proc_list:
                    if p['at'] <= time and p['pid'] not in in_queue and p['rem'] > 0:
                        queue.append(p)
                        in_queue.add(p['pid'])
                continue

            p = queue.pop(0)
            in_queue.remove(p['pid'])
            run_time = min(quantum, p['rem'])
            start = time
            time += run_time
            p['rem'] -= run_time
            timeline.append({'pid': p['pid'], 'name': p['name'], 'start': start, 'end': time, 'color': p['color']})

            # Add newly arrived processes during this quantum
            for other in proc_list:
                if other['at'] <= time and other['pid'] not in in_queue and other['rem'] > 0 and other['pid'] != p['pid']:
                    queue.append(other)
                    in_queue.add(other['pid'])

            if p['rem'] > 0:
                queue.append(p)
                in_queue.add(p['pid'])
            else:
                completed += 1
                finish_times[p['pid']] = time

    elif algorithm == 'PRIORITY':
        # Priority Scheduling (Lower priority number = higher priority)
        while completed < n:
            available = [p for p in proc_list if p['at'] <= time and p['rem'] > 0]
            if not available:
                next_arr = min(p['at'] for p in proc_list if p['rem'] > 0)
                time = next_arr
                continue
            available.sort(key=lambda x: (x['priority'], x['at']))
            p = available[0]
            start = time
            time += p['bt']
            p['rem'] = 0
            completed += 1
            timeline.append({'pid': p['pid'], 'name': p['name'], 'start': start, 'end': time, 'color': p['color']})
            finish_times[p['pid']] = time

    # Calculate metrics
    results = []
    total_tat = 0
    total_wt = 0
    for p in proc_list:
        ct = finish_times.get(p['pid'], p['at'] + p['bt'])
        tat = ct - p['at']
        wt = tat - p['bt']
        total_tat += tat
        total_wt += wt
        results.append({
            'pid': p['pid'],
            'name': p['name'],
            'arrivalTime': p['at'],
            'burstTime': p['bt'],
            'priority': p['priority'],
            'completionTime': ct,
            'turnaroundTime': tat,
            'waitingTime': wt,
            'color': p['color'],
        })

    total_busy = sum(p['bt'] for p in proc_list)
    cpu_util = round((total_busy / max(1, time)) * 100, 1)

    return {
        'timeline': timeline,
        'results': results,
        'avgTAT': round(total_tat / max(1, n), 2),
        'avgWT': round(total_wt / max(1, n), 2),
        'cpuUtilization': min(100, cpu_util),
        'totalTime': time,
    }

