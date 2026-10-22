import type { IssueLabel } from "./issue";

export type ContributionStatus =
  | "not-started"
  | "investigating"
  | "working"
  | "pr-opened"
  | "completed";

export type SavedContributionProgress = {
  checkedSteps: boolean[];
  status: ContributionStatus;
  notes: string;
  pullRequestUrl: string;
};

export type AvailabilityComment = {
  id: number;
  url: string;
  author: string;
  body: string | null;
  createdAt: string;
};

export type AvailabilityPayload = {
  issue: {
    number: number;
    title: string;
    url: string;
    state: "open" | "closed";
    locked: boolean;
    activeLockReason: string | null;
    assignees: Array<{
      login: string;
      url: string;
    }>;
    stateReason: string | null;
    closedAt: string | null;
    createdAt: string;
    updatedAt: string;
    commentCount: number;
    labels: IssueLabel[];
  };
  recentComments: AvailabilityComment[];
  recentCommentsAvailable: boolean;
};
