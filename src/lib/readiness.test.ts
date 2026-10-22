import { describe, expect, it } from "vitest";
import { calculateReadiness, getScoreLabel } from "./readiness";
import type { RepositoryPayload } from "@/types/repository";
import type { ScoutIssue } from "@/types/issue";

function createMockIssue(overrides: Partial<ScoutIssue> = {}): ScoutIssue {
  return {
    id: 1,
    number: 101,
    title: "Example issue",
    url: "https://github.com/org/repo/issues/101",
    repository: "org/repo",
    repositoryUrl: "https://github.com/org/repo",
    author: "developer",
    body: "Short description.",
    labels: [{ name: "bug", color: "d73a4a" }],
    comments: 0,
    createdAt: "2026-10-18T12:00:00Z",
    updatedAt: "2026-10-18T12:00:00Z",
    state: "open",
    level: "beginner",
    ...overrides,
  };
}

function createMockRepo(overrides: Partial<RepositoryPayload["repository"]> = {}, guides: RepositoryPayload["contributionGuides"] = []): RepositoryPayload {
  return {
    repository: {
      fullName: "org/repo",
      url: "https://github.com/org/repo",
      description: "A test project",
      stars: 500,
      forks: 50,
      openItems: 10,
      pushedAt: "2026-10-20T12:00:00Z",
      pushedDaysAgo: 1,
      updatedAt: "2026-10-20T12:00:00Z",
      archived: false,
      disabled: false,
      defaultBranch: "main",
      license: "MIT",
      ...overrides,
    },
    contributionGuides: guides,
    contributionGuidesChecked: true,
  };
}

describe("calculateReadiness", () => {
  describe("score labels", () => {
    it.each([
      [95, "Strong signals"],
      [80, "Strong signals"],
      [79, "Promising signals"],
      [60, "Promising signals"],
      [59, "Mixed signals"],
      [40, "Mixed signals"],
      [39, "Limited evidence"],
      [0, "Limited evidence"],
    ])("maps score %i to label %s", (score, expected) => {
      expect(getScoreLabel(score)).toBe(expected);
    });
  });

  describe("issue clarity scoring", () => {
    it("awards full 35 points for long descriptions with structured keywords and labels", () => {
      const issue = createMockIssue({
        body: "A".repeat(500) + "\nSteps to reproduce: 1. Do this. 2. See error.\nExpected behavior: should work.",
        labels: [{ name: "good first issue", color: "7057ff" }],
      });
      const repo = createMockRepo();
      const result = calculateReadiness(issue, repo);
      const clarity = result.signals.find((s) => s.name === "Issue clarity");

      expect(clarity?.score).toBe(35); // 20 (>=500 chars) + 10 (keywords) + 5 (labels)
      expect(clarity?.evidence[1]).toContain("mentions reproduction steps");
    });

    it("handles completely empty or null issue descriptions", () => {
      const issue = createMockIssue({ body: null, labels: [] });
      const repo = createMockRepo();
      const result = calculateReadiness(issue, repo);
      const clarity = result.signals.find((s) => s.name === "Issue clarity");

      expect(clarity?.score).toBe(0);
      expect(clarity?.evidence[0]).toBe("The issue has no written description.");
      expect(clarity?.evidence[2]).toBe("The issue has no labels.");
    });

    it("awards tiered points based on character length without keywords", () => {
      const shortIssue = createMockIssue({ body: "Short bug report", labels: [] });
      const mediumIssue = createMockIssue({ body: "A".repeat(100), labels: [] });
      const longishIssue = createMockIssue({ body: "A".repeat(250), labels: [] });
      const repo = createMockRepo();

      expect(calculateReadiness(shortIssue, repo).signals[0].score).toBe(6);
      expect(calculateReadiness(mediumIssue, repo).signals[0].score).toBe(12);
      expect(calculateReadiness(longishIssue, repo).signals[0].score).toBe(16);
    });

    it("detects structured context keywords like 'acceptance criteria'", () => {
      const issue = createMockIssue({
        body: "A".repeat(80) + " Acceptance criteria: must pass tests.",
        labels: [],
      });
      const repo = createMockRepo();
      const result = calculateReadiness(issue, repo);
      expect(result.signals[0].score).toBe(22); // 12 (length) + 10 (keywords)
    });
  });

  describe("repository activity scoring", () => {
    it("gives 0 activity score and warning evidence for archived repositories", () => {
      const issue = createMockIssue();
      const repo = createMockRepo({ archived: true, pushedDaysAgo: 2 });
      const result = calculateReadiness(issue, repo);
      const activity = result.signals.find((s) => s.name === "Repository activity");

      expect(activity?.score).toBe(0);
      expect(activity?.evidence).toContain("Repository is archived or disabled.");
      expect(activity?.evidence).toContain("Archived repositories may no longer accept contributions.");
    });

    it("gives 0 activity score for disabled repositories", () => {
      const issue = createMockIssue();
      const repo = createMockRepo({ disabled: true, pushedDaysAgo: 1 });
      const result = calculateReadiness(issue, repo);
      const activity = result.signals.find((s) => s.name === "Repository activity");

      expect(activity?.score).toBe(0);
      expect(activity?.evidence).toContain("GitHub reports that this repository is disabled.");
    });

    it.each([
      [0, 35, "last pushed today"],
      [5, 35, "last pushed 5 day(s) ago"],
      [20, 30, "last pushed 20 day(s) ago"],
      [60, 22, "last pushed 60 day(s) ago"],
      [120, 12, "last pushed 120 day(s) ago"],
      [200, 5, "last pushed 200 day(s) ago"],
    ])("scores pushedDaysAgo of %i with %i points", (days, expectedScore, evidenceFragment) => {
      const issue = createMockIssue();
      const repo = createMockRepo({ pushedDaysAgo: days });
      const result = calculateReadiness(issue, repo);
      const activity = result.signals.find((s) => s.name === "Repository activity");

      expect(activity?.score).toBe(expectedScore);
      expect(activity?.evidence[0]).toContain(evidenceFragment);
    });

    it("handles null pushedDaysAgo", () => {
      const issue = createMockIssue();
      const repo = createMockRepo({ pushedDaysAgo: null });
      const result = calculateReadiness(issue, repo);
      const activity = result.signals.find((s) => s.name === "Repository activity");

      expect(activity?.score).toBe(0);
      expect(activity?.evidence[0]).toBe("A valid repository last-push date was not available.");
    });
  });

  describe("contribution documentation scoring", () => {
    it("awards 30 points when a CONTRIBUTING guide exists", () => {
      const issue = createMockIssue();
      const repo = createMockRepo({}, [{ path: "CONTRIBUTING.md", url: "https://example.com" }]);
      const result = calculateReadiness(issue, repo);
      const docs = result.signals.find((s) => s.name === "Contribution documentation");

      expect(docs?.score).toBe(30);
      expect(docs?.evidence[0]).toBe("Found 1 contribution guide file(s).");
      expect(docs?.evidence[1]).toBe("CONTRIBUTING.md");
    });

    it("awards partial 8 points when no CONTRIBUTING guide was found", () => {
      const issue = createMockIssue();
      const repo = createMockRepo({}, []);
      const result = calculateReadiness(issue, repo);
      const docs = result.signals.find((s) => s.name === "Contribution documentation");

      expect(docs?.score).toBe(8);
      expect(docs?.evidence[0]).toContain("No CONTRIBUTING.md file was found");
      expect(docs?.evidence[1]).toContain("Check the README");
    });
  });

  describe("overall score aggregation", () => {
    it("aggregates all 3 signals into a total score and label", () => {
      const issue = createMockIssue({
        body: "A".repeat(500) + " Steps to reproduce: run app.",
        labels: [{ name: "help wanted", color: "123456" }],
      });
      const repo = createMockRepo({ pushedDaysAgo: 1 }, [{ path: ".github/CONTRIBUTING.md", url: "https://example.com" }]);
      const result = calculateReadiness(issue, repo);

      // Clarity: 35, Activity: 35, Docs: 30 = 100
      expect(result.totalScore).toBe(100);
      expect(result.label).toBe("Strong signals");
    });
  });
});
