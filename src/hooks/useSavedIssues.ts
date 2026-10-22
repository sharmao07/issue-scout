"use client";

import { useCallback, useSyncExternalStore } from "react";
import { isScoutIssue, type ScoutIssue } from "@/types/issue";

const STORAGE_KEY = "issue-scout:saved-issues:v1";
const EMPTY_LIST: ScoutIssue[] = [];

let cachedRaw: string | null = null;
let cachedIssues: ScoutIssue[] = EMPTY_LIST;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

export function getSavedIssuesSnapshot(): ScoutIssue[] {
  if (typeof window === "undefined" && typeof localStorage === "undefined") return EMPTY_LIST;

  const raw = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
  if (raw === cachedRaw) return cachedIssues;

  cachedRaw = raw;
  if (!raw) {
    cachedIssues = EMPTY_LIST;
    return cachedIssues;
  }

  try {
    const parsed = JSON.parse(raw);
    cachedIssues = Array.isArray(parsed) ? parsed.filter(isScoutIssue) : EMPTY_LIST;
  } catch {
    cachedIssues = EMPTY_LIST;
  }
  return cachedIssues;
}

export function subscribeToSavedIssues(callback: () => void) {
  listeners.add(callback);
  const handleStorage = (e: StorageEvent) => {
    if (!e.key || e.key === STORAGE_KEY) {
      callback();
    }
  };
  window.addEventListener("storage", handleStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", handleStorage);
  };
}

export function useSavedIssues() {
  const isReady = useSyncExternalStore(
    subscribeToSavedIssues,
    () => true,
    () => false
  );

  const savedIssues = useSyncExternalStore(
    subscribeToSavedIssues,
    getSavedIssuesSnapshot,
    () => EMPTY_LIST
  );

  const toggleSaved = useCallback((issue: ScoutIssue) => {
    const current = getSavedIssuesSnapshot();
    const exists = current.some((item) => item.id === issue.id);
    const next = exists
      ? current.filter((item) => item.id !== issue.id)
      : [issue, ...current];

    try {
      const serialized = JSON.stringify(next);
      localStorage.setItem(STORAGE_KEY, serialized);
      cachedRaw = serialized;
      cachedIssues = next;
      notify();
    } catch {
      // Storage quota or permission issue
    }
  }, []);

  const isSaved = useCallback(
    (issueId: number) => savedIssues.some((item) => item.id === issueId),
    [savedIssues]
  );

  return {
    savedIssues,
    isReady,
    toggleSaved,
    isSaved,
  };
}
