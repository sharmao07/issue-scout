"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { ContributionStatus, SavedContributionProgress } from "@/types/contribution";

export const CHECKLIST_STEPS = [
  "Read the issue description and recent discussion.",
  "Check whether someone is already working on the issue.",
  "Read the contribution guide and code of conduct, if available.",
  "Reproduce the bug or understand the requested behavior.",
  "Find the relevant files and plan a focused change.",
  "Create a branch, implement the change, and run relevant tests.",
  "Review your diff and commit with a clear message.",
  "Open a pull request and link the original issue.",
];

export const CONTRIBUTION_STORAGE_PREFIX = "issue-scout:contribution-progress:v1:";

function isValidStatus(val: unknown): val is ContributionStatus {
  return (
    val === "not-started" ||
    val === "investigating" ||
    val === "working" ||
    val === "pr-opened" ||
    val === "completed"
  );
}

export function validatePullRequestUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());
    if (
      url.protocol === "https:" &&
      url.hostname === "github.com" &&
      url.port === "" &&
      /^\/[^/]+\/[^/]+\/pull\/\d+\/?$/.test(url.pathname)
    ) {
      return url.href;
    }
  } catch {
    // Incomplete or invalid URL
  }
  return null;
}

const defaultProgress: SavedContributionProgress = {
  checkedSteps: Array(CHECKLIST_STEPS.length).fill(false),
  status: "not-started",
  notes: "",
  pullRequestUrl: "",
};

const progressCache = new Map<string, { raw: string | null; parsed: SavedContributionProgress }>();
const subscribersByKey = new Map<string, Set<() => void>>();

function notifyKey(key: string) {
  const set = subscribersByKey.get(key);
  if (set) {
    for (const callback of set) {
      callback();
    }
  }
}

export function getProgressSnapshot(storageKey: string): SavedContributionProgress {
  if (typeof window === "undefined" && typeof localStorage === "undefined") return defaultProgress;

  const raw = typeof localStorage !== "undefined" ? localStorage.getItem(storageKey) : null;
  const entry = progressCache.get(storageKey);
  if (entry && entry.raw === raw) return entry.parsed;

  if (!raw) {
    progressCache.set(storageKey, { raw: null, parsed: defaultProgress });
    return defaultProgress;
  }

  try {
    const parsed = JSON.parse(raw);
    const result: SavedContributionProgress = {
      checkedSteps: Array(CHECKLIST_STEPS.length).fill(false),
      status: "not-started",
      notes: "",
      pullRequestUrl: "",
    };

    // Supports legacy format (array of booleans)
    if (Array.isArray(parsed)) {
      result.checkedSteps = CHECKLIST_STEPS.map((_, i) => parsed[i] === true);
    } else if (parsed && typeof parsed === "object") {
      if (
        Array.isArray(parsed.checkedSteps) &&
        parsed.checkedSteps.length === CHECKLIST_STEPS.length
      ) {
        result.checkedSteps = CHECKLIST_STEPS.map((_, i) => parsed.checkedSteps[i] === true);
      }
      if (isValidStatus(parsed.status)) {
        result.status = parsed.status;
      }
      if (typeof parsed.notes === "string") {
        result.notes = parsed.notes;
      }
      if (typeof parsed.pullRequestUrl === "string") {
        result.pullRequestUrl = parsed.pullRequestUrl;
      }
    }

    progressCache.set(storageKey, { raw, parsed: result });
    return result;
  } catch {
    progressCache.set(storageKey, { raw, parsed: defaultProgress });
    return defaultProgress;
  }
}

function saveProgress(storageKey: string, next: SavedContributionProgress) {
  try {
    const raw = JSON.stringify(next);
    localStorage.setItem(storageKey, raw);
    progressCache.set(storageKey, { raw, parsed: next });
    notifyKey(storageKey);
  } catch {
    // Storage quota or permission issue
  }
}

export function useContributionProgress(issueUrl: string) {
  const storageKey = CONTRIBUTION_STORAGE_PREFIX + encodeURIComponent(issueUrl);

  const subscribe = useCallback((callback: () => void) => {
    let set = subscribersByKey.get(storageKey);
    if (!set) {
      set = new Set();
      subscribersByKey.set(storageKey, set);
    }
    set.add(callback);

    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key === storageKey) {
        callback();
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      set.delete(callback);
      if (set.size === 0) {
        subscribersByKey.delete(storageKey);
      }
      window.removeEventListener("storage", handleStorage);
    };
  }, [storageKey]);

  const progress = useSyncExternalStore(
    subscribe,
    () => getProgressSnapshot(storageKey),
    () => defaultProgress
  );

  const setStatus = useCallback((status: ContributionStatus) => {
    const current = getProgressSnapshot(storageKey);
    saveProgress(storageKey, { ...current, status });
  }, [storageKey]);

  const setNotes = useCallback((notes: string) => {
    const current = getProgressSnapshot(storageKey);
    saveProgress(storageKey, { ...current, notes });
  }, [storageKey]);

  const setPullRequestUrl = useCallback((pullRequestUrl: string) => {
    const current = getProgressSnapshot(storageKey);
    saveProgress(storageKey, { ...current, pullRequestUrl });
  }, [storageKey]);

  const toggleStep = useCallback((index: number) => {
    const current = getProgressSnapshot(storageKey);
    const checkedSteps = current.checkedSteps.map((val, i) => (i === index ? !val : val));
    saveProgress(storageKey, { ...current, checkedSteps });
  }, [storageKey]);

  const resetChecklist = useCallback(() => {
    const current = getProgressSnapshot(storageKey);
    saveProgress(storageKey, {
      ...current,
      checkedSteps: Array(CHECKLIST_STEPS.length).fill(false),
    });
  }, [storageKey]);

  const completedSteps = progress.checkedSteps.filter(Boolean).length;
  const completionPercent = Math.round((completedSteps / CHECKLIST_STEPS.length) * 100);
  const validPullRequestUrl = validatePullRequestUrl(progress.pullRequestUrl);

  return {
    checkedSteps: progress.checkedSteps,
    status: progress.status,
    notes: progress.notes,
    pullRequestUrl: progress.pullRequestUrl,
    validPullRequestUrl,
    completedSteps,
    completionPercent,
    setStatus,
    setNotes,
    setPullRequestUrl,
    toggleStep,
    resetChecklist,
  };
}
