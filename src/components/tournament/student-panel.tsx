"use client";

import { ArrowRight, Loader2, Search, Swords, WifiOff, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatPoints } from "@/lib/format";
import { useJoinTournament, useLeaderboard } from "@/lib/queries";
import type { TournamentDetail } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { useLive } from "@/providers/socket-provider";

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</div>
    </div>
  );
}

export function StudentPanel({ t }: { t: TournamentDetail }) {
  const { user, activeMatchId } = useAuth();
  const { connected, queuedTournamentId, joinQueue, leaveQueue } = useLive();
  const join = useJoinTournament();
  const board = useLeaderboard(t.id);
  const [busy, setBusy] = useState(false);

  const searching = queuedTournamentId === t.id;
  const me = board.data?.find((r) => r.userId === user?.id);
  const playable = t.status === "open" || t.status === "ongoing";

  async function toggleQueue() {
    setBusy(true);
    try {
      if (searching) await leaveQueue(t.id);
      else await joinQueue(t.id);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!t.joined) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-5 shadow-xs">
        <div>
          <p className="font-medium">
            {t.status === "open" ? "Ready to compete?" : t.status === "completed" ? "Tournament finished" : "Joining is closed"}
          </p>
          <p className="text-sm text-muted-foreground">
            {t.status === "open"
              ? "Join this tournament to start playing."
              : t.status === "completed"
                ? "This tournament has finished."
                : "The tournament has already started."}
          </p>
        </div>
        {t.status === "open" && (
          <Button
            size="lg"
            disabled={join.isPending}
            onClick={() =>
              join.mutate(t.id, {
                onSuccess: () => toast.success(`Joined ${t.name}`),
                onError: (e) => toast.error(e.message),
              })
            }
          >
            {join.isPending && <Loader2 className="animate-spin" />}
            Join tournament
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activeMatchId && (
        <Link
          href={`/matches/${activeMatchId}`}
          className="group flex items-center gap-4 rounded-2xl border border-brand/40 bg-brand/10 p-4 transition hover:bg-brand/15"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-brand text-brand-foreground">
            <Swords className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-medium">You have a game in progress</span>
            <span className="block text-sm text-muted-foreground">Your clock is running — jump back in.</span>
          </span>
          <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
        </Link>
      )}

      <div className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-xs sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex gap-8 sm:gap-10">
            <Stat label="Your rank" value={me ? `#${me.rank}` : "—"} />
            <Stat label="Points" value={me ? formatPoints(me.points) : "0"} />
            <Stat
              label="Record"
              value={
                <span className="text-lg">
                  {me ? `${me.wins}W · ${me.draws}D · ${me.losses}L` : "—"}
                </span>
              }
            />
          </div>

          {playable && (
            <div className="flex items-center gap-4">
              {searching && (
                <span className="relative hidden size-10 sm:block" aria-hidden>
                  <span className="absolute inset-0 animate-ping rounded-full bg-brand/30" />
                  <span className="absolute inset-2 animate-ping rounded-full bg-brand/40 [animation-delay:300ms]" />
                  <span className="absolute inset-3.5 rounded-full bg-brand" />
                </span>
              )}
              <Button
                size="lg"
                variant={searching ? "outline" : "default"}
                className={cn("min-w-44", !searching && "shadow-md")}
                disabled={busy || !connected || (!!activeMatchId && !searching)}
                onClick={() => void toggleQueue()}
              >
                {busy ? <Loader2 className="animate-spin" /> : searching ? <X /> : <Search />}
                {searching ? "Cancel search" : "Find opponent"}
              </Button>
            </div>
          )}
        </div>

        <p className="mt-5 border-t pt-4 text-sm text-muted-foreground">
          {!connected ? (
            <span className="inline-flex items-center gap-2 text-destructive">
              <WifiOff className="size-4" /> Live connection lost — reconnecting. You can&apos;t queue until it&apos;s back.
            </span>
          ) : searching ? (
            "Searching for an opponent… you'll be taken to the board automatically."
          ) : playable ? (
            "Ready for your next game? You'll be paired with the next available player."
          ) : (
            "This tournament is not accepting games."
          )}
        </p>
      </div>
    </div>
  );
}
