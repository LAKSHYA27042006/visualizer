import React from 'react';
import { COLOR, tint } from '../context/OSContext';

interface GlassProps extends React.HTMLAttributes<HTMLDivElement> {
  strong?: boolean;
  hover?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export const Glass: React.FC<GlassProps> = ({
  strong,
  hover,
  className = '',
  style,
  children,
  ...props
}) => (
  <div
    {...props}
    style={style}
    className={`glass ${strong ? 'glass-strong' : ''} ${hover ? 'glass-hover sheen' : ''} ${className}`}
  >
    {children}
  </div>
);

export const StateChip: React.FC<{ state: string }> = ({ state }) => {
  const color = COLOR[state] || '#8a93b2';
  return (
    <span
      className="chip mono"
      style={{
        background: tint(color, 0.12),
        color: color,
        border: `1px solid ${tint(color, 0.3)}`,
      }}
    >
      <span
        className={`dot ${state === 'RUNNING' ? 'pulse' : ''}`}
        style={{ background: color, color: color }}
      />
      {state}
    </span>
  );
};

export const Eyebrow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    className="mono"
    style={{
      fontSize: 10,
      letterSpacing: '.18em',
      textTransform: 'uppercase',
      color: 'var(--ink-3)',
      fontWeight: 600,
    }}
  >
    {children}
  </div>
);

export function Ring({
  value,
  color,
  size = 120,
  stroke = 10,
  children,
}: {
  value: number;
  color: string;
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id={`g${color.replace('#', '')}`} x1="0" x2="1">
            <stop offset="0" stopColor={color} />
            <stop offset="1" stopColor="#ff5f8a" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          className="ring-bg"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#g${color.replace('#', '')})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped / 100)}
          style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.2,.8,.2,1)' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function Spark({ seedN, color }: { seedN: number; color: string }) {
  const pts = Array.from(
    { length: 24 },
    (_, i) => 20 + 16 * Math.sin(i * 0.7 + seedN) + 8 * Math.sin(i * 1.9 + seedN * 2)
  );
  const d = pts.map((y, i) => `${i ? 'L' : 'M'}${(i / 23) * 100},${48 - y}`).join(' ');
  const gradId = `sp${color.replace('#', '')}`;

  return (
    <svg viewBox="0 0 100 48" preserveAspectRatio="none" style={{ width: '100%', height: 40 }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity=".35" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L100,48 L0,48 Z`} fill={`url(#${gradId})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
