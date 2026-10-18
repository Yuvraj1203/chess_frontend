"use client";

import { Crown, ListOrdered } from "lucide-react";

import { Avatar } from "@/components/avatar";
import { EmptyState, ErrorState, RowsSkeleton } from "@/components/states";
import { formatPoints } from "@/lib/format";
import { useLeaderboard } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

const MEDAL = [
  "bg-brand text-brand-foreground",
  "bg-zinc-300 text-zinc-800 dark:bg-zinc-400",
  "bg-orange-300/80 text-orange-950",
];

export function Leaderboard({ tournamentId, winnerId }: { tournamentId: string; winnerId?: string }) {
  const { user } = useAuth();
  const { data, isPending, error, refetch } = useLeaderboard(tournamentId);

  if (isPending) return <RowsSkeleton />;
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} title="Could not load leaderboard" />;
  if (data.length === 0) {
    return (
      <EmptyState
        icon={ListOrdered}
        title="No players yet"
        hint="The leaderboard fills up as soon as players join and finish games."
      />
    );
  }

  const num = "w-10 text-right tabular-nums sm:w-12";

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-xs">
      <div className="overflow-x-auto">
        <div className="min-w-130">
          <div className="flex items-center gap-3 border-b bg-muted/40 px-4 py-2.5 text-xs font-medium text-muted-foreground">
            <span className="w-7">#</span>
            <span className="flex-1">Player</span>
            <span className={num} title="Played">P</span>
            <span className={num} title="Wins">W</span>
            <span className={num} title="Draws">D</span>
            <span className={num} title="Losses">L</span>
            <span className={cn(num, "w-14 sm:w-16")}>Points</span>
            <span className={num} title="Sonneborn-Berger tiebreak">SB</span>
          </div>
          {data.map((r) => {
            const me = r.userId === user?.id;
            return (
              <div
                key={r.userId}
                className={cn(
                  "flex items-center gap-3 border-b px-4 py-3 text-sm last:border-b-0 transition-colors hover:bg-muted/40",
                  me && "bg-brand/5",
                )}
              >
                <span
                  className={cn(
                    "grid size-7 place-items-center rounded-full text-xs font-semibold tabular-nums",
                    r.rank <= 3 && r.played > 0 ? MEDAL[r.rank - 1] : "text-muted-foreground",
                  )}
                >
                  {r.rank}
                </span>
                <span className="flex min-w-0 flex-1 items-center gap-2.5">
                  <Avatar name={r.name} className="size-7 text-[10px]" />
                  <span className="truncate font-medium">{r.name}</span>
                  {r.userId === winnerId && <Crown className="size-4 shrink-0 text-brand" />}
                  {me && (
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      You
                    </span>
                  )}
                </span>
                <span className={cn(num, "text-muted-foreground")}>{r.played}</span>
                <span className={cn(num, "text-muted-foreground")}>{r.wins}</span>
                <span className={cn(num, "text-muted-foreground")}>{r.draws}</span>
                <span className={cn(num, "text-muted-foreground")}>{r.losses}</span>
                <span className={cn(num, "w-14 text-base font-semibold sm:w-16")}>{formatPoints(r.points)}</span>
                <span className={cn(num, "text-muted-foreground")}>{formatPoints(r.tiebreak)}</span>
              </div>
            );
          })}
        </div>
      </div>
      <p className="border-t bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
        Win = 1 · Draw = ½ · Loss = 0. Ties broken by wins, then Sonneborn-Berger (SB).
      </p>
    </div>
  );
}
