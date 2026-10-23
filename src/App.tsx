import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  GitFork,
  ListTree,
  Plus,
  Clock,
  Sparkles,
  Server,
} from 'lucide-react';
import { OSProvider, useOS, COLOR } from './context/OSContext';
import { OverviewDashboard } from './components/OverviewDashboard';
import { ForkTree } from './components/ForkTree';
import { ProcessManager } from './components/ProcessManager';
import { Inspector } from './components/Inspector';
import { CreateModal } from './components/CreateModal';
import { Eyebrow } from './components/Common';

const PAGES = [
  { path: '/dashboard', label: 'Overview', sub: 'Kernel at a glance', icon: LayoutDashboard },
  { path: '/fork-tree', label: 'Fork Tree', sub: '3D process lineage', icon: GitFork },
  { path: '/processes', label: 'Process Manager', sub: 'Process table & state flow', icon: ListTree },
];

function MainShell() {
  const { procs, tick, backendOnline, algorithm, quantum } = useOS();
  const [path, setPath] = useState<string>(() =>
    PAGES.some((p) => p.path === window.location.pathname) ? window.location.pathname : '/dashboard'
  );
  const [inspect, setInspect] = useState<number | null>(null);
  const [creating, setCreating] = useState<boolean>(false);

  const go = (p: string) => {
    window.history.pushState(null, '', p);
    setPath(p);
  };

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const active = procs.filter((p) => p.state !== 'TERMINATED').length;
  const page = PAGES.find((p) => p.path === path) || PAGES[0];
  const clock = `${String(Math.floor(tick / 3600)).padStart(2, '0')}:${String(
    Math.floor(tick / 60) % 60
  ).padStart(2, '0')}:${String(tick % 60).padStart(2, '0')}`;

  return (
    <>
      {/* Aurora Ambient Backdrop */}
      <div className="aurora">
        <div className="blob a" />
        <div className="blob b" />
        <div className="blob c" />
      </div>
      <div className="grain" />

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          minHeight: '100vh',
          padding: 14,
          gap: 14,
        }}
      >
        {/* Navigation Sidebar */}
        <aside
          className="glass"
          style={{
            width: 255,
            flexShrink: 0,
            padding: 20,
            position: 'sticky',
            top: 14,
            height: 'calc(100vh - 28px)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 14,
                display: 'grid',
                placeItems: 'center',
                color: '#fff',
                background: 'linear-gradient(135deg,#ff7a59,#ff5f8a 50%,#3b82f6)',
                boxShadow: '0 10px 24px -10px rgba(255,95,120,.8)',
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <div className="serif" style={{ fontSize: 21, fontWeight: 700, lineHeight: 1 }}>
                ProcViz
              </div>
              <div
                className="mono"
                style={{ fontSize: 9, color: 'var(--ink-3)', letterSpacing: '.14em', marginTop: 3 }}
              >
                OS LIFECYCLE · FORK TREE
              </div>
            </div>
          </div>

          <Eyebrow>Navigate</Eyebrow>
          <nav style={{ display: 'grid', gap: 6, marginTop: 10 }}>
            {PAGES.map(({ path: p, label, sub, icon: Icon }) => (
              <button
                key={p}
                onClick={() => go(p)}
                className={`nav-item ${path === p ? 'on' : ''}`}
              >
                <Icon size={18} />
                <span>
                  <div>{label}</div>
                  <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--ink-3)' }}>{sub}</div>
                </span>
              </button>
            ))}
          </nav>

          {/* Backend API Info Box */}
          <div
            style={{
              marginTop: 'auto',
              marginBottom: 10,
              padding: 12,
              borderRadius: 16,
              background: 'rgba(255,255,255,0.6)',
              border: '1px solid var(--edge)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Eyebrow>Backend</Eyebrow>
              <span
                className="dot"
                style={{
                  background: backendOnline ? '#10b981' : '#f59e0b',
                }}
              />
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>Django REST API</div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-2)' }}>
              {backendOnline ? 'http://127.0.0.1:8000' : 'Local Fallback Engine'}
            </div>
          </div>

          {/* Scheduler Summary Box */}
          <div
            style={{
              padding: 14,
              borderRadius: 18,
              background: 'linear-gradient(135deg,rgba(255,181,156,.45),rgba(159,212,255,.45))',
              border: '1px solid var(--edge)',
            }}
          >
            <Eyebrow>CPU Scheduler</Eyebrow>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>
              {algorithm === 'ROUND_ROBIN'
                ? 'Round-Robin'
                : algorithm === 'PRIORITY'
                ? 'Preemptive Priority'
                : 'First-Come First-Served'}
            </div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-2)' }}>
              {algorithm === 'ROUND_ROBIN' ? `quantum ${quantum} ticks` : 'priority-driven'} · 1 core
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main style={{ flex: 1, minWidth: 0, display: 'grid', gap: 14, alignContent: 'start' }}>
          {/* Header Bar */}
          <header
            className="glass"
            style={{
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'sticky',
              top: 14,
              zIndex: 30,
            }}
          >
            <div>
              <Eyebrow>{page.sub}</Eyebrow>
              <h1 className="serif" style={{ fontSize: 24, margin: 0, fontWeight: 700 }}>
                {page.label}
              </h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                className="chip mono"
                style={{ background: '#fff', border: '1px solid var(--hair)', fontSize: 11, padding: '6px 12px' }}
              >
                <Clock size={12} color="#3b82f6" />
                {clock} · t{tick}
              </span>

              <span
                className="chip mono"
                style={{ background: '#fff', border: '1px solid var(--hair)', fontSize: 11, padding: '6px 12px' }}
              >
                <span className="dot pulse" style={{ background: COLOR.READY, color: COLOR.READY }} />
                {active} alive
              </span>

              <button className="btn btn-primary" onClick={() => setCreating(true)}>
                <Plus size={14} />
                Spawn process
              </button>
            </div>
          </header>

          {/* Page Routing */}
          <div key={path}>
            {path === '/dashboard' && <OverviewDashboard />}
            {path === '/fork-tree' && <ForkTree onInspect={setInspect} inspecting={inspect} />}
            {path === '/processes' && (
              <ProcessManager onInspect={setInspect} openCreate={() => setCreating(true)} />
            )}
          </div>
        </main>
      </div>

      {/* PCB Inspector Slide-over */}
      {inspect !== null && <Inspector pid={inspect} onClose={() => setInspect(null)} />}

      {/* Spawn Process Modal */}
      {creating && <CreateModal onClose={() => setCreating(false)} />}
    </>
  );
}

export default function App() {
  return (
    <OSProvider>
      <MainShell />
    </OSProvider>
  );
}
