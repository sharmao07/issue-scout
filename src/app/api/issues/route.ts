import { inferSkillLevel, SKILL_LEVEL_LABELS } from "@/lib/skill-level";
import { GITHUB_HEADERS } from "@/lib/github";
import type { IssueAgeFilter, IssueStatusFilter, LevelFilter, ScoutIssue } from "@/types/issue";

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
const MIN_ISSUE_AGE_MS = 30 * 60 * 1000; // 30-minute buffer to filter bot spam

const ALLOWED_AGES: IssueAgeFilter[] = [
  "any", "12h", "1d", "2d", "4d", "6d", "1w", "2w", "1m", "2m", "older",
];

const ALLOWED_STATUSES: IssueStatusFilter[] = ["open", "closed", "all"];

const ALLOWED_LEVELS: LevelFilter[] = [
  "all", "beginner", "intermediate", "advanced", "unspecified",
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

function formatGitHubTimestamp(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function formatGitHubDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function subtractMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() - months);
  const maxDays = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, maxDays));
  return result;
}

function getCreatedQualifier(age: IssueAgeFilter, now: Date): string | null {
  if (age === "any") return null;

  if (age === "older") {
    const oldest = subtractMonths(now, 12);
    const newest = subtractMonths(now, 3);
    return `created:${formatGitHubDate(oldest)}..${formatGitHubDate(newest)}`;
  }

  if (age === "1m" || age === "2m") {
    const cutoff = subtractMonths(now, age === "1m" ? 1 : 2);
    return `created:>=${formatGitHubTimestamp(cutoff)}`;
  }

  const windowMs = AGE_WINDOWS_MS[age];
  if (windowMs !== undefined) {
    const cutoff = new Date(now.getTime() - windowMs);
    return `created:>=${formatGitHubTimestamp(cutoff)}`;
  }

  return null;
}

function getLabelVariants(labels: readonly string[]): string[] {
  return [
    ...new Set(
      labels.flatMap((label) => [
        label,
        label.replace(/ /g, "-"),
        label.replace(/ /g, "_"),
      ]),
    ),
  ];
}

function quote(label: string): string {
  return `"${label.replace(/"/g, '\\"')}"`;
}

function appendLevelQualifiers(queryParts: string[], level: LevelFilter): void {
  if (level === "all") return;

  const beginner = getLabelVariants(SKILL_LEVEL_LABELS.beginner);
  const intermediate = getLabelVariants(SKILL_LEVEL_LABELS.intermediate);
  const advanced = getLabelVariants(SKILL_LEVEL_LABELS.advanced);
  const exclude = (labels: string[]) => labels.map((l) => `-label:${quote(l)}`);

  if (level === "unspecified") {
    queryParts.push(...exclude([...beginner, ...intermediate, ...advanced]));
    return;
  }

  const selected =
    level === "beginner" ? beginner : level === "intermediate" ? intermediate : advanced;

  queryParts.push(`label:${selected.map(quote).join(",")}`);

  if (level === "intermediate") {
    queryParts.push(...exclude(beginner));
  } else if (level === "advanced") {
    queryParts.push(...exclude([...beginner, ...intermediate]));
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const queryText = (searchParams.get("q") ?? "").replace(/[\r\n"]/g, " ").trim().slice(0, 100);
    const label = (searchParams.get("label") ?? "").replace(/[^\w .:-]/g, "").trim().slice(0, 60);
    const language = (searchParams.get("language") ?? "").replace(/[^a-zA-Z0-9+#.-]/g, "").slice(0, 40);

    const rawLevel = searchParams.get("level") ?? "all";
    const level: LevelFilter = ALLOWED_LEVELS.includes(rawLevel as LevelFilter)
      ? (rawLevel as LevelFilter)
      : "all";

    const rawAge = searchParams.get("age") ?? "any";
    const age: IssueAgeFilter = ALLOWED_AGES.includes(rawAge as IssueAgeFilter)
      ? (rawAge as IssueAgeFilter)
      : "any";

    const rawStatus = searchParams.get("status") ?? "open";
    const status: IssueStatusFilter = ALLOWED_STATUSES.includes(rawStatus as IssueStatusFilter)
      ? (rawStatus as IssueStatusFilter)
      : "open";

    const parsedPage = Number.parseInt(searchParams.get("page") ?? "1", 10);
    const page = Number.isFinite(parsedPage) ? Math.max(1, Math.min(MAX_PAGES, parsedPage)) : 1;

    const minimumAgeCutoff = new Date(Date.now() - MIN_ISSUE_AGE_MS);
    const queryParts = [
      "is:issue",
      `created:<=${formatGitHubTimestamp(minimumAgeCutoff)}`,
    ];

    if (status !== "all") {
      queryParts.push(`is:${status}`);
    }
    if (queryText) {
      queryParts.push(queryText);
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

    appendLevelQualifiers(queryParts, level);

    const apiUrl = new URL("https://api.github.com/search/issues");
    apiUrl.searchParams.set("q", queryParts.join(" "));
    apiUrl.searchParams.set("per_page", String(PAGE_SIZE));
    apiUrl.searchParams.set("page", String(page));
    apiUrl.searchParams.set("sort", "created");
    apiUrl.searchParams.set("order", "desc");

    const response = await fetch(apiUrl, {
      headers: GITHUB_HEADERS,
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      if (response.status === 403 || response.status === 429) {
        return Response.json(
          { error: "GitHub search is temporarily rate-limited. Wait a little and try again." },
          { status: 429 },
        );
      }
      if (response.status === 422) {
        return Response.json(
          { error: "GitHub rejected this search. Try simpler keywords or remove a filter." },
          { status: 400 },
        );
      }
      return Response.json(
        { error: "GitHub could not complete this search. Please try again later." },
        { status: 502 },
      );
    }

    const data = (await response.json()) as GitHubSearchResponse;

    const actualIssues = data.items.filter(
      (item) => !item.pull_request && Date.parse(item.created_at) <= minimumAgeCutoff.getTime(),
    );

    const issues: ScoutIssue[] = actualIssues.map((issue) => {
      const repository = issue.repository_url.replace("https://api.github.com/repos/", "");
      const issueLabels = issue.labels.map((l) => ({ name: l.name, color: l.color }));

      return {
        id: issue.id,
        number: issue.number,
        title: issue.title,
        url: issue.html_url,
        repository,
        repositoryUrl: `https://github.com/${repository}`,
        author: issue.user?.login ?? "unknown",
        body: issue.body,
        labels: issueLabels,
        comments: issue.comments,
        createdAt: issue.created_at,
        updatedAt: issue.updated_at,
        state: issue.state,
        level: inferSkillLevel(issueLabels.map((l) => l.name)),
      };
    });

    const filteredIssues = level === "all" ? issues : issues.filter((i) => i.level === level);
    const availableCount = Math.min(data.total_count, MAX_SEARCH_RESULTS);
    const totalPages = Math.max(1, Math.min(MAX_PAGES, Math.ceil(availableCount / PAGE_SIZE)));

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
      { error: "Unable to reach GitHub. Check your connection and try again." },
      { status: 500 },
    );
  }
}
