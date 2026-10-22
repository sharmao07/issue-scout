"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import IssueDetails from "@/components/IssueDetails";
import SearchHeader from "@/components/SearchHeader";
import SearchForm from "@/components/SearchForm";
import IssueCard from "@/components/IssueCard";
import Pagination from "@/components/Pagination";
import { useSavedIssues } from "@/hooks/useSavedIssues";
import {
  isScoutIssue,
  type IssueAgeFilter,
  type IssueStatusFilter,
  type LevelFilter,
  type ScoutIssue,
} from "@/types/issue";
import {
  buildSearchUrl,
  parseSearchUrl,
  type SearchUrlState,
} from "@/lib/search-url";
import { parseIssuePreviewUrl } from "@/lib/issue-url";

type ResultsView = "search" | "saved";

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

export default function Home() {
  // Search parameters
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("");
  const [label, setLabel] = useState("");
  const [level, setLevel] = useState<LevelFilter>("all");
  const [age, setAge] = useState<IssueAgeFilter>("any");
  const [status, setStatus] = useState<IssueStatusFilter>("open");

  // Search results state
  const [issues, setIssues] = useState<ScoutIssue[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [availableCount, setAvailableCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

  // Status flags
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  // Saved bookmarks via custom hook
  const { savedIssues, isReady: savedIssuesReady, toggleSaved, isSaved } = useSavedIssues();
  const [resultsView, setResultsView] = useState<ResultsView>("search");

  // Modal / Preview state
  const [selectedIssue, setSelectedIssue] = useState<ScoutIssue | null>(null);
  const [directIssueError, setDirectIssueError] = useState("");

  // Share link state
  const [shareUrl, setShareUrl] = useState("");
  const [copyLinkMessage, setCopyLinkMessage] = useState("");

  const hasRestoredUrl = useRef(false);

  const resetResults = () => {
    setIssues([]);
    setTotalCount(0);
    setAvailableCount(0);
    setTotalPages(1);
    setPage(1);
  };

  const runSearch = useCallback(
    async (requestedPage: number, stateOverride?: SearchUrlState) => {
      const safePage = Math.max(1, Math.min(20, requestedPage));
      const activeState: SearchUrlState = stateOverride ?? {
        query,
        language,
        label,
        level,
        age,
        status,
        page: safePage,
      };

      setLoading(true);
      setError("");
      setSearched(true);
      setResultsView("search");
      setIssues([]);

      try {
        const params = new URLSearchParams({
          q: activeState.query,
          language: activeState.language,
          label: activeState.label,
          level: activeState.level,
          age: activeState.age,
          status: activeState.status,
          page: String(activeState.page),
        });

        const res = await fetch(`/api/issues?${params.toString()}`, {
          headers: { Accept: "application/json" },
        });

        const data = (await res.json()) as SearchResponse | { error?: string };

        if (!res.ok || !("issues" in data) || !Array.isArray(data.issues)) {
          throw new Error(
            "error" in data && typeof data.error === "string"
              ? data.error
              : "Search request failed. Please try again.",
          );
        }

        setIssues(data.issues);
        setTotalCount(typeof data.total_count === "number" ? data.total_count : data.issues.length);
        setAvailableCount(typeof data.available_count === "number" ? data.available_count : data.issues.length);
        setTotalPages(typeof data.total_pages === "number" ? Math.max(1, Math.min(20, data.total_pages)) : 1);
        setPage(typeof data.page === "number" ? data.page : safePage);
      } catch (err) {
        resetResults();
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setLoading(false);
      }
    },
    [query, language, label, level, age, status],
  );

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    runSearch(1);
  };

  const handleQuickStart = (preset: {
    query: string;
    language: string;
    label: string;
    level: LevelFilter;
  }) => {
    setQuery(preset.query);
    setLanguage(preset.language);
    setLabel(preset.label);
    setLevel(preset.level);
    setAge("any");
    setStatus("open");

    resetResults();
    setError("");
    setSearched(false);
    setResultsView("search");
    setCopyLinkMessage("");
    setShareUrl("");
  };

  const handleResetFilters = () => {
    setQuery("");
    setLanguage("");
    setLabel("");
    setLevel("all");
    setAge("any");
    setStatus("open");

    resetResults();
    setError("");
    setSearched(false);
    setResultsView("search");
    setShareUrl("");
    setCopyLinkMessage("");
    setDirectIssueError("");
  };

  const handleCopyLink = async () => {
    const url = buildSearchUrl(
      {
        query,
        language,
        label,
        level,
        age,
        status,
        page: searched ? page : 1,
      },
      window.location.origin,
    );

    setShareUrl(url);

    try {
      await navigator.clipboard.writeText(url);
      setCopyLinkMessage("Search link copied to clipboard.");
    } catch {
      setCopyLinkMessage("Automatic copying is unavailable. Copy the URL below.");
    }
  };

  // Restore query from URL or load shared issue modal on first render
  useEffect(() => {
    if (hasRestoredUrl.current) return;
    hasRestoredUrl.current = true;

    const search = window.location.search;
    const params = new URLSearchParams(search);
    const { state, autoSearch } = parseSearchUrl(search);
    const issueTarget = parseIssuePreviewUrl(search);

    setQuery(state.query);
    setLanguage(state.language);
    setLabel(state.label);
    setLevel(state.level);
    setAge(state.age);
    setStatus(state.status);
    setPage(state.page);

    if (params.has("issue") && !issueTarget) {
      queueMicrotask(() => {
        setDirectIssueError("This direct issue link is invalid. Check the repository and issue number.");
      });
      return;
    }

    if (issueTarget) {
      const target = issueTarget;
      async function loadPreview() {
        const issueParams = new URLSearchParams({
          owner: target.owner,
          repo: target.repo,
          issue_number: String(target.issueNumber),
        });

        try {
          const res = await fetch(`/api/issue-preview?${issueParams.toString()}`, {
            cache: "no-store",
            headers: { Accept: "application/json" },
          });
          const result = await res.json();
          const directIssue = result?.issue;

          if (!res.ok || !isScoutIssue(directIssue)) {
            throw new Error(result.error ?? "Unable to open this issue preview.");
          }

          setSelectedIssue(directIssue);
          setDirectIssueError("");
        } catch (err) {
          setDirectIssueError(err instanceof Error ? err.message : "Unable to load this issue.");
        }
      }

      loadPreview();
      return;
    }

    if (autoSearch) {
      queueMicrotask(() => {
        runSearch(state.page, state);
      });
    }
  }, [runSearch]);

  const displayedIssues = resultsView === "saved" ? savedIssues : issues;

  return (
    <main className="min-h-screen bg-[#080b16] text-slate-100">
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-10">
        <SearchHeader />

        {directIssueError && (
          <div
            role="alert"
            className="mt-5 rounded-lg border border-red-400/20 bg-red-400/5 p-5"
          >
            <p className="font-semibold text-red-200">Could not open the shared issue</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">{directIssueError}</p>
            <button
              type="button"
              onClick={() => setDirectIssueError("")}
              className="mt-3 text-sm font-semibold text-cyan-200 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <section className="pb-16">
          <SearchForm
            query={query}
            setQuery={setQuery}
            language={language}
            setLanguage={setLanguage}
            label={label}
            setLabel={setLabel}
            level={level}
            setLevel={setLevel}
            age={age}
            setAge={setAge}
            status={status}
            setStatus={setStatus}
            loading={loading}
            onSubmit={handleSearch}
            onQuickStart={handleQuickStart}
            onCopyLink={handleCopyLink}
            onReset={handleResetFilters}
            copyLinkMessage={copyLinkMessage}
            shareUrl={shareUrl}
          />

          <section className="mt-10" aria-live="polite">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="mb-2 font-mono text-xs uppercase tracking-[0.14em] text-slate-500">
                  {resultsView === "saved" ? "[ Your collection ]" : "[ Discovery results ]"}
                </p>

                <h2 className="text-xl font-bold sm:text-2xl">
                  {resultsView === "saved" ? "Saved issues" : "Explore issues"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {resultsView === "saved"
                    ? "Your bookmarks, stored in this browser."
                    : "Opportunities from public GitHub repositories"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setResultsView((curr) => (curr === "saved" ? "search" : "saved"))
                  }
                  aria-pressed={resultsView === "saved"}
                  className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-cyan-300/40 hover:text-cyan-200"
                >
                  {resultsView === "saved" ? "← Search results" : "Saved issues"}
                  <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 tabular-nums">
                    {savedIssuesReady ? savedIssues.length : "…"}
                  </span>
                </button>

                {resultsView === "search" && searched && !loading && !error && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400">
                    {issues.length} shown · Page {page} of {totalPages}
                  </span>
                )}
              </div>
            </div>

            {resultsView === "search" && loading ? (
              <div className="rounded-2xl border border-white/10 bg-white/2 p-10 text-center">
                <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-cyan-300" />
                <p className="mt-4 font-semibold">Searching GitHub...</p>
                <p className="mt-1 text-sm text-slate-500">
                  Finding issues for your selected filters.
                </p>
              </div>
            ) : resultsView === "search" && error ? (
              <div
                role="alert"
                className="rounded-2xl border border-red-400/20 bg-red-400/5 p-6"
              >
                <p className="font-semibold text-red-200">We couldn&apos;t load issues</p>
                <p className="mt-2 text-sm leading-6 text-red-200/70">{error}</p>
                <button
                  type="button"
                  onClick={() => setError("")}
                  className="mt-4 rounded-lg border border-red-200/20 px-3 py-2 text-sm text-red-100 hover:bg-red-200/5"
                >
                  Dismiss
                </button>
              </div>
            ) : displayedIssues.length > 0 ? (
              <div className="grid gap-4">
                {displayedIssues.map((issue) => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    isSaved={isSaved(issue.id)}
                    onSelect={setSelectedIssue}
                    onToggleSaved={toggleSaved}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/2 px-6 py-12 text-center sm:py-16">
                <div
                  className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl text-cyan-200"
                  aria-hidden="true"
                >
                  {resultsView === "saved" ? "☆" : "⌕"}
                </div>

                <h3 className="mt-4 text-lg font-bold">
                  {resultsView === "saved"
                    ? "No saved issues yet"
                    : searched
                      ? "No matching issues found"
                      : "Your next project awaits"}
                </h3>

                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                  {resultsView === "saved"
                    ? "Use the Save button on any issue to keep it here for later. Your saved issues stay in this browser."
                    : searched
                      ? "Try changing your keywords or removing one or more filters."
                      : "Enter a topic, select your filters, and search public GitHub issues."}
                </p>

                {resultsView === "saved" && (
                  <button
                    type="button"
                    onClick={() => setResultsView("search")}
                    className="mt-5 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/40 hover:text-cyan-200"
                  >
                    Explore issues
                  </button>
                )}
              </div>
            )}

            {resultsView === "search" && searched && !loading && !error && (
              <Pagination
                page={page}
                totalPages={totalPages}
                totalCount={totalCount}
                availableCount={availableCount}
                onPageChange={(newPage) => runSearch(newPage)}
              />
            )}

            <p className="mt-5 text-xs leading-5 text-slate-600">
              Always read the original issue and the repository&apos;s contribution guidelines before starting work.
            </p>
          </section>
        </section>

        {selectedIssue && (
          <IssueDetails
            key={selectedIssue.url}
            issue={selectedIssue}
            isSaved={isSaved(selectedIssue.id)}
            onToggleSaved={() => toggleSaved(selectedIssue)}
            onClose={() => setSelectedIssue(null)}
          />
        )}

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
