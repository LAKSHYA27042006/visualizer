import React, { useState, useMemo, useRef } from 'react';
import { 
  GitFork, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw, 
  Trash2, 
  Plus, 
  Skull, 
  Activity, 
  Sliders, 
  FileCode, 
  HardDrive, 
  X,
  PlayCircle,
  PauseCircle,
  AlertTriangle
} from 'lucide-react';
import { useProcess } from '../context/ProcessContext';
import { calculateTreeLayout } from '../utils/treeLayout';
import { ProcessState } from '../types/process';

interface ForkTreeVisualizerProps {
  onOpenCreateModal: () => void;
}

export const ForkTreeVisualizer: React.FC<ForkTreeVisualizerProps> = ({ onOpenCreateModal }) => {
  const {
    processes,
    selectedPid,
    setSelectedPid,
    selectedProcess,
    forkProcess,
    terminateProcess,
    reapZombie,
    changeState,
    resetToDefault,
  } = useProcess();

  // Canvas zoom & pan state
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showDetailsDrawer, setShowDetailsDrawer] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);

  // Compute tree layout
  const layout = useMemo(() => {
    return calculateTreeLayout(processes, 1);
  }, [processes]);

  // Zoom handlers
  const handleZoomIn = () => setZoom(z => Math.min(1.8, z + 0.15));
  const handleZoomOut = () => setZoom(z => Math.max(0.5, z - 0.15));
  const handleFitView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Pan dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag when clicking canvas background, not nodes
    if ((e.target as HTMLElement).closest('.process-node')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // State colors
  const getStateColor = (state: ProcessState) => {
    switch (state) {
      case 'running':
        return {
          border: 'border-emerald-500/80',
          bg: 'bg-emerald-950/20',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          glow: 'shadow-[0_0_15px_rgba(16,185,129,0.2)]',
          dot: 'bg-emerald-400',
        };
      case 'ready':
        return {
          border: 'border-cyan-500/60',
          bg: 'bg-cyan-950/20',
          badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          glow: 'shadow-[0_0_15px_rgba(6,182,212,0.15)]',
          dot: 'bg-cyan-400',
        };
      case 'waiting':
        return {
          border: 'border-amber-500/60',
          bg: 'bg-amber-950/20',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          glow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]',
          dot: 'bg-amber-400',
        };
      case 'zombie':
        return {
          border: 'border-pink-500/80 animate-pulse',
          bg: 'bg-pink-950/30',
          badge: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
          glow: 'shadow-[0_0_20px_rgba(236,72,153,0.3)]',
          dot: 'bg-pink-400',
        };
      case 'terminated':
      default:
        return {
          border: 'border-slate-700',
          bg: 'bg-slate-900/50',
          badge: 'bg-slate-800 text-slate-400 border-slate-700',
          glow: '',
          dot: 'bg-slate-500',
        };
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[600px] border border-slate-800 rounded-xl overflow-hidden bg-[#080d1a] relative select-none">
      {/* Top Toolbar */}
      <div className="bg-[#0f172a]/95 backdrop-blur border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 z-20">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <GitFork className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-sm text-white">Fork Tree Canvas</span>
          </div>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            Active Nodes: {layout.nodes.length}
          </span>
        </div>

        {/* Tree Canvas Controls */}
        <div className="flex items-center space-x-2">
          {/* Zoom & Fit controls */}
          <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={handleZoomIn}
              title="Zoom In"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-[11px] font-mono text-slate-400 min-w-[42px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleFitView}
              title="Reset View"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action buttons on Selected Node */}
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
                  <span>Reap Zombie</span>
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

          <button
            onClick={resetToDefault}
            title="Reset Tree"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg border border-slate-800"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setShowDetailsDrawer(prev => !prev)}
            className={`p-1.5 rounded-lg border text-xs font-medium transition ${
              showDetailsDrawer
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
            title="Toggle Process Details Panel"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas + Slide Drawer Container */}
      <div className="flex-1 relative overflow-hidden flex">
        {/* Interactive SVG & DOM Canvas */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className={`flex-1 h-full overflow-hidden relative cursor-grab bg-grid-pattern ${
            isDragging ? 'cursor-grabbing' : ''
          }`}
        >
          {/* Canvas Transform Wrapper */}
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'top center',
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
              width: `${Math.max(layout.width, 1000)}px`,
              height: `${Math.max(layout.height, 800)}px`,
              position: 'relative',
              margin: '0 auto',
            }}
          >
            {/* SVG Connecting Bézier Curves */}
            <svg
              className="absolute inset-0 pointer-events-none"
              style={{
                width: '100%',
                height: '100%',
              }}
            >
              <defs>
                <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.4" />
                </linearGradient>
              </defs>

              {layout.links.map(link => {
                const dy = link.toY - link.fromY;
                const pathD = `M ${link.fromX} ${link.fromY} C ${link.fromX} ${
                  link.fromY + dy * 0.5
                }, ${link.toX} ${link.toY - dy * 0.5}, ${link.toX} ${link.toY}`;

                const isChildSelected = selectedPid === link.toPid;
                const isParentSelected = selectedPid === link.fromPid;

                return (
                  <g key={link.id}>
                    {/* Shadow glow */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={isChildSelected || isParentSelected ? '#38bdf8' : '#1e293b'}
                      strokeWidth={isChildSelected || isParentSelected ? 3 : 2}
                      strokeOpacity={isChildSelected || isParentSelected ? 0.9 : 0.6}
                    />
                    {/* Direction arrow / dot */}
                    <circle
                      cx={link.toX}
                      cy={link.toY}
                      r={3}
                      fill={isChildSelected ? '#38bdf8' : '#0ea5e9'}
                    />
                  </g>
                );
              })}
            </svg>

            {/* DOM Nodes */}
            {layout.nodes.map(node => {
              const pcb = node.pcb;
              const isSelected = selectedPid === pcb.pid;
              const style = getStateColor(pcb.state);

              return (
                <div
                  key={pcb.pid}
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedPid(pcb.pid);
                  }}
                  className={`process-node absolute rounded-xl p-3 border cursor-pointer transition-all duration-200 ${
                    style.border
                  } ${style.bg} ${style.glow} ${
                    isSelected ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#080d1a] scale-105 z-10' : 'hover:scale-[1.02]'
                  }`}
                  style={{
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    width: `${node.width}px`,
                    minHeight: `${node.height}px`,
                    backgroundColor: '#0f172a',
                  }}
                >
                  {/* Top Bar: PID & PPID */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                      <span className="font-mono text-xs font-bold text-white">PID: {pcb.pid}</span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-400">
                      PPID: {pcb.ppid}
                    </span>
                  </div>

                  {/* Process Name */}
                  <div className="mt-1.5">
                    <p className="font-medium text-xs text-cyan-200 truncate" title={pcb.name}>
                      {pcb.name}
                    </p>
                  </div>

                  {/* Badges: State & Priority */}
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className={`px-2 py-0.5 rounded-full border uppercase font-mono font-medium ${style.badge}`}>
                      {pcb.state}
                    </span>
                    <span className="text-slate-400 font-mono">
                      Prio {pcb.priority}
                    </span>
                  </div>

                  {/* Burst Progress Bar */}
                  {pcb.state !== 'terminated' && pcb.state !== 'zombie' && (
                    <div className="mt-2">
                      <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                        <div
                          className="bg-cyan-500 h-1 rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              ((pcb.burstTime - pcb.remainingTime) / pcb.burstTime) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Orphan notice badge */}
                  {pcb.isOrphan && (
                    <div className="mt-1.5 flex items-center space-x-1 text-[10px] text-amber-400 font-mono">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Orphaned (rep. init)</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Process Details Drawer */}
        {showDetailsDrawer && (
          <aside className="w-80 md:w-96 border-l border-slate-800 bg-[#0f172a]/95 backdrop-blur-md flex flex-col z-20 shadow-2xl overflow-y-auto">
            {selectedProcess ? (
              <div className="p-4 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider">
                      Process Control Block (PCB)
                    </span>
                    <h3 className="font-bold text-base text-white truncate max-w-[200px]">
                      {selectedProcess.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowDetailsDrawer(false)}
                    className="p-1 text-slate-400 hover:text-white rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* State selector & Quick actions */}
                <div className="bg-slate-900 rounded-lg p-3 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Current State:</span>
                    <span className="font-mono uppercase font-semibold text-cyan-300">
                      {selectedProcess.state}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5 pt-1">
                    <button
                      onClick={() => changeState(selectedProcess.pid, 'running')}
                      disabled={selectedProcess.state === 'running' || selectedProcess.state === 'terminated'}
                      className="flex-1 py-1 px-2 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[11px] disabled:opacity-30 transition"
                    >
                      Run
                    </button>
                    <button
                      onClick={() => changeState(selectedProcess.pid, 'ready')}
                      disabled={selectedProcess.state === 'ready' || selectedProcess.state === 'terminated'}
                      className="flex-1 py-1 px-2 rounded bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-[11px] disabled:opacity-30 transition"
                    >
                      Ready
                    </button>
                    <button
                      onClick={() => changeState(selectedProcess.pid, 'waiting')}
                      disabled={selectedProcess.state === 'waiting' || selectedProcess.state === 'terminated'}
                      className="flex-1 py-1 px-2 rounded bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-[11px] disabled:opacity-30 transition"
                    >
                      Wait/IO
                    </button>
                  </div>
                </div>

                {/* Core PCB Attributes */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Kernel Descriptors
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                      <span className="text-slate-500">PID</span>
                      <p className="font-mono font-bold text-white text-sm">{selectedProcess.pid}</p>
                    </div>
                    <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                      <span className="text-slate-500">Parent PID (PPID)</span>
                      <p className="font-mono font-bold text-cyan-400 text-sm">{selectedProcess.ppid}</p>
                    </div>
                    <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                      <span className="text-slate-500">Scheduling Priority</span>
                      <p className="font-mono text-slate-200">Level {selectedProcess.priority}</p>
                    </div>
                    <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                      <span className="text-slate-500">Memory Allocation</span>
                      <p className="font-mono text-slate-200">{selectedProcess.memoryMB} MB</p>
                    </div>
                    <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                      <span className="text-slate-500">Burst Time</span>
                      <p className="font-mono text-slate-200">{selectedProcess.burstTime} ticks</p>
                    </div>
                    <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                      <span className="text-slate-500">Remaining</span>
                      <p className="font-mono text-amber-400">{selectedProcess.remainingTime} ticks</p>
                    </div>
                  </div>
                </div>

                {/* CPU Hardware Registers & Program Counter */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                      <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                      <span>CPU Registers & PC</span>
                    </h4>
                    <span className="text-[10px] text-slate-500 font-mono">Saved Context</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Program Counter (PC):</span>
                      <span className="text-cyan-400">{selectedProcess.programCounter}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 border-t border-slate-800/80">
                      <div className="flex justify-between">
                        <span className="text-slate-500">RAX:</span>
                        <span className="text-slate-300">{selectedProcess.registers.rax}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">RBX:</span>
                        <span className="text-slate-300">{selectedProcess.registers.rbx}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">RCX:</span>
                        <span className="text-slate-300">{selectedProcess.registers.rcx}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">RSP:</span>
                        <span className="text-slate-300">{selectedProcess.registers.rsp}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Open File Descriptors */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                    <span>Open File Descriptors (FD Table)</span>
                  </h4>
                  <div className="bg-slate-900 rounded-lg p-2.5 border border-slate-800 text-xs font-mono space-y-1">
                    {selectedProcess.openFiles.length === 0 ? (
                      <span className="text-slate-500">No open file descriptors.</span>
                    ) : (
                      selectedProcess.openFiles.map((fd, i) => (
                        <div key={i} className="flex items-center space-x-2 text-slate-300">
                          <span className="text-cyan-500">[{i}]</span>
                          <span className="truncate">{fd}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Children list */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Child Processes ({selectedProcess.children.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProcess.children.length === 0 ? (
                      <span className="text-xs text-slate-500">Leaf node (no children)</span>
                    ) : (
                      selectedProcess.children.map(childPid => (
                        <button
                          key={childPid}
                          onClick={() => setSelectedPid(childPid)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-mono"
                        >
                          PID {childPid}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <button
                    onClick={() => forkProcess(selectedProcess.pid)}
                    className="w-full py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs flex items-center justify-center space-x-1.5 transition shadow-sm"
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
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                <Sliders className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">Click on any process node to inspect its Process Control Block (PCB).</p>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
};
