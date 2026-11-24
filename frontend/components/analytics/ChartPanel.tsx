'use client';

import React from 'react';

interface ChartPanelProps {
  title: string;
  subtitle?: string;
  type?: 'line' | 'bar';
  data: { label: string; value: number }[];
  accentColor?: string;
  className?: string;
}

export function ChartPanel({
  title,
  subtitle,
  type = 'line',
  data,
  accentColor = 'var(--primary-blue)',
  className = '',
}: ChartPanelProps) {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.value), 10);
  const width = 500;
  const height = 180;
  const padding = { top: 20, right: 20, bottom: 30, left: 35 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Points for line chart
  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1 || 1)) * chartWidth;
    const y = padding.top + chartHeight - (d.value / maxValue) * chartHeight;
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = points.length > 0 
    ? `${pathD} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`
    : '';

  return (
    <div className={`p-5 rounded-2xl tactile-raised-sm select-none ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-[var(--text-primary)]">
            {title}
          </h4>
          {subtitle && (
            <p className="text-[11px] font-mono text-[var(--text-secondary)] mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="w-full overflow-hidden">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-44 overflow-visible"
        >
          {/* Horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = padding.top + chartHeight * (1 - pct);
            const val = Math.round(maxValue * pct);
            return (
              <g key={idx}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="var(--border)"
                  strokeDasharray="2 3"
                  strokeWidth="0.8"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="var(--text-muted)"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {type === 'line' ? (
            <>
              {/* Soft Area Gradient */}
              <defs>
                <linearGradient id={`grad-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accentColor} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={accentColor} stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d={areaD}
                fill={`url(#grad-${title.replace(/\s+/g, '')})`}
              />

              {/* Crisp Stroke Line */}
              <path
                d={pathD}
                fill="none"
                stroke={accentColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {points.map((p, idx) => (
                <circle
                  key={idx}
                  cx={p.x}
                  cy={p.y}
                  r="3.5"
                  fill="var(--bg-surface)"
                  stroke={accentColor}
                  strokeWidth="2"
                />
              ))}
            </>
          ) : (
            /* Bar Chart */
            points.map((p, idx) => {
              const barWidth = Math.max(12, (chartWidth / data.length) * 0.45);
              const barHeight = chartHeight - (p.y - padding.top);
              return (
                <rect
                  key={idx}
                  x={p.x - barWidth / 2}
                  y={p.y}
                  width={barWidth}
                  height={barHeight}
                  fill={accentColor}
                  rx="3"
                  className="opacity-90 hover:opacity-100 transition-opacity"
                />
              );
            })
          )}

          {/* X Axis Labels */}
          {points.map((p, idx) => (
            <text
              key={idx}
              x={p.x}
              y={height - 8}
              textAnchor="middle"
              fill="var(--text-secondary)"
              fontSize="9"
              fontFamily="monospace"
            >
              {p.label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}
