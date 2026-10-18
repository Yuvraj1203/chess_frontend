import { cn } from "@/lib/utils";
import type { TournamentStatus } from "@/lib/types";

const DOT: Record<TournamentStatus, string> = {
  draft: "bg-muted-foreground/50",
  open: "bg-success",
  ongoing: "bg-brand",
  completed: "bg-foreground/70",
};

export function StatusBadge({ status, className }: { status: TournamentStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full border bg-card px-2.5 text-xs font-medium capitalize",
        className,
      )}
    >
      <span className="relative flex size-1.5">
        {status === "ongoing" && (
          <span className={cn("absolute inset-0 animate-ping rounded-full opacity-75", DOT[status])} />
        )}
        <span className={cn("relative size-1.5 rounded-full", DOT[status])} />
      </span>
      {status === "ongoing" ? "Live" : status}
    </span>
  );
}

/** Pulsing "Live" pill for in-progress games. */
export function LivePill({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full bg-brand/15 px-2.5 text-xs font-semibold text-brand-foreground dark:text-brand",
        className,
      )}
    >
      <span className="relative flex size-1.5">
        <span className="absolute inset-0 animate-ping rounded-full bg-brand opacity-75" />
        <span className="relative size-1.5 rounded-full bg-brand" />
      </span>
      Live
    </span>
  );
}
