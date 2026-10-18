"use client";

import { useSyncExternalStore } from "react";

import { THEME_STORAGE_KEY } from "./theme-script";

export type Theme = "light" | "dark";

const listeners = new Set<() => void>();

function current(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function setTheme(theme: Theme): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* storage blocked: the choice just won't persist */
  }
  listeners.forEach((l) => l());
}

export function useTheme(): Theme {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    current,
    () => "light",
  );
}
