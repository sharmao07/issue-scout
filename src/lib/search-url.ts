import type { LevelFilter } from "@/types/issue";

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

export type SearchUrlState = {
  query: string;
  language: string;
  label: string;
  level: LevelFilter;
  age: IssueAgeFilter;
  status: IssueStatusFilter;
  page: number;
};

export const DEFAULT_SEARCH_STATE: SearchUrlState = {
  query: "",
  language: "",
  label: "",
  level: "all",
  age: "any",
  status: "open",
  page: 1,
};

const ALLOWED_LEVELS: LevelFilter[] = [
  "all",
  "beginner",
  "intermediate",
  "advanced",
  "unspecified",
];

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

const MAX_PAGES = 20;

export function parseSearchUrl(search: string): {
  state: SearchUrlState;
  autoSearch: boolean;
} {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );

  const rawLevel = params.get("level") ?? "";
  const rawAge = params.get("age") ?? "";
  const rawStatus = params.get("status") ?? "";

  const requestedPage = params.get("page") ?? "1";

  const parsedPage = /^\d+$/.test(requestedPage)
    ? Number(requestedPage)
    : 1;

  const page = Number.isSafeInteger(parsedPage)
    ? Math.max(1, Math.min(MAX_PAGES, parsedPage))
    : 1;

  return {
    state: {
      query: (params.get("q") ?? "").slice(0, 100),
      language: (params.get("language") ?? "").slice(0, 40),
      label: (params.get("label") ?? "").slice(0, 60),

      level: ALLOWED_LEVELS.includes(rawLevel as LevelFilter)
        ? (rawLevel as LevelFilter)
        : "all",

      age: ALLOWED_AGES.includes(rawAge as IssueAgeFilter)
        ? (rawAge as IssueAgeFilter)
        : "any",

      status: ALLOWED_STATUSES.includes(
        rawStatus as IssueStatusFilter,
      )
        ? (rawStatus as IssueStatusFilter)
        : "open",

      page,
    },

    // Shared search links will explicitly set search=1.
    autoSearch: params.get("search") === "1",
  };
}

export function buildSearchUrl(
  state: SearchUrlState,
  baseUrl: string,
): string {
  const url = new URL(baseUrl);

  // Search links always open the Issue Scout home page.
  url.pathname = "/";
  url.search = "";
  url.hash = "";

  const params = new URLSearchParams({
    search: "1",
    q: state.query.trim(),
    language: state.language,
    label: state.label,
    level: state.level,
    age: state.age,
    status: state.status,
    page: String(
      Math.max(1, Math.min(MAX_PAGES, state.page)),
    ),
  });

  url.search = params.toString();

  return url.toString();
}