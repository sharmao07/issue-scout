import { beforeEach, describe, expect, it } from "vitest";
import { getSavedIssuesSnapshot } from "./useSavedIssues";
import type { ScoutIssue } from "@/types/issue";

const STORAGE_KEY = "issue-scout:saved-issues:v1";

const mockIssue: ScoutIssue = {
  id: 42,
  number: 1,
  title: "Test issue",
  url: "https://github.com/org/repo/issues/1",
  repository: "org/repo",
  repositoryUrl: "https://github.com/org/repo",
  author: "alice",
  body: "Issue description",
  labels: [{ name: "bug", color: "red" }],
  comments: 0,
  createdAt: "2026-10-18T12:00:00Z",
  updatedAt: "2026-10-18T12:00:00Z",
  state: "open",
  level: "beginner",
};

// Simple in-memory localStorage mock for node test environment
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

describe("SavedIssues store", () => {
  beforeEach(() => {
    storageMock.clear();
  });

  it("returns an empty array when nothing is stored", () => {
    expect(getSavedIssuesSnapshot()).toEqual([]);
  });

  it("returns parsed valid scout issues from localStorage", () => {
    storageMock.setItem(STORAGE_KEY, JSON.stringify([mockIssue]));
    const result = getSavedIssuesSnapshot();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(42);
  });

  it("filters out invalid or malformed entries", () => {
    storageMock.setItem(
      STORAGE_KEY,
      JSON.stringify([mockIssue, { id: "not-a-number", title: 123 }]),
    );
    const result = getSavedIssuesSnapshot();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(42);
  });

  it("safely handles corrupted non-JSON strings", () => {
    storageMock.setItem(STORAGE_KEY, "{corrupt-json");
    expect(getSavedIssuesSnapshot()).toEqual([]);
  });

  it("maintains referential stability when raw data is unchanged", () => {
    storageMock.setItem(STORAGE_KEY, JSON.stringify([mockIssue]));
    const firstCall = getSavedIssuesSnapshot();
    const secondCall = getSavedIssuesSnapshot();
    expect(firstCall).toBe(secondCall);
  });
});
