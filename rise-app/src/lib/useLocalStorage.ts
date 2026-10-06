"use client";

import { useCallback, useEffect, useState } from "react";

const PREFIX = "rise:";

export function useLocalStorage<T>(key: string, initial: T) {
  const fullKey = `${PREFIX}${key}`;
  const [value, setValue] = useState<T>(initial);
  // Hydration must be state (not a ref) so the write-effect below only
  // runs on the render that actually carries the loaded value - a ref
  // flips synchronously within the same effect flush as the read, which
  // would let the write-effect fire first with the stale initial value
  // and clobber what was just loaded from storage.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(fullKey);
      if (raw != null) setValue(JSON.parse(raw) as T);
    } catch {
      // ignore malformed storage
    } finally {
      setHydrated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullKey]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(fullKey, JSON.stringify(value));
    } catch {
      // storage unavailable (private mode, quota) - fail silently
    }
  }, [fullKey, value, hydrated]);

  const update = useCallback((updater: T | ((prev: T) => T)) => {
    setValue((prev) =>
      typeof updater === "function" ? (updater as (prev: T) => T)(prev) : updater
    );
  }, []);

  return [value, update] as const;
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
