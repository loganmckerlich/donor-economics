"use client";

import { useId, useMemo, useState } from "react";
import { niceTicks } from "@/lib/format";
import { useWidth } from "./useWidth";

export interface Series {
  key: string;
  label: string;
  color: string; // CSS var, e.g. "var(--series-1)"
  y: number[];
  dashed?: boolean;
  /** show the label at the line end */
  direct?: boolean;
  /** faint dashed "before your last change" line: drawn clipped, no label, no tooltip row */
  ghost?: boolean;
  /** own x values (ghost lines come from a different scenario, so their x grid can differ) */
  x?: number[];
}

export interface VLine {
  x: number;
  label: string;
}

interface Props {
  x: number[];
  series: Series[];
  xFormat: (v: number) => string;
  yFormat: (v: number) => string;
  xTitle: string;
  yTitle: string;
  vlines?: VLine[];
  zeroLine?: boolean;
  yDomain?: [number, number];
  ariaLabel: string;
  height?: number;
}

const margins = (width: number) =>
  width < 520 ? { l: 48, r: 14, t: 22, b: 40 } : { l: 58, r: 112, t: 22, b: 40 };

export default function LineChart({
  x, series, xFormat, yFormat, xTitle, yTitle, vlines = [], zeroLine, yDomain, ariaLabel, height = 300,
}: Props) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const compact = width < 520;
  const M = margins(width);
  const [hover, setHover] = useState<number | null>(null);
  const clipId = useId();
  const live = series.filter((s) => !s.ghost);
  const ghosts = series.filter((s) => s.ghost);

  const { xMin, xMax, yMin, yMax, yTicks, xTicks } = useMemo(() => {
    const xMin = x[0], xMax = x[x.length - 1];
    let lo = Infinity, hi = -Infinity;
    for (const s of series) {
      const sxs = s.x ?? x;
      s.y.forEach((v, i) => {
        if (s.ghost && (sxs[i] < xMin || sxs[i] > xMax)) return;
        lo = Math.min(lo, v);
        hi = Math.max(hi, v);
      });
    }
    if (zeroLine) { lo = Math.min(lo, 0); hi = Math.max(hi, 0); }
    if (yDomain) [lo, hi] = yDomain;
    if (lo === hi) { lo -= 1; hi += 1; }
    const pad = yDomain ? 0 : (hi - lo) * 0.06;
    const yTicks = niceTicks(lo - pad, hi + pad, 5);
    return {
      xMin, xMax,
      yMin: yDomain ? lo : Math.min(lo - pad, yTicks[0]),
      yMax: yDomain ? hi : Math.max(hi + pad, yTicks[yTicks.length - 1]),
      yTicks,
      xTicks: niceTicks(xMin, xMax, width < 480 ? 4 : 6),
    };
  }, [x, series, zeroLine, yDomain, width]);

  const iw = width - M.l - M.r;
  const ih = height - M.t - M.b;
  const sx = (v: number) => M.l + ((v - xMin) / (xMax - xMin || 1)) * iw;
  const sy = (v: number) => M.t + (1 - (v - yMin) / (yMax - yMin || 1)) * ih;

  const path = (ys: number[], xs: number[] = x) =>
    ys.map((v, i) => `${i ? "L" : "M"}${sx(xs[i]).toFixed(1)},${sy(v).toFixed(1)}`).join("");

  // direct labels at the line end, nudged apart
  const labels = live
    .filter((s) => s.direct !== false)
    .map((s) => ({ s, y: sy(s.y[s.y.length - 1]) }))
    .sort((a, b) => a.y - b.y);
  for (let i = 1; i < labels.length; i++) labels[i].y = Math.max(labels[i].y, labels[i - 1].y + 15);

  const onMove = (e: React.MouseEvent<SVGRectElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const frac = (e.clientX - r.left) / r.width;
    setHover(Math.max(0, Math.min(x.length - 1, Math.round(frac * (x.length - 1)))));
  };

  const hx = hover === null ? 0 : sx(x[hover]);
  const tipLeft = hover !== null && hx > width * 0.6;
  const stride = Math.max(1, Math.floor((x.length - 1) / 10));

  return (
    <div>
      <div ref={ref} className="relative" onMouseLeave={() => setHover(null)}>
        <svg width={width} height={height} role="img" aria-label={ariaLabel} className="block overflow-visible">
          {yTicks.map((t) => (
            <g key={t}>
              <line x1={M.l} x2={M.l + iw} y1={sy(t)} y2={sy(t)} stroke="var(--grid)" strokeWidth={1} />
              <text x={M.l - 8} y={sy(t)} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--ink-3)">{yFormat(t)}</text>
            </g>
          ))}
          {xTicks.map((t) => (
            <text key={t} x={sx(t)} y={M.t + ih + 18} textAnchor="middle" fontSize={11} fill="var(--ink-3)">{xFormat(t)}</text>
          ))}
          <line x1={M.l} x2={M.l + iw} y1={M.t + ih} y2={M.t + ih} stroke="var(--axis)" />
          {zeroLine && yMin < 0 && yMax > 0 && (
            <line x1={M.l} x2={M.l + iw} y1={sy(0)} y2={sy(0)} stroke="var(--axis)" strokeWidth={1.5} />
          )}
          <text x={M.l + iw / 2} y={height - 4} textAnchor="middle" fontSize={11} fill="var(--ink-2)">{xTitle}</text>
          <text x={M.l} y={10} fontSize={11} fill="var(--ink-2)">{yTitle}</text>

          {vlines.filter((v) => v.x >= xMin && v.x <= xMax).map((v, i) => (
            <g key={v.label}>
              <line x1={sx(v.x)} x2={sx(v.x)} y1={M.t} y2={M.t + ih} stroke="var(--ink-3)" strokeWidth={1} strokeDasharray="4 3" />
              <text
                x={sx(v.x) + (sx(v.x) > M.l + iw - 90 ? -4 : 4)}
                y={M.t + 11 + i * 13}
                textAnchor={sx(v.x) > M.l + iw - 90 ? "end" : "start"}
                fontSize={11}
                fill="var(--ink-2)"
              >{v.label}</text>
            </g>
          ))}

          <defs>
            <clipPath id={clipId}><rect x={M.l} y={M.t} width={iw} height={ih} /></clipPath>
          </defs>
          {ghosts.map((s) => (
            <path key={s.key} d={path(s.y, s.x)} fill="none" stroke="var(--ink-3)" strokeWidth={1.5}
              strokeDasharray="2 3" opacity={0.85} clipPath={`url(#${clipId})`} />
          ))}
          {ghosts.length > 0 && (
            <g>
              <line x1={M.l + iw - 118} x2={M.l + iw - 100} y1={9} y2={9} stroke="var(--ink-3)" strokeWidth={1.5} strokeDasharray="2 3" />
              <text x={M.l + iw} y={9} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--ink-3)">before last change</text>
            </g>
          )}
          {live.map((s) => (
            <path key={s.key} d={path(s.y)} fill="none" stroke={s.color} strokeWidth={2}
              strokeLinejoin="round" strokeLinecap="round" strokeDasharray={s.dashed ? "6 4" : undefined} />
          ))}

          {!compact && labels.map(({ s, y }) => (
            <g key={s.key}>
              <rect x={M.l + iw + 8} y={y - 5} width={10} height={3} rx={1.5} fill={s.color} />
              <text x={M.l + iw + 22} y={y} dy="0.32em" fontSize={11} fill="var(--ink-2)">{s.label}</text>
            </g>
          ))}

          {hover !== null && (
            <g pointerEvents="none">
              <line x1={hx} x2={hx} y1={M.t} y2={M.t + ih} stroke="var(--ink-3)" strokeWidth={1} />
              {live.map((s) => (
                <circle key={s.key} cx={hx} cy={sy(s.y[hover])} r={4} fill={s.color} stroke="var(--surface)" strokeWidth={2} />
              ))}
            </g>
          )}
          <rect x={M.l} y={M.t} width={iw} height={ih} fill="transparent" onMouseMove={onMove} />
        </svg>

        {hover !== null && (
          <div
            className="pointer-events-none absolute z-10 rounded-md border border-axis bg-surface px-2.5 py-2 text-xs shadow-md"
            style={{ top: M.t, [tipLeft ? "right" : "left"]: tipLeft ? width - hx + 12 : hx + 12 }}
          >
            <div className="mb-1 font-medium text-ink">{xFormat(x[hover])}</div>
            {live.map((s) => (
              <div key={s.key} className="flex items-center gap-2 text-ink-2">
                <span className="inline-block h-[3px] w-3 rounded-sm" style={{ background: s.color }} />
                <span>{s.label}</span>
                <span className="ml-auto pl-3 font-mono tabular-nums text-ink">{yFormat(s.y[hover])}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {compact && live.length > 1 && (
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
          {live.map((s) => (
            <span key={s.key} className="inline-flex items-center gap-1.5">
              <span className="inline-block h-[3px] w-3 rounded-sm" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      )}

      <details className="mt-1 text-xs text-ink-3">
        <summary className="cursor-pointer select-none">View data</summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-right font-mono tabular-nums">
            <thead>
              <tr className="text-ink-2">
                <th className="py-1 pr-3 text-left font-medium">{xTitle}</th>
                {live.map((s) => <th key={s.key} className="px-2 font-medium">{s.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {x.map((xv, i) => (i % stride === 0 || i === x.length - 1) && (
                <tr key={i} className="border-t border-grid">
                  <td className="py-1 pr-3 text-left">{xFormat(xv)}</td>
                  {live.map((s) => <td key={s.key} className="px-2">{yFormat(s.y[i])}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
