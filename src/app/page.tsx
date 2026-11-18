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
    <main className="app-page">
      <div className="app-shell">
        <SearchHeader />

        <section className="page-intro" aria-labelledby="page-title">
          <p className="eyebrow">OPEN SOURCE · CONTRIBUTION DISCOVERY</p>
          <h2 id="page-title" className="page-title">
            Find your next <span>open-source contribution.</span>
          </h2>
          <p className="page-description">
            Browse real GitHub issues, narrow them down to your interests, and keep track of the ones you want to work on.
          </p>
        </section>

        {directIssueError && (
          <div role="alert" className="alert-error">
            <span>{directIssueError}</span>
            <button type="button" onClick={() => setDirectIssueError("")}>Dismiss</button>
          </div>
        )}

        <section className="search-panel" aria-label="Search and filters">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">ISSUE DISCOVERY</p>
              <h2>What would you like to work on?</h2>
            </div>
            <p className="panel-note">A few filters can make the search a lot more useful.</p>
          </div>
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

        <section className="results-section" aria-live="polite">
          <div className="results-heading">
            <div>
              <p className="section-kicker">YOUR WORKSPACE</p>
              <h2>Explore issues</h2>
            </div>
            <p className="results-summary">
              {resultsView === "saved"
                ? `${savedIssuesReady ? savedIssues.length : "…"} saved for later`
                : searched && !loading && !error
                  ? `${totalCount.toLocaleString()} matching issues found`
                  : "Fresh opportunities, one search away"}
            </p>
          </div>

          <div className="results-tabs" role="tablist" aria-label="Issue views">
            <button
              type="button"
              role="tab"
              aria-selected={resultsView === "search"}
              onClick={() => setResultsView("search")}
              className={`results-tab${resultsView === "search" ? " is-active" : ""}`}
            >
              Search results
              {searched && !loading && !error && <span className="count-badge">{issues.length}</span>}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={resultsView === "saved"}
              onClick={() => setResultsView("saved")}
              className={`results-tab${resultsView === "saved" ? " is-active" : ""}`}
            >
              Saved issues
              <span className="count-badge">{savedIssuesReady ? savedIssues.length : "…"}</span>
            </button>
          </div>

          {resultsView === "search" && loading ? (
            <div className="state-panel" role="status">
              <div className="state-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.2 4.2" />
                </svg>
              </div>
              <strong>Looking through GitHub…</strong>
              <p>Finding issues that match your search.</p>
              <span className="loading-dots" aria-hidden="true"><span /><span /><span /></span>
            </div>
          ) : resultsView === "search" && error ? (
            <div role="alert" className="alert-error">
              <strong>Couldn’t complete that search.</strong> {error}
              <button type="button" onClick={() => setError("")}>Dismiss</button>
            </div>
          ) : displayedIssues.length > 0 ? (
            <div className="issue-list">
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
            <div className="state-panel">
              <div className="state-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {resultsView === "saved" ? (
                    <path d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-3.7L6 21V4.8Z" />
                  ) : (
                    <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.2 4.2" /></>
                  )}
                </svg>
              </div>
              <strong>
                {resultsView === "saved"
                  ? "Nothing saved yet"
                  : searched
                    ? "No issues found"
                    : "Start with a search"}
              </strong>
              <p>
                {resultsView === "saved"
                  ? "Save an issue that catches your eye and it’ll be waiting here."
                  : searched
                    ? "Try another keyword or loosen one of your filters."
                    : "Search by a technology, topic, or issue label to find a place to contribute."}
              </p>
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

        <footer className="site-footer">
          <span>Issue Scout · Built for people who want to contribute.</span>
          <a href="https://github.com/sharmao07/issue-scout" target="_blank" rel="noreferrer">Open source on GitHub ↗</a>
        </footer>
      </div>
    </main>
  );
}
