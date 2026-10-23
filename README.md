# Process Management and Fork Tree Visualizer

A full-stack, developer-grade Operating Systems simulation web application featuring a **Django REST API backend** and a **React + Three.js + Tailwind CSS frontend** styled with the **"Glass & Light" v2** aesthetic (aurora glow backdrops, frosted glass panels, coral-to-pink accents, serif typography, and real-time kernel telemetry).

---

## 🌟 Architecture & Highlights

### 1. Overview Dashboard
- **Live Kernel Snapshot:** Active tick clock timer, live status proportion bar across states, and total running tasks.
- **Dual Ring Gauges:** SVG animated radial progress rings for **Core 0 CPU load percentage** and **Memory allocation (MB / 1 GB)**.
- **Metric Cards with Sparklines:** Total processes, active child forks, CPU allocation %, and RAM consumption with dynamic SVG wave sparklines.
- **Active CPU Core #0 Card:** Real-time Process Control Block (PCB) state with live registers (`PC`, `SP`, `RAX`, `RIP`).
- **Scheduling Priority Queues:** Visual queues for **Ready** and **Waiting (Blocked)** tasks, sorted by priority.
- **Kernel Console (`dmesg -w`):** Streaming log buffer color-coded by severity (`[INFO]`, `[WARN]`, `[ERROR]`, `[SUCCESS]`) with clear functionality.
- **Simulation Control Bar:** Play/Pause auto-scheduler clock, step single tick, switch scheduling policies (Round Robin, Preemptive Priority, FCFS), adjust Time Quantum slider, and reset kernel state.

### 2. Fork Tree Visualizer
- **Dual Visual Modes (3D & 2D):**
  - **3D Interactive Canvas:** Built with Three.js, `@react-three/fiber`, and `@react-three/drei`.
    - Floating icosahedron glass crystals sized proportionally to allocated virtual memory.
    - Orbital glowing halo rings around currently `RUNNING` processes.
    - Animated traveling photon light pulses flowing along parent-to-child lineage edges.
    - Full 360° OrbitControls (drag to rotate, scroll to zoom, auto-orbit toggle).
    - Interactive 3D HTML hover cards with inline `Fork`, `State`, `Kill`, and `Inspect` triggers.
  - **2D Canvas / SVG Tree:**
    - Clean hierarchical layout with smooth cubic Bézier connectors (dashed red lines for `TERMINATED` zombie tasks).
    - Interactive frosted-glass process cards with state chips, priority bars, and quick action buttons.
    - Zoom In (+10%), Zoom Out (-10%), Zoom % indicator, and Fit/Reset View controls.
- **Process Control Block (PCB) Inspector Drawer:**
  - Slide-over panel detailing Parent PID (`PPID`), process state chip, static priority, remaining CPU burst, and RAM.
  - CPU hardware registers snapshot: `PC`, `SP`, `RAX`, `RBX`, `RCX`, `RDX`, and `RIP`.
  - Hierarchy list of active children PIDs.
  - Open File Descriptors table (`0: stdin`, `1: stdout`, `2: stderr`, sockets, and inter-process pipes).
  - Direct `Fork child` and `SIGTERM` action buttons.

### 3. Process Manager & State Flow Diagram
- **Interactive Process State Flow Diagram (OS 5-State Architecture):**
  - Models standard textbook OS process transitions:
    - `[NEW]` $\xrightarrow{\text{Admit}}$ `[READY]` $\xrightleftharpoons[\text{Timer Interrupt}]{\text{Dispatch}}$ `[RUNNING]` $\xrightarrow{\text{Exit}}$ `[TERMINATED]`
    - `[RUNNING]` $\xrightarrow{\text{I/O Wait}}$ `[WAITING]` $\xrightarrow{\text{I/O Completion}}$ `[READY]`
  - Real-time count badges inside each state container.
  - Interactive simulation triggers for each transition with animated feedback.
  - Educational explanation callouts explaining what the OS kernel does during each transition (PCB state save, register restoration, TLB, and interrupt handlers).
- **Process Table:**
  - Search by process name or PID.
  - Pill-shaped filter tabs (`ALL`, `RUNNING`, `READY`, `WAITING`, `TERMINATED`) with real-time count badges.
  - Inline lifecycle state dropdowns with instant sync to the Django backend.
  - Priority gradient bars (1–10) and CPU burst counters.
  - Quick action buttons for `Fork`, `Terminate (SIGTERM)`, and `Inspect (PCB)`.
  - Top action bar for **Reaping Terminated Zombies** (re-parenting orphans to PID 1) and **Resetting to Kernel Init**.
- **Spawn Process Modal (`fork() + execve()`):**
  - Validation for process names, parent PID selector, interactive priority slider, burst time, and RAM allocation.

### 4. CPU Scheduling Lab & Gantt Chart (New in `dev` branch)
- **Multi-Algorithm Simulation:** Support for FCFS, SJF (Non-preemptive), SRTF (Preemptive SJF), Round Robin (customizable time quantum), and Priority scheduling.
- **Interactive Gantt Chart Timeline:** Real-time visual timeline showing time slices, process execution intervals, and CPU idle blocks.
- **Detailed Mathematical Metrics:** Automatically computes Completion Time ($CT$), Turnaround Time ($TAT = CT - AT$), Waiting Time ($WT = TAT - BT$), and CPU Utilization.
- **Side-by-Side Algorithm Benchmark:** Benchmarks all 5 scheduling algorithms simultaneously on the same workload.
- **Workload Editor:** Add custom processes with arrival times, burst times, and priorities.


---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Backend** | Python 3, Django 6, Django REST Framework, django-cors-headers, SQLite |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Lucide React |
| **3D Graphics** | Three.js, `@react-three/fiber`, `@react-three/drei` |
| **Architecture** | REST API with optimistic UI updates & live synchronization |

---

## 🚀 How to Run the Application

### 1. Start the Django Backend Server
```bash
cd backend
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```
The Django REST API will be accessible at: `http://127.0.0.1:8000/api/`

Key API Endpoints:
- `GET /api/processes/` — List all processes with children PIDs and PCB registers
- `POST /api/processes/` — Spawn a new process (`fork() + exec()`)
- `POST /api/processes/<pid>/fork/` — Fork a child from a given PID
- `PATCH /api/processes/<pid>/state/` — Update lifecycle state (`READY`, `RUNNING`, `WAITING`, `TERMINATED`)
- `POST /api/processes/<pid>/terminate/` — Deliver `SIGTERM`
- `POST /api/processes/reap/` — Reap zombie processes & re-parent orphans to PID 1
- `POST /api/processes/reset/` — Reset kernel process table to init
- `GET /api/simulation/` — Get CPU load, queues, tick counter, and active core process
- `POST /api/simulation/step/` — Step single CPU scheduling tick
- `POST /api/simulation/config/` — Configure scheduler policy (`ROUND_ROBIN`, `PRIORITY`, `FCFS`) & quantum
- `GET /api/state-flow/` — 5-State lifecycle diagram data and transition definitions
- `GET /api/logs/` — Stream kernel `dmesg` logs

### 2. Start the React Frontend Application
```bash
# In the project root directory
npm install
npm run dev
```
The application will open at: `http://127.0.0.1:5173/`

---

## 📂 Project Directory Structure

```
process-management-visualizer/
├── backend/                        # Django REST API backend
│   ├── backend/                    # Project settings & URL routing
│   │   ├── settings.py             # Configured with CORS, REST Framework, SQLite
│   │   ├── urls.py                 # Root URL router
│   │   └── wsgi.py
│   ├── api/                        # API Application
│   │   ├── models.py               # Process, SimulationState, KernelLog
│   │   ├── services.py             # OS Scheduling engine & seed data
│   │   ├── views.py                # REST API views
│   │   └── urls.py                 # API endpoints
│   ├── manage.py
│   └── db.sqlite3                  # Persistent SQLite database
│
├── src/                            # React TypeScript frontend
│   ├── components/
│   │   ├── Common.tsx              # Glass panels, Ring gauges, Sparklines, StateChips
│   │   ├── OverviewDashboard.tsx   # Overview dashboard with rings, KPIs, queues, dmesg
│   │   ├── ForkTree.tsx            # 3D Three.js crystal canvas & 2D SVG tree
│   │   ├── ProcessManager.tsx      # Searchable table, lifecycle tabs, reap actions
│   │   ├── ProcessStateFlowDiagram.tsx # OS 5-State interactive lifecycle diagram
│   │   ├── Inspector.tsx           # PCB slide-over inspector drawer
│   │   └── CreateModal.tsx         # fork() + exec() spawn dialog
│   ├── context/
│   │   └── OSContext.tsx           # Global OS state provider & sync manager
│   ├── services/
│   │   └── api.ts                  # Typed Django API client
│   ├── App.tsx                     # Main navigation shell with aurora backdrop
│   ├── index.css                   # Glass & Light styling, aurora animations, typography
│   └── main.tsx
├── package.json
├── vite.config.js
└── README.md
```
