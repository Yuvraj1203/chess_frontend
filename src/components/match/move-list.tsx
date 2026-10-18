"use client";

import { Check, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** PGN panel: numbered SAN moves; click a move to review that position. */
export function MoveList({
  sans,
  pgn,
  viewIndex,
  onSelect,
}: {
  sans: string[];
  pgn: string;
  /** Number of half-moves shown on the board (sans.length = live). */
  viewIndex: number;
  onSelect: (index: number) => void;
}) {
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the latest move in view by scrolling only the list, never the page.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [sans.length]);

  const rows: { n: number; w?: string; b?: string }[] = [];
  for (let i = 0; i < sans.length; i += 2) {
    rows.push({ n: i / 2 + 1, w: sans[i], b: sans[i + 1] });
  }

  const cell = (san: string | undefined, idx: number) =>
    san ? (
      <button
        type="button"
        onClick={() => onSelect(idx)}
        className={cn(
          "rounded-md px-2 py-1 text-left font-mono text-[13px] transition-colors hover:bg-muted",
          viewIndex === idx && "bg-foreground font-semibold text-background hover:bg-foreground",
        )}
      >
        {san}
      </button>
    ) : (
      <span />
    );

  const atLive = viewIndex >= sans.length;

  return (
    <div className="flex flex-col">
      <div ref={scrollRef} className="h-60 overflow-y-auto px-2 py-2 lg:h-80">
        {rows.length === 0 ? (
          <p className="grid h-full place-items-center text-sm text-muted-foreground">No moves yet</p>
        ) : (
          <div className="grid grid-cols-[2.25rem_1fr_1fr] items-center gap-x-1 gap-y-0.5">
            {rows.map((r) => (
              <div key={r.n} className="contents">
                <span className="pl-2 font-mono text-xs text-muted-foreground tabular-nums">{r.n}.</span>
                {cell(r.w, r.n * 2 - 1)}
                {cell(r.b, r.n * 2)}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 border-t p-2">
        <Button size="icon-sm" variant="ghost" aria-label="First move" disabled={viewIndex <= 0} onClick={() => onSelect(0)}>
          <ChevronFirst />
        </Button>
        <Button size="icon-sm" variant="ghost" aria-label="Previous move" disabled={viewIndex <= 0} onClick={() => onSelect(viewIndex - 1)}>
          <ChevronLeft />
        </Button>
        <Button size="icon-sm" variant="ghost" aria-label="Next move" disabled={atLive} onClick={() => onSelect(viewIndex + 1)}>
          <ChevronRight />
        </Button>
        <Button size="icon-sm" variant="ghost" aria-label="Latest move" disabled={atLive} onClick={() => onSelect(sans.length)}>
          <ChevronLast />
        </Button>
        {!atLive && (
          <Button size="sm" variant="secondary" className="ml-1" onClick={() => onSelect(sans.length)}>
            Back to live
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto text-muted-foreground"
          onClick={() => {
            void navigator.clipboard.writeText(pgn || "").then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            });
          }}
        >
          {copied ? <Check /> : <Copy />} {copied ? "Copied" : "PGN"}
        </Button>
      </div>
    </div>
  );
}
