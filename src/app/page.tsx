
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import type { LevelFilter, ScoutIssue } from "@/types/issue";

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

type SearchResponse = {
  total_count: number;
  available_count: number;
  total_pages: number;
  page: number;
  per_page: number;
  returned_count: number;
  incomplete_results?: boolean;
  issues: ScoutIssue[];
};

type SearchError = {
  error?: string;
};

const LANGUAGES = [
  "Python",
  "TypeScript",
  "JavaScript",
  "Java",
  "C",
  "C++",
  "C#",
  "Go",
  "Rust",
  "Swift",
  "Kotlin",
  "PHP",
  "Ruby",
  "Dart",
  "Elixir",
  "Erlang",
  "Haskell",
  "Julia",
  "Lua",
  "MATLAB",
  "Perl",
  "PowerShell",
  "R",
  "Scala",
  "Shell",
  "SQL",
  "HTML",
  "CSS",
  "Objective-C",
  "Clojure",
  "F#",
  "OCaml",
  "Fortran",
  "Assembly",
];

const SELECT_CLASS =
  "w-full min-w-0 rounded-xl border border-white/10 bg-[#101626] px-4 py-3.5 text-sm text-slate-100 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/10";

const LABEL_CLASS =
  "mb-2.5 block text-sm font-semibold text-slate-300";

export default function Home() {
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("");
  const [label, setLabel] = useState("");
  const [level, setLevel] = useState<LevelFilter>("all");
  const [age, setAge] = useState<IssueAgeFilter>("any");
  const [status, setStatus] = useState<IssueStatusFilter>("open");

  const [issues, setIssues] = useState<ScoutIssue[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [availableCount, setAvailableCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  function applyQuickStart(preset: {
  query: string;
  language: string;
  label: string;
  level: LevelFilter;
  }) {
  setQuery(preset.query);
  setLanguage(preset.language);
  setLabel(preset.label);
  setLevel(preset.level);

  setAge("any");
  setStatus("open");

  setIssues([]);
  setTotalCount(0);
  setAvailableCount(0);
  setTotalPages(1);
  setPage(1);

  setError("");
  setSearched(false);
}

  async function runSearch(requestedPage: number) {
    const safePage = Math.max(1, Math.min(20, requestedPage));

    setLoading(true);
    setError("");
    setSearched(true);
    setIssues([]);

    try {
      const params = new URLSearchParams({
        q: query.trim(),
        language,
        label,
        level,
        age,
        status,
        page: String(safePage),
      });

      const response = await fetch(
        `/api/issues?${params.toString()}`,
        {
          headers: {
            Accept: "application/json",
          },
        },
      );

      const data = (await response.json()) as
        | SearchResponse
        | SearchError;

      if (
        !response.ok ||
        !("issues" in data) ||
        !Array.isArray(data.issues)
      ) {
        const message =
          "error" in data && typeof data.error === "string"
            ? data.error
            : "Issue search failed. Please try again.";

        throw new Error(message);
      }

      setIssues(data.issues);
      setTotalCount(
        typeof data.total_count === "number"
          ? data.total_count
          : data.issues.length,
      );
      setAvailableCount(
        typeof data.available_count === "number"
          ? data.available_count
          : data.issues.length,
      );
      setTotalPages(
        typeof data.total_pages === "number"
          ? Math.max(1, Math.min(20, data.total_pages))
          : 1,
      );
      setPage(
        typeof data.page === "number" ? data.page : safePage,
      );
    } catch (reason) {
      setIssues([]);
      setTotalCount(0);
      setAvailableCount(0);
      setTotalPages(1);
      setPage(1);

      setError(
        reason instanceof Error
          ? reason.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runSearch(1);
  }

  function resetFilters() {
    setQuery("");
    setLanguage("");
    setLabel("");
    setLevel("all");
    setAge("any");
    setStatus("open");

    setIssues([]);
    setTotalCount(0);
    setAvailableCount(0);
    setTotalPages(1);
    setPage(1);

    setError("");
    setSearched(false);
  }

  return (
    <main className="min-h-screen bg-[#080b16] text-slate-100">
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-white/10 py-4">
          <Link
            href="/"
            aria-label="Issue Scout home"
            className="text-lg font-bold tracking-tight sm:text-xl"
          >
            ISSUE<span className="text-cyan-300">SCOUT</span>
            <span className="ml-2 hidden text-xs font-medium tracking-normal text-slate-500 sm:inline">
              OPEN SOURCE DISCOVERY
            </span>
          </Link>

          <a
            href="https://github.com/sharmao07/issue-scout"
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-white/15 px-3 py-2 font-mono text-xs uppercase tracking-wide transition hover:border-cyan-300/50 hover:bg-white/5"
          >
            GitHub <span aria-hidden="true">↗</span>
          </a>
        </header>

        <section className="pb-16 pt-12 sm:pt-16">
          <div className="mb-9 max-w-3xl">
            <p className="mb-5 font-mono text-xs uppercase tracking-[0.14em] text-cyan-200">
              [ Open-source issue discovery ]
            </p>

            <h1 className="text-4xl font-semibold leading-[1.05] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
              Find issues.
              <br />
              Build something{" "}
              <span className="text-cyan-300">real.</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
              Discover open-source opportunities that match your
              interests, preferred technologies and experience.
              Find an issue and start contributing.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 border-y border-white/10 sm:grid-cols-3">
            <div className="flex gap-3 border-b border-white/10 py-4 sm:border-b-0 sm:border-r sm:pr-4">
              <span className="font-mono text-xs text-cyan-300">01</span>
              <div>
                <p className="text-sm font-semibold">Search</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Find public GitHub issues.
                </p>
              </div>
            </div>

            <div className="flex gap-3 border-b border-white/10 py-4 sm:border-b-0 sm:border-r sm:px-4">
              <span className="font-mono text-xs text-cyan-300">02</span>
              <div>
                <p className="text-sm font-semibold">Refine</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Filter by skills and interests.
                </p>
              </div>
            </div>

            <div className="flex gap-3 py-4 sm:pl-4">
              <span className="font-mono text-xs text-cyan-300">03</span>
              <div>
                <p className="text-sm font-semibold">Contribute</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Open an issue on GitHub.
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSearch}
            className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1220] shadow-2xl shadow-black/20"
          >
            <div className="border-b border-white/10 p-5 sm:p-7">
              <label htmlFor="query" className={LABEL_CLASS}>
                What do you want to work on?
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative min-w-0 flex-1">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-500"
                  >
                    ⌕
                  </span>

                  <input
                    id="query"
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Try Python, documentation, bug fixes..."
                    className="w-full rounded-xl border border-white/10 bg-[#101626] py-4 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-500 focus:border-cyan-300 sm:text-base"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-cyan-300 px-6 py-4 text-sm font-bold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-60 sm:min-w-40"
                >
                  {loading ? "Searching..." : "Find issues →"}
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="mr-1 text-xs font-medium text-slate-500">
                  Quick start:
                </span>
                <button
                  type="button"
                  onClick={() => 
                    applyQuickStart({
                      query: "",
                      language: "",
                      label: "good first issue",
                      level: "beginner",
                  })
                }
                  className="rounded-full border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-300/40 hover:text-cyan-200"
                >
                  Beginner-friendly
                </button>
                <button
                  type="button"
                 onClick={() =>
                    applyQuickStart({
                      query: "",
                      language: "",
                      label: "documentation",
                      level: "all",
                    })
                  }
                  className="rounded-full border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-300/40 hover:text-cyan-200"
                >
                  Documentation
                </button>
                <button
                  type="button"
                  onClick={() =>
                    applyQuickStart({
                      query: "",
                      language: "",
                      label: "bug",
                      level: "all",
                    })
                  }
                  className="rounded-full border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-300/40 hover:text-cyan-200"
                >
                  Bug fixes
                </button>
                <button
                  type="button"
                  onClick={() =>
                    applyQuickStart({
                      query: "",
                      language: "Python",
                      label: "",
                      level: "all",
                    })
                  }
                  className="rounded-full border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-300/40 hover:text-cyan-200"
                >
                  Python
                </button>
              </div>
              <p className="mt-3 font-mono text-xs leading-5 text-slate-500">
                Pick a starting point, adjust the filters, then select Find issues.
              </p>
            </div>

            <div className="p-5 sm:p-7">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="mb-2 font-mono text-xs uppercase tracking-[0.14em] text-slate-500">
                    [ Search parameters ]
                  </p>
                  <h2 className="font-bold text-slate-100">
                    Refine your search
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Combine filters to find relevant issues.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-white/5 hover:text-cyan-200"
                >
                  Reset filters
                </button>
              </div>

              <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <div className="min-w-0">
                  <label htmlFor="language" className={LABEL_CLASS}>
                    Programming language
                  </label>

                  <select
                    id="language"
                    value={language}
                    onChange={(event) => setLanguage(event.target.value)}
                    className={SELECT_CLASS}
                  >
                    <option value="">Any language</option>
                    {LANGUAGES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="min-w-0">
                  <label htmlFor="label" className={LABEL_CLASS}>
                    Issue label
                  </label>

                  <select
                    id="label"
                    value={label}
                    onChange={(event) => setLabel(event.target.value)}
                    className={SELECT_CLASS}
                  >
                    <option value="">Any label</option>
                    <option value="good first issue">
                      Good first issue
                    </option>
                    <option value="help wanted">Help wanted</option>
                    <option value="bug">Bug</option>
                    <option value="documentation">
                      Documentation
                    </option>
                  </select>
                </div>

                <div className="min-w-0">
                  <label htmlFor="level" className={LABEL_CLASS}>
                    Suggested skill level
                  </label>

                  <select
                    id="level"
                    value={level}
                    onChange={(event) =>
                      setLevel(event.target.value as LevelFilter)
                    }
                    className={SELECT_CLASS}
                  >
                    <option value="all">Any level</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="unspecified">Unspecified</option>
                  </select>
                </div>

                <div className="min-w-0">
                  <label htmlFor="age" className={LABEL_CLASS}>
                    Creation date
                  </label>

                  <select
                    id="age"
                    value={age}
                    onChange={(event) =>
                      setAge(event.target.value as IssueAgeFilter)
                    }
                    className={SELECT_CLASS}
                  >
                    <option value="any">Any time</option>
                    <option value="12h">Last 12 hours</option>
                    <option value="1d">Last 1 day</option>
                    <option value="2d">Last 2 days</option>
                    <option value="4d">Last 4 days</option>
                    <option value="6d">Last 6 days</option>
                    <option value="1w">Last 1 week</option>
                    <option value="2w">Last 2 weeks</option>
                    <option value="1m">Last 1 month</option>
                    <option value="2m">Last 2 months</option>
                    <option value="older">
                      Older: 3 months–1 year
                    </option>
                  </select>
                </div>

                <div className="min-w-0">
                  <label htmlFor="status" className={LABEL_CLASS}>
                    Issue status
                  </label>

                  <select
                    id="status"
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value as IssueStatusFilter)
                    }
                    className={SELECT_CLASS}
                  >
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                    <option value="all">Any</option>
                  </select>
                </div>
              </div>

              <p className="mt-5 text-xs leading-5 text-slate-500">
                Search results come from GitHub. Skill levels are
                estimates based on labels and issue text, not guarantees.
              </p>
            </div>
          </form>

          <section className="mt-10" aria-live="polite">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="mb-2 font-mono text-xs uppercase tracking-[0.14em] text-slate-500">
                  [ Discovery results ]
                </p>

                <h2 className="text-xl font-bold sm:text-2xl">
                  Explore issues
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Opportunities from public GitHub repositories
                </p>
              </div>

              {searched && !loading && !error && (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400">
                  {issues.length} shown · Page {page} of {totalPages}
                </span>
              )}
            </div>

            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center">
                <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-cyan-300" />
                <p className="mt-4 font-semibold">
                  Searching GitHub...
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Finding issues for your selected filters.
                </p>
              </div>
            ) : error ? (
              <div
                role="alert"
                className="rounded-2xl border border-red-400/20 bg-red-400/5 p-6"
              >
                <p className="font-semibold text-red-200">
                  We couldn&apos;t load issues
                </p>
                <p className="mt-2 text-sm leading-6 text-red-200/70">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() => setError("")}
                  className="mt-4 rounded-lg border border-red-200/20 px-3 py-2 text-sm text-red-100 hover:bg-red-200/5"
                >
                  Dismiss
                </button>
              </div>
            ) : issues.length > 0 ? (
              <div className="grid gap-4">
                {issues.map((issue) => (
                  <article
                    key={issue.id}
                    className="group relative overflow-hidden rounded-lg border border-white/10 bg-[#0d1220] p-5 transition hover:border-cyan-300/30 sm:p-6"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <a
                        href={issue.repositoryUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="break-all text-sm font-semibold text-cyan-200 hover:underline"
                      >
                        {issue.repository}
                      </a>

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                            issue.state === "open"
                              ? "bg-emerald-400/10 text-emerald-300"
                              : "bg-slate-400/10 text-slate-300"
                          }`}
                        >
                          {issue.state}
                        </span>

                        <span className="rounded-full bg-white/5 px-3 py-1 text-xs capitalize text-slate-400">
                          {issue.level}
                        </span>
                      </div>
                    </div>

                    <a
                      href={issue.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 block text-lg font-bold leading-7 transition hover:text-cyan-200 sm:text-xl"
                    >
                      {issue.title}
                      <span className="ml-2 inline-block text-sm text-slate-500">
                        #{issue.number}
                      </span>
                    </a>

                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-400">
                      {(issue.body ?? "No description provided.")
                        .slice(0, 280)}
                      {(issue.body?.length ?? 0) > 280 ? "…" : ""}
                    </p>

                    {issue.labels.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {issue.labels.slice(0, 6).map((item) => (
                          <span
                            key={item.name}
                            className="rounded-md border border-white/10 bg-white/[0.02] px-2.5 py-1 text-xs text-slate-300"
                          >
                            {item.name}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/5 pt-4 text-xs text-slate-500">
                      <span>by {issue.author}</span>
                      <span>{issue.comments} comments</span>
                      <span>
                        Created{" "}
                        {new Date(issue.createdAt).toLocaleDateString()}
                      </span>
                      <span>
                        Updated{" "}
                        {new Date(issue.updatedAt).toLocaleDateString()}
                      </span>
                      <a
                        href={issue.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-cyan-300 hover:underline"
                      >
                        View issue ↗
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center sm:py-16">
                <div
                  className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl text-cyan-200"
                  aria-hidden="true"
                >
                  ⌕
                </div>

                <h3 className="mt-4 text-lg font-bold">
                  {searched
                    ? "No matching issues found"
                    : "Your next project awaits"}
                </h3>

                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                  {searched
                    ? "Try changing your keywords or removing one or more filters."
                    : "Enter a topic, select your filters, and search public GitHub issues."}
                </p>
              </div>
            )}

            {searched && !loading && !error && (
              <div className="mt-6 space-y-3">
                {totalPages > 1 && (
                  <nav
                    aria-label="Issue result pages"
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4"
                  >
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => void runSearch(page - 1)}
                      className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ← Previous
                    </button>

                    <span className="text-sm text-slate-400">
                      Page {page} of {totalPages}
                      <span className="hidden sm:inline">
                        {" "}· Up to 50 per page
                      </span>
                    </span>

                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => void runSearch(page + 1)}
                      className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next →
                    </button>
                  </nav>
                )}

                <p className="text-xs leading-5 text-slate-500">
                  GitHub reports {totalCount.toLocaleString()} matching
                  results. Issue Scout can access up to{" "}
                  {availableCount.toLocaleString()} results for this
                  search, with a maximum of 1,000 per query.
                </p>
              </div>
            )}

            <p className="mt-5 text-xs leading-5 text-slate-600">
              Always read the original issue and the repository&apos;s
              contribution guidelines before starting work.
            </p>
          </section>
        </section>

        <footer className="border-t border-white/10 py-6 text-sm text-slate-500">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>Issue Scout · Open source, built for contributors.</span>
            <a
              href="https://github.com/sharmao07/issue-scout"
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-cyan-200"
            >
              View source on GitHub ↗
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}
