"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Logo } from "@/components/brand";
import { Navbar } from "@/components/navbar";
import { ErrorState } from "@/components/states";
import { post } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user && !error) {
      // Clear a stale cookie first, otherwise the proxy would bounce us back.
      void post("/auth/logout")
        .catch(() => undefined)
        .finally(() => router.replace("/login"));
    }
  }, [isLoading, user, error, router]);

  if (error) {
    return (
      <div className="mx-auto w-full max-w-xl p-6 pt-24">
        <ErrorState error={error} title="Cannot load your session" />
      </div>
    );
  }
  if (isLoading || !user) {
    return (
      <div className="grid flex-1 place-items-center">
        <Logo compact className="animate-pulse" />
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col">
      <div aria-hidden className="bg-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-96" />
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">{children}</main>
    </div>
  );
}
