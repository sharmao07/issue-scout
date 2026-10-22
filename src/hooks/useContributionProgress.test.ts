import { beforeEach, describe, expect, it } from "vitest";
import {
  CHECKLIST_STEPS,
  CONTRIBUTION_STORAGE_PREFIX,
  getProgressSnapshot,
  validatePullRequestUrl,
} from "./useContributionProgress";

const storageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: storageMock,
  writable: true,
});

describe("ContributionProgress store", () => {
  const issueA = "https://github.com/org/repo/issues/100";
  const issueB = "https://github.com/org/repo/issues/200";
  const keyA = CONTRIBUTION_STORAGE_PREFIX + encodeURIComponent(issueA);
  const keyB = CONTRIBUTION_STORAGE_PREFIX + encodeURIComponent(issueB);

  beforeEach(() => {
    storageMock.clear();
  });

  describe("validatePullRequestUrl", () => {
    it("accepts valid GitHub PR URLs", () => {
      expect(validatePullRequestUrl("https://github.com/facebook/react/pull/1234")).toBe(
        "https://github.com/facebook/react/pull/1234",
      );
      expect(validatePullRequestUrl("  https://github.com/owner/repo/pull/1/  ")).toBe(
        "https://github.com/owner/repo/pull/1/",
      );
    });

    it("rejects non-PR URLs, HTTP protocol, and non-github domains", () => {
      expect(validatePullRequestUrl("http://github.com/owner/repo/pull/1")).toBeNull();
      expect(validatePullRequestUrl("https://gitlab.com/owner/repo/pull/1")).toBeNull();
      expect(validatePullRequestUrl("https://github.com/owner/repo/issues/1")).toBeNull();
      expect(validatePullRequestUrl("not-a-url")).toBeNull();
    });
  });

  describe("per-issue progress isolation", () => {
    it("keeps Issue A and Issue B completely separate", () => {
      storageMock.setItem(
        keyA,
        JSON.stringify({
          checkedSteps: [true, true, false, false, false, false, false, false],
          status: "working",
          notes: "Notes for issue A",
          pullRequestUrl: "https://github.com/org/repo/pull/10",
        }),
      );

      const progressA = getProgressSnapshot(keyA);
      const progressB = getProgressSnapshot(keyB);

      // Issue A has its data
      expect(progressA.status).toBe("working");
      expect(progressA.notes).toBe("Notes for issue A");
      expect(progressA.checkedSteps[0]).toBe(true);

      // Issue B is clean default state
      expect(progressB.status).toBe("not-started");
      expect(progressB.notes).toBe("");
      expect(progressB.checkedSteps.every((s) => s === false)).toBe(true);
    });
  });

  describe("backward compatibility with legacy format", () => {
    it("correctly restores legacy boolean array checklists", () => {
      const legacyArray = [true, false, true, false, true, false, false, false];
      storageMock.setItem(keyA, JSON.stringify(legacyArray));

      const progress = getProgressSnapshot(keyA);
      expect(progress.checkedSteps).toEqual(legacyArray);
      expect(progress.status).toBe("not-started");
      expect(progress.notes).toBe("");
    });
  });

  describe("resilience and stability", () => {
    it("handles corrupted JSON gracefully", () => {
      storageMock.setItem(keyA, "{broken-json");
      const progress = getProgressSnapshot(keyA);
      expect(progress.checkedSteps).toHaveLength(CHECKLIST_STEPS.length);
      expect(progress.status).toBe("not-started");
    });

    it("maintains referential stability for unchanged storage items", () => {
      storageMock.setItem(
        keyA,
        JSON.stringify({
          checkedSteps: [true, false, false, false, false, false, false, false],
          status: "investigating",
          notes: "Memo",
          pullRequestUrl: "",
        }),
      );

      const first = getProgressSnapshot(keyA);
      const second = getProgressSnapshot(keyA);
      expect(first).toBe(second);
    });
  });
});
