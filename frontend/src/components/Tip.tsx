"use client";

import { useId } from "react";

interface Props {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom";
  align?: "left" | "right";
  width?: string;
  className?: string;
  /** make the wrapper focusable so keyboard and touch users can open it */
  focusable?: boolean;
}

/**
 * CSS-driven tooltip: opens on hover or keyboard focus (not after a mouse click) and hides while the
 * pointer is pressed (e.g. dragging a slider). Hidden means display:none so it never adds scrollable
 * width. On phones it shows as a bottom sheet so it cannot run off-screen.
 */
export default function Tip({
  content, children, side = "top", align = "left", width = "w-72", className = "", focusable = false,
}: Props) {
  const id = useId();
  return (
    <div
      className={`group/tip relative ${className}`}
      aria-describedby={id}
      {...(focusable ? { tabIndex: 0 } : {})}
    >
      {children}
      <span
        id={id}
        role="tooltip"
        className={`pointer-events-none absolute z-50 hidden ${width} ${
          side === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5"
        } ${align === "left" ? "left-0" : "right-0"} rounded-lg border border-axis bg-surface px-3 py-2 text-left text-xs font-normal normal-case leading-relaxed tracking-normal text-ink-2 shadow-lg max-sm:fixed max-sm:inset-x-4 max-sm:bottom-4 max-sm:top-auto max-sm:mb-0 max-sm:mt-0 max-sm:w-auto max-sm:min-w-0 group-hover/tip:block group-focus-visible/tip:block group-has-[:focus-visible]/tip:block group-active/tip:hidden`}
      >
        {content}
      </span>
    </div>
  );
}

/** Tooltip body: bold title, then plain-language explanation. */
export function T({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <span className="mb-0.5 block text-[13px] font-semibold text-ink">{title}</span>
      {children}
    </>
  );
}
