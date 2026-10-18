"use client";

import { CalendarDays, LogOut, Moon, Sun, Swords, Trophy } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Avatar } from "@/components/avatar";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setTheme, useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { useLive } from "@/providers/socket-provider";

export function ThemeToggle() {
  const theme = useTheme();
  return (
    <Button
      size="icon-sm"
      variant="ghost"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="text-muted-foreground"
    >
      {theme === "dark" ? <Sun /> : <Moon />}
    </Button>
  );
}

export function Navbar() {
  const { user, activeMatchId, logout } = useAuth();
  const { connected } = useLive();
  const pathname = usePathname();

  const links = [
    { href: "/tournaments", label: "Tournaments", icon: Trophy },
    ...(user?.role === "student"
      ? [{ href: "/schedule", label: "My games", icon: CalendarDays }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/75 backdrop-blur-xl supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-15 max-w-6xl items-center gap-3 px-4 sm:gap-6">
        <Link href="/tournaments" aria-label="Kingdom of Chess home">
          <Logo className="hidden sm:inline-flex" />
          <Logo compact className="sm:hidden" />
        </Link>

        <nav className="flex flex-1 items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "inline-flex h-8 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                  active && "bg-muted text-foreground",
                )}
              >
                <Icon className="size-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
          {activeMatchId && !pathname.startsWith("/matches/") && (
            <Link
              href={`/matches/${activeMatchId}`}
              className="ml-1 inline-flex h-8 items-center gap-2 rounded-lg bg-brand px-3 text-sm font-semibold text-brand-foreground shadow-sm transition hover:brightness-105"
            >
              <span className="relative flex size-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-brand-foreground/50" />
                <span className="relative size-2 rounded-full bg-brand-foreground" />
              </span>
              <Swords className="size-4 sm:hidden" />
              <span className="hidden sm:inline">Resume game</span>
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-1.5">
          <span
            title={connected ? "Live connection active" : "Reconnecting to the live server"}
            className="hidden h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium text-muted-foreground md:inline-flex"
          >
            <span className={cn("size-1.5 rounded-full", connected ? "bg-success" : "animate-pulse bg-destructive")} />
            {connected ? "Live" : "Offline"}
          </span>
          <ThemeToggle />
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Account menu"
                className="relative rounded-full outline-none ring-offset-2 ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Avatar name={user.name} />
                <span
                  className={cn(
                    "absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-background md:hidden",
                    connected ? "bg-success" : "bg-destructive",
                  )}
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8} className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="flex items-center gap-2.5 py-2">
                    <Avatar name={user.name} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-foreground">{user.name}</span>
                      <span className="block truncate text-xs font-normal capitalize text-muted-foreground">
                        {user.role}
                      </span>
                    </span>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => void logout()}>
                  <LogOut /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
