import { AlertCircle, Inbox, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function ErrorState({
  error,
  onRetry,
  title = "Something went wrong",
}: {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/5 p-4">
      <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-medium text-destructive">{title}</p>
        <p className="text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  action,
  icon: Icon = Inbox,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-14 text-center">
      <span className="grid size-11 place-items-center rounded-xl border bg-card shadow-xs">
        <Icon className="size-5 text-muted-foreground" />
      </span>
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {hint && <p className="max-w-sm text-sm text-muted-foreground">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-52 rounded-2xl" />
      ))}
    </div>
  );
}

export function RowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-xl" />
      ))}
    </div>
  );
}
