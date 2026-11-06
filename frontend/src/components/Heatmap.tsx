"use client";

import { useState } from "react";
import { useWidth } from "./useWidth";

interface Props {
  xs: number[]; // columns
  ys: number[]; // rows (low at bottom)
  z: number[][]; // z[row][col]
  xFormat: (v: number) => string;
  yFormat: (v: number) => string;
  valueFormat: (v: number) => string;
  xTitle: string;
  yTitle: string;
  yScale?: "linear" | "log";
  marker?: { x: number; y: number; label: string };
  /** where the marker was before the last change */
  ghost?: { x: number; y: number } | null;
  ariaLabel: string;
  height?: number;
}

const M = { l: 64, r: 12, t: 12, b: 42 };
const BINS = 7;

/** fractional index of v within a sorted grid */
function fracIndex(grid: number[], v: number, log = false): number {
  const f = log ? Math.log : (n: number) => n;
  const a = f(grid[0]), b = f(grid[grid.length - 1]);
  return ((f(Math.min(Math.max(v, grid[0]), grid[grid.length - 1])) - a) / (b - a)) * (grid.length - 1);
}

export default function Heatmap({
  xs, ys, z, xFormat, yFormat, valueFormat, xTitle, yTitle, yScale = "linear", marker, ghost, ariaLabel, height = 300,
}: Props) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<[number, number] | null>(null);

  const max = Math.max(...z.flat(), 1e-9);
  // square-root shading so small-but-nonzero values stay distinguishable from zero
  const bin = (v: number) => Math.min(BINS - 1, Math.floor(Math.sqrt(Math.max(v, 0) / max) * BINS));

  const iw = width - M.l - M.r;
  const ih = height - M.t - M.b;
  const cw = iw / xs.length;
  const ch = ih / ys.length;
  const gap = 1;

  const tickCols = xs.map((_, i) => i).filter((i) => i % Math.ceil(xs.length / (width < 480 ? 3 : 5)) === 0);
  const tickRows = ys.map((_, i) => i).filter((i) => i % Math.ceil(ys.length / 5) === 0);

  const mx = marker ? M.l + (fracIndex(xs, marker.x) + 0.5) * cw : 0;
  const my = marker ? M.t + ih - (fracIndex(ys, marker.y, yScale === "log") + 0.5) * ch : 0;

  const gx = ghost ? M.l + (fracIndex(xs, ghost.x) + 0.5) * cw : 0;
  const gy = ghost ? M.t + ih - (fracIndex(ys, ghost.y, yScale === "log") + 0.5) * ch : 0;

  return (
    <div>
      <div ref={ref} className="relative" onMouseLeave={() => setHover(null)}>
        <svg width={width} height={height} role="img" aria-label={ariaLabel} className="block">
          {z.map((row, r) =>
            row.map((v, c) => (
              <rect
                key={`${r}-${c}`}
                x={M.l + c * cw + gap / 2}
                y={M.t + ih - (r + 1) * ch + gap / 2}
                width={Math.max(0, cw - gap)}
                height={Math.max(0, ch - gap)}
                rx={2}
                fill={`var(--seq-${bin(v)})`}
                stroke={hover && hover[0] === r && hover[1] === c ? "var(--ink)" : "none"}
                strokeWidth={1.5}
                onMouseEnter={() => setHover([r, c])}
              />
            )),
          )}
          {tickRows.map((r) => (
            <text key={r} x={M.l - 8} y={M.t + ih - (r + 0.5) * ch} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--ink-3)">{yFormat(ys[r])}</text>
          ))}
          {tickCols.map((c) => (
            <text key={c} x={M.l + (c + 0.5) * cw} y={M.t + ih + 16} textAnchor="middle" fontSize={11} fill="var(--ink-3)">{xFormat(xs[c])}</text>
          ))}
          <text x={M.l + iw / 2} y={height - 6} textAnchor="middle" fontSize={11} fill="var(--ink-2)">{xTitle}</text>
          <text transform={`translate(12 ${M.t + ih / 2}) rotate(-90)`} textAnchor="middle" fontSize={11} fill="var(--ink-2)">{yTitle}</text>
          {ghost && marker && (Math.abs(gx - mx) > 1 || Math.abs(gy - my) > 1) && (
            <g pointerEvents="none">
              <line x1={gx} y1={gy} x2={mx} y2={my} stroke="var(--ink)" strokeWidth={1} strokeDasharray="2 3" opacity={0.7} />
              <circle cx={gx} cy={gy} r={6} fill="none" stroke="var(--surface)" strokeWidth={4} />
              <circle cx={gx} cy={gy} r={6} fill="none" stroke="var(--ink)" strokeWidth={1.5} strokeDasharray="2 2" />
            </g>
          )}
          {marker && (
            <g pointerEvents="none">
              <circle cx={mx} cy={my} r={7} fill="none" stroke="var(--surface)" strokeWidth={4} />
              <circle cx={mx} cy={my} r={7} fill="none" stroke="var(--series-2)" strokeWidth={2.5} />
            </g>
          )}
        </svg>
        {hover && (
          <div
            className="pointer-events-none absolute z-10 rounded-md border border-axis bg-surface px-2.5 py-2 text-xs shadow-md"
            style={{
              top: Math.max(0, M.t + ih - (hover[0] + 1) * ch - 8),
              left: Math.min(width - 190, M.l + (hover[1] + 1) * cw + 8),
            }}
          >
            <div className="text-ink-2">{xTitle}: <span className="font-mono text-ink">{xFormat(xs[hover[1]])}</span></div>
            <div className="text-ink-2">{yTitle}: <span className="font-mono text-ink">{yFormat(ys[hover[0]])}</span></div>
            <div className="mt-1 font-medium text-ink">{valueFormat(z[hover[0]][hover[1]])}</div>
          </div>
        )}
      </div>

      <div className="mt-1 flex items-center gap-2 text-xs text-ink-3">
        <span>{valueFormat(0)}</span>
        <div className="flex">
          {Array.from({ length: BINS }, (_, i) => (
            <span key={i} className="h-3 w-7 first:rounded-l-sm last:rounded-r-sm" style={{ background: `var(--seq-${i})` }} />
          ))}
        </div>
        <span>{valueFormat(max)}</span>
        <span className="text-ink-3">(square-root shading)</span>
        {marker && (
          <span className="ml-auto flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full border-2" style={{ borderColor: "var(--series-2)" }} />
            {marker.label}
          </span>
        )}
      </div>

      <details className="mt-1 text-xs text-ink-3">
        <summary className="cursor-pointer select-none">View data</summary>
        <div className="mt-2 overflow-x-auto">
          <table className="font-mono tabular-nums">
            <thead>
              <tr>
                <th className="py-1 pr-3 text-left font-medium text-ink-2">{yTitle} \ {xTitle}</th>
                {tickCols.map((c) => <th key={c} className="px-2 text-right font-medium text-ink-2">{xFormat(xs[c])}</th>)}
              </tr>
            </thead>
            <tbody>
              {[...tickRows].reverse().map((r) => (
                <tr key={r} className="border-t border-grid">
                  <td className="py-1 pr-3 text-left">{yFormat(ys[r])}</td>
                  {tickCols.map((c) => <td key={c} className="px-2 text-right">{valueFormat(z[r][c])}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
