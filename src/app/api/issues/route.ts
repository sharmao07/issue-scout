
import { inferSkillLevel } from "@/lib/skill-level";
import type { LevelFilter, ScoutIssue, SkillLevel } from "@/types/issue";

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
  pull_request?: unknown;
};

type GitHubSearchResponse = {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubIssue[];
};

const PAGE_SIZE = 50;
const MAX_SEARCH_RESULTS = 1000;
const MAX_PAGES = MAX_SEARCH_RESULTS / PAGE_SIZE;

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

const ALLOWED_LEVELS: LevelFilter[] = [
  "all",
  "beginner",
  "intermediate",
  "advanced",
  "unspecified",
];

const AGE_WINDOWS_MS: Partial<Record<IssueAgeFilter, number>> = {
  "12h": 12 * 60 * 60 * 1000,
  "1d": 24 * 60 * 60 * 1000,
  "2d": 2 * 24 * 60 * 60 * 1000,
  "4d": 4 * 24 * 60 * 60 * 1000,
  "6d": 6 * 24 * 60 * 60 * 1000,
  "1w": 7 * 24 * 60 * 60 * 1000,
  "2w": 14 * 24 * 60 * 60 * 1000,
};

const LEVEL_LABEL_QUERIES: Partial<Record<SkillLevel, string>> = {
  beginner:
    'label:"good first issue","good-first-issue","first-timers-only","beginner","easy"',
  intermediate:
    'label:"intermediate","medium","moderate","mid-level"',
  advanced:
    'label:"advanced","hard","difficult","complex","expert"',
};

function formatGitHubTimestamp(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function formatGitHubDate(date: Date): string {
  return date.toISOString().slice(0, 10);
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

  if (age === "older") {
    const oldest = subtractUtcMonths(now, 12);
    const newest = subtractUtcMonths(now, 3);

    return (
      `created:${formatGitHubDate(oldest)}` +
      `..${formatGitHubDate(newest)}`
    );
  }

  if (age === "1m" || age === "2m") {
    const months = age === "1m" ? 1 : 2;
    const cutoff = subtractUtcMonths(now, months);

    return `created:>=${formatGitHubTimestamp(cutoff)}`;
  }

  const window = AGE_WINDOWS_MS[age];

  if (window !== undefined) {
    const cutoff = new Date(now.getTime() - window);

    return `created:>=${formatGitHubTimestamp(cutoff)}`;
  }

  return null;
}

function sanitizeSearchText(value: string): string {
  return value
    .replace(/[\r\n"]/g, " ")
    .trim()
    .slice(0, 100);
}

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;

    const searchText = sanitizeSearchText(
      params.get("q") ?? "",
    );

    const label = (params.get("label") ?? "")
      .replace(/[^\w .:-]/g, "")
      .trim()
      .slice(0, 60);

    const language = (params.get("language") ?? "")
      .replace(/[^a-zA-Z0-9+#.-]/g, "")
      .slice(0, 40);

    const requestedLevel = params.get("level") ?? "all";

    const level: LevelFilter = ALLOWED_LEVELS.includes(
      requestedLevel as LevelFilter,
    )
      ? (requestedLevel as LevelFilter)
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

    const parsedPage = Number.parseInt(
      params.get("page") ?? "1",
      10,
    );

    const page = Number.isFinite(parsedPage)
      ? Math.max(1, Math.min(MAX_PAGES, parsedPage))
      : 1;

    const queryParts = ["is:issue"];

    // Filter the GitHub search itself by state before pagination.
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

    // Restrict skill-filtered searches to common difficulty labels
    // before pagination. This avoids filling a page with unrelated
    // issues and then filtering almost all of them out.
    if (level !== "all" && level !== "unspecified") {
      const levelQuery = LEVEL_LABEL_QUERIES[level];

      if (levelQuery) {
        queryParts.push(levelQuery);
      }
    }

    const apiUrl = new URL(
      "https://api.github.com/search/issues",
    );

    apiUrl.searchParams.set("q", queryParts.join(" "));
    apiUrl.searchParams.set("per_page", String(PAGE_SIZE));
    apiUrl.searchParams.set("page", String(page));
    apiUrl.searchParams.set("sort", "created");
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

      if (response.status === 422) {
        return Response.json(
          {
            error:
              "GitHub rejected this search. Try simpler keywords or remove a filter.",
          },
          { status: 400 },
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

    // GitHub's issue-search endpoint may also return pull requests.
    // Keep actual issues only.
    const actualIssues = data.items.filter(
      (item) => !item.pull_request,
    );

    const issues: ScoutIssue[] = actualIssues.map((issue) => {
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
        level: inferSkillLevel(labels.map((item) => item.name)),
      };
    });

    // Apply the chosen level after classification. Explicit difficulty
    // labels are also used in the GitHub query for common level filters.
    const filteredIssues =
      level === "all"
        ? issues
        : issues.filter((issue) => issue.level === level);

    const availableCount = Math.min(
      data.total_count,
      MAX_SEARCH_RESULTS,
    );

    const totalPages = Math.max(
      1,
      Math.min(
        MAX_PAGES,
        Math.ceil(availableCount / PAGE_SIZE),
      ),
    );

    return Response.json({
      total_count: data.total_count,
      available_count: availableCount,
      total_pages: totalPages,
      page,
      per_page: PAGE_SIZE,
      returned_count: filteredIssues.length,
      incomplete_results: data.incomplete_results,
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
