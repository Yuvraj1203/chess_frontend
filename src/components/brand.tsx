import { Crown } from "lucide-react";

import { cn } from "@/lib/utils";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="grid size-8 place-items-center rounded-[10px] bg-zinc-950 text-brand shadow-sm ring-1 ring-black/5 dark:ring-white/15">
        <Crown className="size-4" strokeWidth={2.25} />
      </span>
      {!compact && (
        <span className="text-[15px] font-semibold tracking-tight">
          Kingdom<span className="text-muted-foreground">ofChess</span>
        </span>
      )}
    </span>
  );
}
