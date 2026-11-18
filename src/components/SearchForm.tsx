"use client";

import type { FormEvent } from "react";
import type { IssueAgeFilter, IssueStatusFilter, LevelFilter } from "@/types/issue";

const LANGUAGES = [
  "Python", "TypeScript", "JavaScript", "Java", "C", "C++", "C#", "Go", "Rust",
  "Swift", "Kotlin", "PHP", "Ruby", "Dart", "Elixir", "Erlang", "Haskell", "Julia",
  "Lua", "MATLAB", "Perl", "PowerShell", "R", "Scala", "Shell", "SQL", "HTML",
  "CSS", "Objective-C", "Clojure", "F#", "OCaml", "Fortran", "Assembly",
];

type Props = {
  query: string;
  setQuery: (val: string) => void;
  language: string;
  setLanguage: (val: string) => void;
  label: string;
  setLabel: (val: string) => void;
  level: LevelFilter;
  setLevel: (val: LevelFilter) => void;
  age: IssueAgeFilter;
  setAge: (val: IssueAgeFilter) => void;
  status: IssueStatusFilter;
  setStatus: (val: IssueStatusFilter) => void;
  loading: boolean;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onCopyLink: () => void;
  onReset: () => void;
  copyLinkMessage: string;
  shareUrl: string;
};

export default function SearchForm({
  query,
  setQuery,
  language,
  setLanguage,
  label,
  setLabel,
  level,
  setLevel,
  age,
  setAge,
  status,
  setStatus,
  loading,
  onSubmit,
  onCopyLink,
  onReset,
  copyLinkMessage,
  shareUrl,
}: Props) {
  return (
    <form onSubmit={onSubmit} className="search-form">
      <div className="search-main">
        <span className="search-symbol" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="10.8" cy="10.8" r="6.8" />
            <path d="m16 16 4.2 4.2" />
          </svg>
        </span>
        <input
          id="query"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Try “good first issue”, React, or accessibility…"
          aria-label="Search GitHub issues"
        />
        <button type="submit" disabled={loading} className="primary-button">
          {loading ? (
            <>
              <span className="loading-dots" aria-hidden="true"><span /><span /><span /></span>
              Searching
            </>
          ) : (
            <>
              Search issues
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </>
          )}
        </button>
      </div>

      <div>
        <p className="filter-heading">Refine your search</p>
        <div className="filter-grid">
          <div className="filter-field">
            <label htmlFor="language">Language</label>
            <select id="language" value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="">Any language</option>
              {LANGUAGES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>

          <div className="filter-field">
            <label htmlFor="label">Issue label</label>
            <select id="label" value={label} onChange={(e) => setLabel(e.target.value)}>
              <option value="">Any label</option>
              <option value="good first issue">Good first issue</option>
              <option value="help wanted">Help wanted</option>
              <option value="bug">Bug</option>
              <option value="documentation">Documentation</option>
            </select>
          </div>

          <div className="filter-field">
            <label htmlFor="level">Estimated level</label>
            <select id="level" value={level} onChange={(e) => setLevel(e.target.value as LevelFilter)}>
              <option value="all">Any level</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="unspecified">Unspecified</option>
            </select>
          </div>

          <div className="filter-field">
            <label htmlFor="age">Posted</label>
            <select id="age" value={age} onChange={(e) => setAge(e.target.value as IssueAgeFilter)}>
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
              <option value="older">Older</option>
            </select>
          </div>

          <div className="filter-field">
            <label htmlFor="status">Issue status</label>
            <select id="status" value={status} onChange={(e) => setStatus(e.target.value as IssueStatusFilter)}>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="all">Any status</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <div className="search-utilities">
          <button type="button" onClick={onReset} className="text-action">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 12a9 9 0 1 0 2.6-6.4L3 8" /><path d="M3 3v5h5" />
            </svg>
            Reset filters
          </button>
          <button type="button" onClick={onCopyLink} className="text-action">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
              <path d="M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.1-1.1" />
            </svg>
            Share search
          </button>
          {copyLinkMessage && <span className="copy-message" role="status">{copyLinkMessage}</span>}
        </div>

        {shareUrl && copyLinkMessage && (
          <input
            type="url"
            readOnly
            value={shareUrl}
            onFocus={(e) => e.currentTarget.select()}
            aria-label="Shareable search URL"
            className="share-url-input"
          />
        )}
      </div>
    </form>
  );
}
