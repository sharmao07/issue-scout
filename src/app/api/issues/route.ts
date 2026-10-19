
import { inferSkillLevel } from "@/lib/skill-level";
import type { ScoutIssue } from "@/types/issue";

type IssueAgeFilter =
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

type IssueStatusFilter = "open" | "closed" | "all";

type GitHubIssue = {
  id: number;
  number: number;
  title: string;
  html_url: string;
  repository_url: string;
  user: { login: string } | null;
  body: string | null;
  state: "open" | "closed";
  labels: Array<{ name: string; color: string }>;
  comments: number;
  created_at: string;
  updated_at: string;
};

type GitHubSearchResponse = {
  total_count: number;
  items: GitHubIssue[];
};

const ALLOWED_AGES: IssueAgeFilter[] = [
  "any",
  "12h",
  "1d",
  "2d",
  "4d",
  "6d",
  "1w",
  "2w",
  "1m",
  "2m",
  "older",
];

const ALLOWED_STATUSES: IssueStatusFilter[] = [
  "open",
  "closed",
  "all",
];

const ALLOWED_LEVELS = [
  "all",
  "beginner",
  "intermediate",
  "advanced",
  "unspecified",
] as const;

const AGE_WINDOWS_MS: Partial<Record<IssueAgeFilter, number>> = {
  "12h": 12 * 60 * 60 * 1000,
  "1d": 24 * 60 * 60 * 1000,
  "2d": 2 * 24 * 60 * 60 * 1000,
  "4d": 4 * 24 * 60 * 60 * 1000,
  "6d": 6 * 24 * 60 * 60 * 1000,
  "1w": 7 * 24 * 60 * 60 * 1000,
  "2w": 14 * 24 * 60 * 60 * 1000,
};

function formatGitHubTimestamp(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function subtractUtcMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const originalDay = result.getUTCDate();

  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() - months);

  const lastDayOfTargetMonth = new Date(
    Date.UTC(
      result.getUTCFullYear(),
      result.getUTCMonth() + 1,
      0,
    ),
  ).getUTCDate();

  result.setUTCDate(Math.min(originalDay, lastDayOfTargetMonth));

  return result;
}

function getCreatedQualifier(
  age: IssueAgeFilter,
  now: Date,
): string | null {
  if (age === "any") {
    return null;
  }

  if (age === "1m" || age === "2m") {
    const months = age === "1m" ? 1 : 2;
    const cutoff = subtractUtcMonths(now, months);

    return `created:>=${formatGitHubTimestamp(cutoff)}`;
  }

  if (age === "older") {
    const oldest = subtractUtcMonths(now, 12);
    const newest = subtractUtcMonths(now, 3);

    return (
      `created:${formatGitHubTimestamp(oldest)}` +
      `..${formatGitHubTimestamp(newest)}`
    );
  }

  const window = AGE_WINDOWS_MS[age];

  if (window) {
    const cutoff = new Date(now.getTime() - window);

    return `created:>=${formatGitHubTimestamp(cutoff)}`;
  }

  return null;
}

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;

    const searchText = (params.get("q") ?? "")
      .replace(/[\r\n"]/g, " ")
      .trim()
      .slice(0, 100);

    const label = (params.get("label") ?? "")
      .replace(/[^\w .:-]/g, "")
      .trim()
      .slice(0, 60);

    const language = (params.get("language") ?? "")
      .replace(/[^a-zA-Z0-9+#.-]/g, "")
      .slice(0, 40);

    const requestedLevel = params.get("level") ?? "all";
    const level = ALLOWED_LEVELS.includes(
      requestedLevel as (typeof ALLOWED_LEVELS)[number],
    )
      ? requestedLevel
      : "all";

    const requestedAge = params.get("age") ?? "any";
    const age: IssueAgeFilter = ALLOWED_AGES.includes(
      requestedAge as IssueAgeFilter,
    )
      ? (requestedAge as IssueAgeFilter)
      : "any";

    const requestedStatus = params.get("status") ?? "open";
    const status: IssueStatusFilter = ALLOWED_STATUSES.includes(
      requestedStatus as IssueStatusFilter,
    )
      ? (requestedStatus as IssueStatusFilter)
      : "open";

    const queryParts = ["is:issue"];

    if (status !== "all") {
      queryParts.push(`is:${status}`);
    }

    if (searchText) {
      queryParts.push(searchText);
    }

    if (label) {
      queryParts.push(`label:"${label}"`);
    }

    if (language) {
      queryParts.push(`language:${language}`);
    }

    const createdFilter = getCreatedQualifier(age, new Date());

    if (createdFilter) {
      queryParts.push(createdFilter);
    }

    const apiUrl = new URL(
      "https://api.github.com/search/issues",
    );

    apiUrl.searchParams.set("q", queryParts.join(" "));
    apiUrl.searchParams.set("per_page", "100");
    apiUrl.searchParams.set("sort", "updated");
    apiUrl.searchParams.set("order", "desc");

    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      if (response.status === 403 || response.status === 429) {
        return Response.json(
          {
            error:
              "GitHub search is temporarily rate-limited. Wait a little and try again.",
          },
          { status: 429 },
        );
      }

      return Response.json(
        {
          error:
            "GitHub could not complete this search. Please try again later.",
        },
        { status: 502 },
      );
    }

    const data =
      (await response.json()) as GitHubSearchResponse;

    const issues: ScoutIssue[] = data.items.map((issue) => {
      const repository = issue.repository_url.replace(
        "https://api.github.com/repos/",
        "",
      );

      const labels = issue.labels.map((item) => ({
        name: item.name,
        color: item.color,
      }));

      return {
        id: issue.id,
        number: issue.number,
        title: issue.title,
        url: issue.html_url,
        repository,
        repositoryUrl: `https://github.com/${repository}`,
        author: issue.user?.login ?? "unknown",
        body: issue.body,
        labels,
        comments: issue.comments,
        createdAt: issue.created_at,
        updatedAt: issue.updated_at,
        state: issue.state,
        level: inferSkillLevel(
          labels.map((item) => item.name),
          issue.title,
          issue.body ??"",
      ),
      };
    });

    const filteredIssues =
      level === "all"
        ? issues
        : issues.filter((issue) => issue.level === level);

    return Response.json({
      total_count: data.total_count,
      returned_count: filteredIssues.length,
      issues: filteredIssues,
    });
  } catch {
    return Response.json(
      {
        error:
          "Unable to reach GitHub. Check your connection and try again.",
      },
      { status: 500 },
    );
  }
}
