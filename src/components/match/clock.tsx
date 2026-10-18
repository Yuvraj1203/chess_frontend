import { formatClock } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Clock({ ms, active }: { ms: number; active: boolean }) {
  const low = ms < 20_000;
  return (
    <div
      className={cn(
        "min-w-26 rounded-xl px-3.5 py-1.5 text-right font-mono text-2xl font-semibold tabular-nums tracking-tight transition-all duration-300",
        active
          ? "bg-foreground text-background shadow-lg shadow-black/10"
          : "bg-muted text-muted-foreground",
        active && low && "animate-pulse bg-destructive text-white",
        !active && low && "text-destructive",
      )}
      aria-label="clock"
    >
      {formatClock(ms)}
    </div>
  );
}
