import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0 space-y-1.5">
        {eyebrow && (
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {eyebrow}
          </div>
        )}
        <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
        {description && <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Small rounded pill for metadata like time controls. */
export function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full border bg-card px-2.5 text-xs font-medium text-muted-foreground [&_svg]:size-3.5",
        className,
      )}
    >
      {children}
    </span>
  );
}
