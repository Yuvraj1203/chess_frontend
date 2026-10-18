"use client";

import { ChevronRight, Swords } from "lucide-react";
import Link from "next/link";

import { EmptyState, ErrorState, RowsSkeleton } from "@/components/states";
import { LivePill } from "@/components/status-badge";
import { formatDateTime, reasonLabel, resultLabel } from "@/lib/format";
import { useTournamentMatches } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

function Side({ name, color, won }: { name: string; color: "white" | "black"; won: boolean }) {
  return (
    <span className={cn("flex min-w-0 items-center gap-2", won ? "font-semibold" : "text-muted-foreground")}>
      <span
        className={cn(
          "size-3 shrink-0 rounded-full ring-1 ring-foreground/20",
          color === "white" ? "bg-white" : "bg-zinc-900",
        )}
      />
      <span className="truncate">{name}</span>
    </span>
  );
}

export function MatchesList({ tournamentId }: { tournamentId: string }) {
  const { user } = useAuth();
  const { data, isPending, error, refetch } = useTournamentMatches(tournamentId);

  if (isPending) return <RowsSkeleton />;
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} title="Could not load matches" />;
  if (data.length === 0) {
    return <EmptyState icon={Swords} title="No matches yet" hint="Matches appear here as soon as players are paired." />;
  }

  return (
    <div className="divide-y overflow-hidden rounded-2xl border bg-card shadow-xs">
      {data.map((m) => {
        const canOpen = user?.role === "coach" || m.white.id === user?.id || m.black.id === user?.id;
        const live = m.status === "active";
        const row = (
          <>
            <div className="grid min-w-0 flex-1 gap-1.5 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-4">
              <Side name={m.white.name} color="white" won={m.result === "white"} />
              <span className="hidden text-xs text-muted-foreground sm:block">vs</span>
              <Side name={m.black.name} color="black" won={m.result === "black"} />
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1 text-right">
              {live ? (
                <LivePill />
              ) : (
                <span className="font-mono text-sm font-semibold">{resultLabel(m.result)}</span>
              )}
              <span className="text-xs text-muted-foreground">
                {live ? formatDateTime(m.startedAt) : reasonLabel(m.endReason)}
              </span>
            </div>
            {canOpen && (
              <span className="hidden items-center gap-0.5 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground sm:inline-flex">
                {live ? (user?.role === "coach" ? "Spectate" : "Open") : "Review"}
                <ChevronRight className="size-4" />
              </span>
            )}
          </>
        );
        const cls = "flex items-center gap-4 px-4 py-3.5 text-sm";
        return canOpen ? (
          <Link key={m.id} href={`/matches/${m.id}`} className={cn(cls, "group transition-colors hover:bg-muted/40")}>
            {row}
          </Link>
        ) : (
          <div key={m.id} className={cls}>
            {row}
          </div>
        );
      })}
    </div>
  );
}
