"use client";

import { useLocalStorage } from "./useLocalStorage";

export function useXp() {
  const [xp, setXp] = useLocalStorage<number>("xp", 0);

  function addXp(delta: number) {
    setXp((prev) => Math.max(0, prev + delta));
  }

  return [xp, addXp] as const;
}
