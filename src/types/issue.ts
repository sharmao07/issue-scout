export type SkillLevel =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "unspecified";

export type LevelFilter = "all" | SkillLevel;

export type IssueLabel = {
  name: string;
  color: string;
};

export type ScoutIssue = {
  state: "open" | "closed"
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
  level: SkillLevel;
};