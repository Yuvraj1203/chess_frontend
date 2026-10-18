"use client";

import { ArrowRight, CalendarDays, ChevronRight, History, Swords, Timer } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { EmptyState, ErrorState, RowsSkeleton } from "@/components/states";
import { LivePill, StatusBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { formatDateTime, formatPoints, reasonLabel } from "@/lib/format";
import { useLeaderboard, useMyMatches, useTournaments } from "@/lib/queries";
import type { Tournament } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

const OUTCOME: Record<string, { label: string; cls: string }> = {
  win: { label: "W", cls: "bg-success/15 text-success" },
  loss: { label: "L", cls: "bg-destructive/10 text-destructive" },
  draw: { label: "D", cls: "bg-muted text-muted-foreground" },
};

function ScheduleItem({ t }: { t: Tournament }) {
  const { user } = useAuth();
  const { data } = useLeaderboard(t.id);
  const me = data?.find((r) => r.userId === user?.id);
  return (
    <Link
      href={`/tournaments/${t.id}`}
      className="group flex flex-wrap items-center gap-4 px-4 py-4 transition-colors hover:bg-muted/40"
    >
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate font-medium">{t.name}</p>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-3.5" /> {formatDateTime(t.startsAt)}
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono text-xs">
            <Timer className="size-3.5" /> {t.timeControl}
          </span>
        </p>
      </div>
      <div className="flex items-center gap-3">
        {me && (
          <span className="text-right text-sm">
            <span className="font-semibold tabular-nums">#{me.rank}</span>
            <span className="text-muted-foreground"> · {formatPoints(me.points)} pts</span>
          </span>
        )}
        <StatusBadge status={t.status} />
        <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

function SchedulePage() {
  const tournaments = useTournaments();
  const matches = useMyMatches();

  const upcoming = (tournaments.data ?? [])
    .filter((t) => t.joined && t.status !== "completed")
    .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
  const active = matches.data?.find((m) => m.status === "active");
  const finished = matches.data?.filter((m) => m.status !== "active") ?? [];
  const tally = finished.reduce(
    (acc, m) => ({ ...acc, [m.outcome ?? "draw"]: (acc[m.outcome ?? "draw"] ?? 0) + 1 }),
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-10">
      <PageHeader
        title="My games"
        description="Your upcoming tournaments and every game you've played."
        actions={
          finished.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              {(["win", "draw", "loss"] as const).map((k) => (
                <span key={k} className={cn("inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 font-medium", OUTCOME[k].cls)}>
                  <span className="tabular-nums">{tally[k] ?? 0}</span>
                  <span className="capitalize opacity-80">{k === "loss" ? "losses" : `${k}s`}</span>
                </span>
              ))}
            </div>
          )
        }
      />

      {active && (
        <Link
          href={`/matches/${active.id}`}
          className="group relative flex flex-wrap items-center gap-4 overflow-hidden rounded-2xl border border-brand/40 bg-card p-5 shadow-xs transition hover:shadow-md"
        >
          <div aria-hidden className="absolute -top-20 -left-10 size-56 rounded-full bg-brand/20 blur-3xl" />
          <span className="relative grid size-12 place-items-center rounded-xl bg-brand text-brand-foreground shadow-lg shadow-brand/30">
            <Swords className="size-6" />
          </span>
          <div className="relative min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold">Game in progress vs {active.opponent}</p>
              <LivePill />
            </div>
            <p className="text-sm text-muted-foreground">{active.tournamentName}</p>
          </div>
          <span className={cn(buttonVariants(), "relative")}>
            Resume <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      )}

      <Section title="Upcoming tournaments">
        {tournaments.isPending ? (
          <RowsSkeleton rows={3} />
        ) : tournaments.error ? (
          <ErrorState error={tournaments.error} onRetry={() => void tournaments.refetch()} />
        ) : upcoming.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Nothing scheduled"
            hint="Join an open tournament and it will show up here."
            action={
              <Link href="/tournaments" className={buttonVariants({ size: "sm" })}>
                Browse tournaments
              </Link>
            }
          />
        ) : (
          <div className="divide-y overflow-hidden rounded-2xl border bg-card shadow-xs">
            {upcoming.map((t) => (
              <ScheduleItem key={t.id} t={t} />
            ))}
          </div>
        )}
      </Section>

      <Section title="Match history">
        {matches.isPending ? (
          <RowsSkeleton />
        ) : matches.error ? (
          <ErrorState error={matches.error} onRetry={() => void matches.refetch()} />
        ) : matches.data.length === 0 ? (
          <EmptyState icon={History} title="No games yet" hint="Join a tournament and press “Find opponent”." />
        ) : (
          <div className="divide-y overflow-hidden rounded-2xl border bg-card shadow-xs">
            {matches.data.map((m) => {
              const o = OUTCOME[m.outcome ?? "draw"];
              return (
                <Link
                  key={m.id}
                  href={`/matches/${m.id}`}
                  className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-muted/40"
                >
                  {m.status === "active" ? (
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/15">
                      <span className="size-2 animate-pulse rounded-full bg-brand" />
                    </span>
                  ) : (
                    <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl text-sm font-bold", o.cls)}>
                      {o.label}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate text-sm font-medium">
                      vs {m.opponent}
                      <span
                        title={`You played ${m.color}`}
                        className={cn(
                          "size-2.5 shrink-0 rounded-full ring-1 ring-foreground/20",
                          m.color === "white" ? "bg-white" : "bg-zinc-900",
                        )}
                      />
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.tournamentName} · {formatDateTime(m.startedAt)}
                    </p>
                  </div>
                  <span className="hidden text-xs text-muted-foreground sm:block">
                    {m.status === "active" ? "In progress" : reasonLabel(m.endReason)}
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                    {m.status === "active" ? "Open" : "Review"}
                    <ChevronRight className="size-4" />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}

export default function View() {
  return (
    <RoleGate role="student">
      <SchedulePage />
    </RoleGate>
  );
}
