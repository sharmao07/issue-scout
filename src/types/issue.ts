export type SkillLevel =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "unspecified";

export type LevelFilter = "all" | SkillLevel;

export type IssueAgeFilter =
  | "any"
  | "12h"
  | "1d"
  | "2d"
  | "4d"
  | "6d"
  | "1w"
  | "2w"
  | "1m"
  | "2m"
  | "older";

export type IssueStatusFilter = "open" | "closed" | "all";

export type IssueLabel = {
  name: string;
  color: string;
};

export type ScoutIssue = {
  id: number;
  number: number;
  title: string;
  url: string;
  repository: string;
  repositoryUrl: string;
  author: string;
  body: string | null;
  labels: IssueLabel[];
  comments: number;
  createdAt: string;
  updatedAt: string;
  state: "open" | "closed";
  level: SkillLevel;
};

export function isScoutIssue(value: unknown): value is ScoutIssue {
  if (typeof value !== "object" || value === null) return false;

  const issue = value as Partial<ScoutIssue>;
  return (
    typeof issue.id === "number" &&
    typeof issue.number === "number" &&
    typeof issue.title === "string" &&
    typeof issue.url === "string" &&
    typeof issue.repository === "string" &&
    typeof issue.repositoryUrl === "string" &&
    typeof issue.author === "string" &&
    (typeof issue.body === "string" || issue.body === null) &&
    Array.isArray(issue.labels) &&
    issue.labels.every(
      (l) => typeof l?.name === "string" && typeof l?.color === "string",
    ) &&
    typeof issue.comments === "number" &&
    typeof issue.createdAt === "string" &&
    typeof issue.updatedAt === "string" &&
    (issue.state === "open" || issue.state === "closed") &&
    ["beginner", "intermediate", "advanced", "unspecified"].includes(
      issue.level ?? "",
    )
  );
}

// Re-export domain types for convenience
export type {
  ContributionStatus,
  SavedContributionProgress,
  AvailabilityComment,
  AvailabilityPayload,
} from "./contribution";

export type {
  ContributionGuide,
  RepositoryPayload,
} from "./repository";

export type {
  ReadinessSignal,
  ReadinessResult,
} from "./readiness";
