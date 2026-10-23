import React from 'react';
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
  Activity
} from 'lucide-react';
import { useProcess } from '../context/ProcessContext';

export type ActivePage = 'dashboard' | 'forkTree' | 'processManager' | 'scheduling' | 'learn';

interface NavbarProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  onOpenCreateModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activePage, setActivePage, onOpenCreateModal }) => {
  const {
    currentTick,
    isSimulating,
    toggleSimulation,
    stepClock,
    resetToDefault,
    runningProcess,
    zombieCount,
  } = useProcess();

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: Activity },
    { id: 'forkTree', label: 'Fork Tree', icon: GitFork },
    { id: 'processManager', label: 'Process Table', icon: ListTree },
    { id: 'scheduling', label: 'CPU Scheduling', icon: CalendarClock },
    { id: 'learn', label: 'Learn OS / Syscalls', icon: BookOpen },
  ] as const;

  return (
    <header className="sticky top-0 z-40 bg-[#0b101b]/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand / Title */}
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
            <p className="text-xs text-slate-400 hidden sm:block">Process Lifecycle & Fork Tree Engine</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs font-medium">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.id === 'processManager' && zombieCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" title={`${zombieCount} Zombie processes`} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Global Simulation Controls */}
        <div className="flex items-center space-x-2.5">
          {/* Tick Counter */}
          <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg font-mono text-xs text-slate-300">
            <span className="text-slate-500">Tick:</span>
            <span className="font-bold text-cyan-400">{currentTick}</span>
          </div>

          {/* Running Process Indicator */}
          <div className="hidden lg:flex items-center space-x-1.5 bg-slate-900/60 border border-slate-800 px-2.5 py-1 rounded-lg text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">CPU:</span>
            <span className="font-mono text-emerald-400 truncate max-w-[100px]">
              {runningProcess ? `PID ${runningProcess.pid}` : 'IDLE'}
            </span>
          </div>

          {/* Simulation buttons */}
          <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
            <button
              onClick={toggleSimulation}
              title={isSimulating ? 'Pause Clock' : 'Start Clock Simulation'}
              className={`p-1.5 rounded transition ${
                isSimulating
                  ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
              }`}
            >
              {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={stepClock}
              title="Step +1 Tick"
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetToDefault}
              title="Reset Simulation"
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Create Process Button */}
          <button
            onClick={onOpenCreateModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-[0_0_12px_rgba(6,182,212,0.25)] transition"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Process</span>
          </button>
        </div>
      </div>
    </header>
  );
};
