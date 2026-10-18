"use client";

import { ArrowUpRight, CalendarDays, Check, Plus, Repeat, Timer, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { CardGridSkeleton, EmptyState, ErrorState } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { TournamentFormDialog } from "@/components/tournament/tournament-form";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { useJoinTournament, useTournaments } from "@/lib/queries";
import type { Tournament, TournamentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

type Filter = "all" | TournamentStatus;

function TournamentCard({ t, isCoach }: { t: Tournament; isCoach: boolean }) {
  const join = useJoinTournament();
  return (
    <div className="group relative flex flex-col rounded-2xl border bg-card p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-lg hover:shadow-black/5">
      <div className="flex items-center justify-between gap-2">
        <StatusBadge status={t.status} />
        <span className="inline-flex items-center gap-1 font-mono text-xs font-medium text-muted-foreground">
          <Timer className="size-3.5" />
          {t.timeControl}
        </span>
      </div>

      <h3 className="mt-4 line-clamp-2 text-lg font-semibold leading-snug">
        <Link href={`/tournaments/${t.id}`} className="after:absolute after:inset-0 after:rounded-2xl">
          {t.name}
        </Link>
      </h3>

      <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-3.5" />
          <span>{formatDateTime(t.startsAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="size-3.5" />
          <span>
            {t.participantCount} player{t.participantCount === 1 ? "" : "s"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Repeat className="size-3.5" />
          <span>{t.allowRematch ? "Rematches allowed" : "Round robin"}</span>
        </div>
      </div>

      {t.winner && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-brand/10 px-3 py-2 text-sm">
          <Trophy className="size-4 text-brand" />
          <span className="text-muted-foreground">Winner</span>
          <span className="ml-auto font-medium">{t.winner.name}</span>
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 pt-5">
        <span className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
          {isCoach ? "Manage" : "View details"}
          <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
        {!isCoach && t.joined && (
          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
            <Check className="size-3.5" /> Joined
          </span>
        )}
        {!isCoach && !t.joined && t.status === "open" && (
          <Button
            size="sm"
            className="relative z-10"
            disabled={join.isPending}
            onClick={() =>
              join.mutate(t.id, {
                onSuccess: () => toast.success(`Joined ${t.name}`),
                onError: (e) => toast.error(e.message),
              })
            }
          >
            {join.isPending ? "Joining…" : "Join"}
          </Button>
        )}
      </div>
    </div>
  );
}

function FilterBar({
  filters,
  value,
  counts,
  onChange,
}: {
  filters: Filter[];
  value: Filter;
  counts: Record<Filter, number>;
  onChange: (f: Filter) => void;
}) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div role="tablist" className="inline-flex gap-1 rounded-xl border bg-muted/50 p-1">
        {filters.map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={value === f}
            onClick={() => onChange(f)}
            className={cn(
              "inline-flex h-8 items-center gap-2 rounded-lg px-3 text-sm font-medium capitalize text-muted-foreground transition-all hover:text-foreground",
              value === f && "bg-card text-foreground shadow-sm ring-1 ring-foreground/5",
            )}
          >
            {f === "ongoing" ? "Live" : f}
            <span className="rounded-md bg-foreground/5 px-1.5 text-[11px] tabular-nums">{counts[f]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function View() {
  const { user } = useAuth();
  const isCoach = user?.role === "coach";
  const { data, isPending, error, refetch } = useTournaments();
  const [filter, setFilter] = useState<Filter>("all");
  const [creating, setCreating] = useState(false);

  const filters: Filter[] = isCoach
    ? ["all", "draft", "open", "ongoing", "completed"]
    : ["all", "open", "ongoing", "completed"];
  const all = data ?? [];
  const counts = Object.fromEntries(
    filters.map((f) => [f, f === "all" ? all.length : all.filter((t) => t.status === f).length]),
  ) as Record<Filter, number>;
  const shown = all.filter((t) => filter === "all" || t.status === filter);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={isCoach ? "Coach dashboard" : `Hi, ${user?.name.split(" ")[0]}`}
        title="Tournaments"
        description={
          isCoach
            ? "Create and run tournaments. Opponents are paired automatically."
            : "Join an open tournament, then hit “Find opponent” to play live."
        }
        actions={
          isCoach && (
            <Button onClick={() => setCreating(true)}>
              <Plus /> New tournament
            </Button>
          )
        }
      />

      <FilterBar filters={filters} value={filter} counts={counts} onChange={setFilter} />

      {isPending ? (
        <CardGridSkeleton />
      ) : error ? (
        <ErrorState error={error} onRetry={() => void refetch()} title="Could not load tournaments" />
      ) : shown.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title={filter === "all" ? "No tournaments yet" : `No ${filter === "ongoing" ? "live" : filter} tournaments`}
          hint={
            isCoach
              ? "Create the first tournament to get started."
              : "Check back soon — your coach will open one shortly."
          }
          action={
            isCoach ? (
              <Button size="sm" onClick={() => setCreating(true)}>
                <Plus /> New tournament
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((t) => (
            <TournamentCard key={t.id} t={t} isCoach={isCoach} />
          ))}
        </div>
      )}

      {creating && <TournamentFormDialog open onOpenChange={setCreating} />}
    </div>
  );
}
