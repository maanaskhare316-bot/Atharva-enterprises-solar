import React, { useEffect, useState } from 'react';

interface PressureGaugeProps {
  value: number;
  min?: number;
  max?: number;
  label?: string;
}

function getArcColor(value: number): string {
  if (value >= 195) return '#10b981'; // emerald-500
  if (value >= 175) return '#f59e0b'; // amber-500
  return '#ef4444';                   // red-500
}

/**
 * Converts polar coordinates to SVG cartesian.
 * cx, cy = center; r = radius; angleDeg = angle in degrees (0=right, 90=bottom).
 */
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

/**
 * Build an SVG arc path descriptor for a semicircle gauge.
 * Gauge spans from 180° (left) to 0° (right) — i.e. the top half.
 */
function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

const PressureGauge: React.FC<PressureGaugeProps> = ({
  value,
  min = 0,
  max = 250,
  label = 'Pressure',
}) => {
  const [animatedPct, setAnimatedPct] = useState(0);

  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));

  useEffect(() => {
    // Animate on mount / value change
    const timeout = setTimeout(() => {
      setAnimatedPct(pct);
    }, 60);
    return () => clearTimeout(timeout);
  }, [pct]);

  const cx = 100;
  const cy = 90; // slightly above center so labels fit below
  const r = 70;

  // Gauge spans: 180° → 0° (left → right, top arc)
  // Map pct to an angle within [180, 0] (note: going counterclockwise in SVG convention)
  const startAngle = 180;
  const endAngle = 0;
  const sweepDeg = 180; // total arc span

  const filledEndAngle = startAngle - animatedPct * sweepDeg; // goes right as pct increases

  const trackPath = describeArc(cx, cy, r, endAngle, startAngle);       // full arc (gray)
  const fillPath = describeArc(cx, cy, r, filledEndAngle, startAngle); // filled portion

  const color = getArcColor(value);

  // Tick positions at 25%, 50%, 75%
  const ticks = [0.25, 0.5, 0.75];

  return (
    <div className="flex flex-col items-center">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      <svg viewBox="0 0 200 120" className="w-48 h-28" aria-label={`${label}: ${Math.round(value)} / ${max}`}>
        {/* Track */}
        <path
          d={trackPath}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={14}
          strokeLinecap="round"
        />

        {/* Filled arc — animated via CSS transition on stroke-dasharray trick via path change */}
        <path
          d={fillPath}
          fill="none"
          stroke={color}
          strokeWidth={14}
          strokeLinecap="round"
          style={{ transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />

        {/* Tick marks */}
        {ticks.map((t) => {
          const tickAngle = startAngle - t * sweepDeg;
          const inner = polarToCartesian(cx, cy, r - 10, tickAngle);
          const outer = polarToCartesian(cx, cy, r + 10, tickAngle);
          return (
            <line
              key={t}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="#cbd5e1"
              strokeWidth={1.5}
            />
          );
        })}

        {/* Center value */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          className="font-bold"
          style={{ fontSize: 22, fontWeight: 700, fill: color }}
        >
          {Math.round(value)}
        </text>
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          style={{ fontSize: 11, fill: '#94a3b8' }}
        >
          Bar
        </text>

        {/* Min / Max labels */}
        <text
          x={cx - r + 2}
          y={cy + 22}
          textAnchor="middle"
          style={{ fontSize: 10, fill: '#94a3b8' }}
        >
          {min}
        </text>
        <text
          x={cx + r - 2}
          y={cy + 22}
          textAnchor="middle"
          style={{ fontSize: 10, fill: '#94a3b8' }}
        >
          {max}
        </text>
      </svg>

      {/* Status label */}
      <span
        className="mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-full"
        style={{
          backgroundColor: color + '22',
          color,
        }}
      >
        {value >= 195 ? 'Good Pressure' : value >= 175 ? 'Moderate' : 'Low Pressure'}
      </span>
    </div>
  );
};

export default PressureGauge;
