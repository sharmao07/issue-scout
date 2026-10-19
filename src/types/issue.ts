export type SkillLevel =
  | "beginner"
  | "intermediate"
  | "advanced";

export type LevelFilter = "all" | SkillLevel;

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
  level: SkillLevel;
};