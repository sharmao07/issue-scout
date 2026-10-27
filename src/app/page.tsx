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
    <div className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
        <SearchHeader />

        {directIssueError && (
          <div
            role="alert"
            className="mb-3 border border-red-300 bg-red-50 p-2 text-xs text-red-800"
          >
            <span>{directIssueError} </span>
            <button
              type="button"
              onClick={() => setDirectIssueError("")}
              className="text-red-900 underline"
            >
              [Dismiss]
            </button>
          </div>
        )}

        {/* Search & Filter section */}
        <section aria-label="Search and filters">
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
            onCopyLink={handleCopyLink}
            onReset={handleResetFilters}
            copyLinkMessage={copyLinkMessage}
            shareUrl={shareUrl}
          />
        </section>

        {/* Results section */}
        <section className="mt-6" aria-live="polite">
          {/* View toggle header */}
          <div className="flex items-center gap-4 border-b border-gray-300 pb-2 text-xs">
            <button
              type="button"
              onClick={() => setResultsView("search")}
              className={
                resultsView === "search"
                  ? "font-bold text-gray-900 underline"
                  : "text-blue-600 underline"
              }
            >
              Search results {searched && !loading && !error ? `(${issues.length})` : ""}
            </button>

            <button
              type="button"
              onClick={() => setResultsView("saved")}
              className={
                resultsView === "saved"
                  ? "font-bold text-gray-900 underline"
                  : "text-blue-600 underline"
              }
            >
              Saved issues ({savedIssuesReady ? savedIssues.length : "…"})
            </button>
          </div>

          {/* Results list / State display */}
          {resultsView === "search" && loading ? (
            <div className="py-6 text-xs text-gray-600">
              Loading issues from GitHub…
            </div>
          ) : resultsView === "search" && error ? (
            <div
              role="alert"
              className="my-3 border border-red-300 bg-red-50 p-2 text-xs text-red-800"
            >
              <p className="font-semibold">Error: {error}</p>
              <button
                type="button"
                onClick={() => setError("")}
                className="mt-1 text-red-900 underline"
              >
                [Dismiss]
              </button>
            </div>
          ) : displayedIssues.length > 0 ? (
            <div>
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
            <div className="py-6 text-xs text-gray-500">
              {resultsView === "saved"
                ? "No saved issues yet. Click Save on an issue to bookmark it."
                : searched
                  ? "No matching issues found. Try different keywords or filters."
                  : "Enter a keyword above to find issues."}
            </div>
          )}

          {/* Pagination */}
          {resultsView === "search" && searched && !loading && !error && (
            <Pagination
              page={page}
              totalPages={totalPages}
              totalCount={totalCount}
              availableCount={availableCount}
              onPageChange={(newPage) => runSearch(newPage)}
            />
          )}
        </section>

        {/* Issue Details Modal */}
        {selectedIssue && (
          <IssueDetails
            key={selectedIssue.url}
            issue={selectedIssue}
            isSaved={isSaved(selectedIssue.id)}
            onToggleSaved={() => toggleSaved(selectedIssue)}
            onClose={() => setSelectedIssue(null)}
          />
        )}

        <footer className="mt-8 border-t border-gray-300 pt-3 text-xs text-gray-500">
          Issue Scout
        </footer>
      </div>
    </div>
  );
}
