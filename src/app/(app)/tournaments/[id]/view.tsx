"use client";

import { ArrowLeft, CalendarDays, Repeat, Timer, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";

import { Avatar } from "@/components/avatar";
import { Chip } from "@/components/page-header";
import { ErrorState } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { Leaderboard } from "@/components/tournament/leaderboard";
import { MatchesList } from "@/components/tournament/matches-list";
import {
  CoachControls,
  ParticipantsPanel,
  StatsCards,
} from "@/components/tournament/coach-panel";
import { StudentPanel } from "@/components/tournament/student-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { useTournament } from "@/lib/queries";
import { emitAck, getSocket } from "@/lib/socket";
import { useAuth } from "@/providers/auth-provider";
import { useLive } from "@/providers/socket-provider";

export default function View() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { connected } = useLive();
  const { data: t, isPending, error, refetch } = useTournament(id);
  const isCoach = user?.role === "coach";

  // Live updates: the server pushes `tournament:updated` to everyone watching.
  useEffect(() => {
    if (!connected) return;
    void emitAck("tournament:watch", { tournamentId: id }).catch(() => undefined);
    return () => {
      if (getSocket().connected) void emitAck("tournament:unwatch", { tournamentId: id }).catch(() => undefined);
    };
  }, [id, connected]);

  if (isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }
  if (error) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <div className="space-y-6">
        <BackLink />
        <ErrorState
          error={error}
          onRetry={notFound ? undefined : () => void refetch()}
          title={notFound ? "Tournament not found" : "Could not load tournament"}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-5">
        <BackLink />
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 space-y-4">
            <StatusBadge status={t.status} />
            <h1 className="text-3xl font-semibold sm:text-4xl">{t.name}</h1>
            <div className="flex flex-wrap gap-2">
              <Chip>
                <Timer /> <span className="font-mono">{t.timeControl}</span>
              </Chip>
              <Chip>
                <CalendarDays /> {formatDateTime(t.startsAt)}
              </Chip>
              <Chip>
                <Users /> {t.participants.length} player{t.participants.length === 1 ? "" : "s"}
              </Chip>
              <Chip>
                <Repeat /> {t.allowRematch ? "Rematches allowed" : "Round robin"}
              </Chip>
            </div>
          </div>
          {isCoach && <CoachControls t={t} />}
        </div>
      </div>

      {t.status === "completed" && (
        <div className="relative overflow-hidden rounded-2xl border bg-card p-6 shadow-xs">
          <div aria-hidden className="absolute -top-24 -left-10 size-64 rounded-full bg-brand/20 blur-3xl" />
          <div className="relative flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-2xl bg-brand text-brand-foreground shadow-lg shadow-brand/30">
              <Trophy className="size-7" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Tournament champion
              </p>
              <p className="mt-1 flex items-center gap-2 text-2xl font-semibold">
                {t.winner?.name && <Avatar name={t.winner.name}className="size-7 text-[10px]" />}
                {t.winner?.name ?? "No games were played"}
              </p>
            </div>
          </div>
        </div>
      )}

      {!isCoach && <StudentPanel t={t} />}
      {isCoach && <StatsCards id={t.id} />}

      <Tabs defaultValue="leaderboard" className="gap-5">
        <TabsList variant="line" className="w-full justify-start gap-4 border-b pb-px">
          <TabsTrigger value="leaderboard" className="flex-none px-0.5 pb-2.5">
            Leaderboard
          </TabsTrigger>
          <TabsTrigger value="matches" className="flex-none px-0.5 pb-2.5">
            Matches
          </TabsTrigger>
          <TabsTrigger value="participants" className="flex-none px-0.5 pb-2.5">
            Participants
            <span className="rounded-md bg-muted px-1.5 text-[11px] tabular-nums text-muted-foreground">
              {t.participants.length}
            </span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="leaderboard">
          <Leaderboard tournamentId={t.id} winnerId={t.winner?.id} />
        </TabsContent>
        <TabsContent value="matches">
          <MatchesList tournamentId={t.id} />
        </TabsContent>
        <TabsContent value="participants">
          <ParticipantsPanel t={t} isCoach={isCoach} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/tournaments"
      className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" /> All tournaments
    </Link>
  );
}
