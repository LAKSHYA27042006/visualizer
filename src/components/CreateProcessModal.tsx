import React, { useState } from 'react';
import { X, Plus, Terminal, AlertCircle } from 'lucide-react';
import { useProcess } from '../context/ProcessContext';

interface CreateProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateProcessModal: React.FC<CreateProcessModalProps> = ({ isOpen, onClose }) => {
  const { processes, createProcess, currentTick } = useProcess();

  const [name, setName] = useState('');
  const [ppid, setPpid] = useState<number>(1);
  const [priority, setPriority] = useState<number>(3);
  const [burstTime, setBurstTime] = useState<number>(8);
  const [memoryMB, setMemoryMB] = useState<number>(24);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeParents = processes.filter(p => p.state !== 'terminated');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Process name cannot be empty');
      return;
    }
    if (burstTime <= 0) {
      setError('Burst time must be greater than 0');
      return;
    }

    createProcess({
      name: name.trim(),
      ppid,
      priority,
      burstTime,
      arrivalTime: currentTick,
      memoryMB,
    });

    onClose();
    setName('');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-base text-white">Create New Process</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded bg-red-950/40 border border-red-800/40 text-red-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Process Name */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Command / Process Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g., node_server, worker_thread, gcc"
              value={name}
              onChange={e => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Parent Process (PPID) */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Parent Process (PPID)
            </label>
            <select
              value={ppid}
              onChange={e => setPpid(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
            >
              {activeParents.map(p => (
                <option key={p.pid} value={p.pid}>
                  PID {p.pid} — {p.name} (Prio {p.priority})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Priority */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Priority (1 = Highest)
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={priority}
                onChange={e => setPriority(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Burst Time */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                CPU Burst (Ticks)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={burstTime}
                onChange={e => setBurstTime(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Memory */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Initial Memory Allocation (MB)
            </label>
            <input
              type="number"
              min={4}
              max={1024}
              value={memoryMB}
              onChange={e => setMemoryMB(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition flex items-center space-x-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Spawn Process</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
