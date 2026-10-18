"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Clock, Loader2, Radio, Swords } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Chessboard } from "react-chessboard";

import { Avatar } from "@/components/avatar";
import { Logo } from "@/components/brand";
import { ThemeToggle } from "@/components/navbar";
import { ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { post } from "@/lib/api";
import type { AuthUser, MeResponse } from "@/lib/types";
import { ME_KEY } from "@/providers/auth-provider";

const DEMO_PASSWORD = "Password123!";
const DEMO = [
  { name: "Coach Kasparov", role: "Coach", email: "coach@kingdomofchess.com" },
  { name: "Aarav Sharma", role: "Student", email: "aarav@kingdomofchess.com" },
  { name: "Diya Patel", role: "Student", email: "diya@kingdomofchess.com" },
];

// Final position of the "Immortal Game" (Anderssen–Kieseritzky, 1851).
const SHOWCASE_FEN = "r1bk3r/p2pBpNp/n4n2/1p1NP2P/6P1/3P4/P1P1K3/q5b1 b - - 1 23";

const FEATURES = [
  { icon: Swords, text: "Automatic pairing — just hit play" },
  { icon: Clock, text: "Server-side clocks that never drift" },
  { icon: Radio, text: "Live boards, standings and spectating" },
];

export default function LoginPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const { user } = await post<{ user: AuthUser }>("/auth/login", { email, password });
      qc.setQueryData<MeResponse>(ME_KEY, { user, activeMatchId: null });
      qc.invalidateQueries({ queryKey: ME_KEY });
      router.replace("/tournaments");
    } catch (err) {
      setError(err as Error);
      setPending(false);
    }
  }

  return (
    <div className="grid min-h-dvh flex-1 lg:grid-cols-[1fr_1.1fr]">
      {/* Form column */}
      <div className="relative flex flex-col px-6 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
              Sign in to join a tournament and play live.
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            {error && <ErrorState error={error} title="Could not sign in" />}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="you@kingdomofchess.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" className="group w-full" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              Sign in
              {!pending && <ArrowRight className="transition-transform group-hover:translate-x-0.5" />}
            </Button>
          </form>

          <div className="mt-10">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              Try a demo account
              <span className="h-px flex-1 bg-border" />
            </div>
            <div className="mt-4 grid gap-2">
              {DEMO.map((d) => (
                <button
                  key={d.email}
                  type="button"
                  onClick={() => {
                    setEmail(d.email);
                    setPassword(DEMO_PASSWORD);
                  }}
                  className="group flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5 text-left shadow-xs transition hover:border-foreground/20 hover:shadow-sm"
                >
                  <Avatar name={d.name} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{d.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{d.email}</span>
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {d.role}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Password for all demo accounts: <code className="font-mono text-foreground">{DEMO_PASSWORD}</code>
            </p>
          </div>
        </div>
      </div>

      {/* Showcase column */}
      <div className="relative hidden overflow-hidden bg-zinc-950 text-zinc-50 lg:flex lg:flex-col lg:justify-center">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07] bg-[linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] bg-size-[48px_48px]"
        />
        <div
          aria-hidden
          className="absolute -top-40 left-1/2 size-160 -translate-x-1/2 rounded-full bg-brand/20 blur-3xl"
        />
        <div className="relative mx-auto w-full max-w-md px-10">
          <div className="rotate-[-4deg] overflow-hidden rounded-2xl shadow-[0_40px_120px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/10 transition-transform duration-700 hover:rotate-0">
            <Chessboard
              options={{
                id: "login-showcase",
                position: SHOWCASE_FEN,
                allowDragging: false,
                showNotation: false,
                darkSquareStyle: { backgroundColor: "#8ca2ad" },
                lightSquareStyle: { backgroundColor: "#dee3e6" },
              }}
            />
          </div>
          <div className="mt-14 space-y-5">
            <h2 className="text-3xl font-semibold leading-tight">
              Tournaments that run <span className="text-brand">themselves.</span>
            </h2>
            <ul className="space-y-3">
              {FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-zinc-400">
                  <span className="grid size-7 place-items-center rounded-lg bg-white/5 ring-1 ring-white/10">
                    <Icon className="size-3.5 text-zinc-200" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
