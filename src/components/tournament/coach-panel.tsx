"use client";

import { Loader2, Pencil, Play, Rocket, Trash2, Trophy, UserMinus, UserPlus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Avatar } from "@/components/avatar";
import { EmptyState, ErrorState } from "@/components/states";
import { TournamentFormDialog } from "@/components/tournament/tournament-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAddParticipant,
  useDeleteTournament,
  useRemoveParticipant,
  useStudents,
  useTournamentStats,
  useUpdateTournament,
} from "@/lib/queries";
import type { TournamentDetail } from "@/lib/types";

export function CoachControls({ t }: { t: TournamentDetail }) {
  const router = useRouter();
  const update = useUpdateTournament(t.id);
  const remove = useDeleteTournament(t.id);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const next =
    t.status === "draft"
      ? { to: "open" as const, label: "Open for joining", icon: <Rocket /> }
      : t.status === "open"
        ? { to: "ongoing" as const, label: "Start tournament", icon: <Play /> }
        : t.status === "ongoing"
          ? { to: "completed" as const, label: "Complete & declare winner", icon: <Trophy /> }
          : null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="icon"
        variant="ghost"
        aria-label="Delete tournament"
        title="Delete tournament"
        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setConfirmDelete(true)}
      >
        <Trash2 />
      </Button>
      {t.status !== "completed" && (
        <Button variant="outline" onClick={() => setEditing(true)}>
          <Pencil /> Edit
        </Button>
      )}
      {t.status === "open" && (
        <Button
          variant="outline"
          disabled={update.isPending}
          onClick={() =>
            update.mutate({ status: "completed" }, { onError: (e) => toast.error(e.message) })
          }
        >
          Close without starting
        </Button>
      )}
      {next && (
        <Button
          disabled={update.isPending}
          onClick={() =>
            update.mutate(
              { status: next.to },
              {
                onSuccess: () => toast.success(`Status: ${next.to}`),
                onError: (e) => toast.error(e.message),
              },
            )
          }
        >
          {update.isPending ? <Loader2 className="animate-spin" /> : next.icon}
          {next.label}
        </Button>
      )}

      {editing && <TournamentFormDialog open onOpenChange={setEditing} tournament={t} />}

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete “{t.name}”?</DialogTitle>
            <DialogDescription>
              This removes the tournament, its participants and all match records. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {remove.error && <ErrorState error={remove.error} title="Could not delete" />}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() =>
                remove.mutate(undefined, {
                  onSuccess: () => {
                    toast.success("Tournament deleted");
                    router.replace("/tournaments");
                  },
                })
              }
            >
              {remove.isPending && <Loader2 className="animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function StatsCards({ id }: { id: string }) {
  const { data, isPending, error, refetch } = useTournamentStats(id, true);
  if (isPending) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-22 rounded-2xl" />
        ))}
      </div>
    );
  }
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} title="Could not load stats" />;
  const progress = data.possibleMatches ? Math.min(1, data.completedMatches / data.possibleMatches) : 0;
  const items: { label: string; value: React.ReactNode; extra?: React.ReactNode }[] = [
    { label: "Players", value: data.participants },
    {
      label: "Games played",
      value: (
        <>
          {data.completedMatches}
          <span className="text-base text-muted-foreground">/{data.possibleMatches}</span>
        </>
      ),
      extra: (
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${progress * 100}%` }} />
        </div>
      ),
    },
    { label: "In progress", value: data.activeMatches },
    { label: "White wins", value: data.whiteWins },
    { label: "Black wins", value: data.blackWins },
    { label: "Draws", value: data.draws },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {items.map((it) => (
        <div key={it.label} className="rounded-2xl border bg-card p-4 shadow-xs">
          <div className="text-xs font-medium text-muted-foreground">{it.label}</div>
          <div className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight">{it.value}</div>
          {it.extra}
        </div>
      ))}
    </div>
  );
}

function PersonRow({ name, sub, action }: { name: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/40">
      <Avatar name={name} className="size-7 text-[10px]" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{name}</span>
        {sub && <span className="block truncate text-xs text-muted-foreground">{sub}</span>}
      </span>
      {action}
    </div>
  );
}

function Panel({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-xs">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {count !== undefined && (
          <span className="rounded-md bg-muted px-1.5 text-[11px] tabular-nums text-muted-foreground">{count}</span>
        )}
      </div>
      <div className="max-h-96 divide-y overflow-y-auto">{children}</div>
    </div>
  );
}

export function ParticipantsPanel({ t, isCoach }: { t: TournamentDetail; isCoach: boolean }) {
  const students = useStudents(isCoach);
  const add = useAddParticipant(t.id);
  const remove = useRemoveParticipant(t.id);
  const joined = new Set(t.participants.map((p) => p.id));
  const available = (students.data ?? []).filter((s) => !joined.has(s.id));
  const canEdit = isCoach && t.status !== "completed";

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Panel title="Participants" count={t.participants.length}>
        {t.participants.length === 0 ? (
          <div className="p-4">
            <EmptyState icon={Users} title="Nobody has joined yet" />
          </div>
        ) : (
          t.participants.map((p) => (
            <PersonRow
              key={p.id}
              name={p.name}
              action={
                canEdit && (
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    aria-label={`Remove ${p.name}`}
                    className="text-muted-foreground hover:text-destructive"
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(p.id, { onError: (e) => toast.error(e.message) })}
                  >
                    <UserMinus />
                  </Button>
                )
              }
            />
          ))
        )}
      </Panel>
      {isCoach && (
        <Panel title="Add students" count={students.data ? available.length : undefined}>
          {students.isPending ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : students.error ? (
            <div className="p-4">
              <ErrorState error={students.error} onRetry={() => void students.refetch()} />
            </div>
          ) : available.length === 0 ? (
            <div className="p-4">
              <EmptyState icon={UserPlus} title="Every student is already in" />
            </div>
          ) : (
            available.map((s) => (
              <PersonRow
                key={s.id}
                name={s.name}
                sub={s.email}
                action={
                  <Button
                    size="xs"
                    variant="outline"
                    disabled={add.isPending || t.status === "completed"}
                    onClick={() =>
                      add.mutate(s.id, {
                        onSuccess: () => toast.success(`${s.name} added`),
                        onError: (e) => toast.error(e.message),
                      })
                    }
                  >
                    <UserPlus /> Add
                  </Button>
                }
              />
            ))
          )}
        </Panel>
      )}
    </div>
  );
}
