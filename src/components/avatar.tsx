import { cn } from "@/lib/utils";

/** Stable hue per name so each player keeps their colour everywhere. */
function hue(name: string): number {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  const h = hue(name);
  return (
    <span
      aria-hidden
      className={cn(
        "inline-grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold tracking-wide",
        className,
      )}
      style={{
        background: `oklch(0.9 0.06 ${h})`,
        color: `oklch(0.35 0.09 ${h})`,
      }}
    >
      {initials(name)}
    </span>
  );
}
