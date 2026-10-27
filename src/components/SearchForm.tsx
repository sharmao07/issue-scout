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
    <form onSubmit={onSubmit} className="space-y-3">
      {/* Search Input Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="query" className="text-xs font-medium text-gray-700">
          Search:
        </label>
        <input
          id="query"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Keyword..."
          className="flex-1 min-w-[200px] border border-gray-400 bg-white px-2 py-1 text-sm text-gray-900 outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="border border-gray-400 bg-gray-100 px-4 py-1 text-sm font-medium text-gray-800 hover:bg-gray-200 disabled:opacity-50"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {/* Basic Filters Row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
        <div className="flex items-center gap-1.5">
          <label htmlFor="language" className="text-gray-700">
            Language:
          </label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="border border-gray-400 bg-white px-1.5 py-1 text-xs text-gray-800"
          >
            <option value="">Any</option>
            {LANGUAGES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <label htmlFor="label" className="text-gray-700">
            Label:
          </label>
          <select
            id="label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="border border-gray-400 bg-white px-1.5 py-1 text-xs text-gray-800"
          >
            <option value="">Any</option>
            <option value="good first issue">Good first issue</option>
            <option value="help wanted">Help wanted</option>
            <option value="bug">Bug</option>
            <option value="documentation">Documentation</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <label htmlFor="level" className="text-gray-700">
            Skill level:
          </label>
          <select
            id="level"
            value={level}
            onChange={(e) => setLevel(e.target.value as LevelFilter)}
            className="border border-gray-400 bg-white px-1.5 py-1 text-xs text-gray-800"
          >
            <option value="all">Any</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="unspecified">Unspecified</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <label htmlFor="age" className="text-gray-700">
            Created:
          </label>
          <select
            id="age"
            value={age}
            onChange={(e) => setAge(e.target.value as IssueAgeFilter)}
            className="border border-gray-400 bg-white px-1.5 py-1 text-xs text-gray-800"
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
            <option value="older">Older</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <label htmlFor="status" className="text-gray-700">
            Status:
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as IssueStatusFilter)}
            className="border border-gray-400 bg-white px-1.5 py-1 text-xs text-gray-800"
          >
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="all">Any</option>
          </select>
        </div>
      </div>

      {/* Reset & Share Links */}
      <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
        <button
          type="button"
          onClick={onReset}
          className="text-blue-600 underline hover:text-blue-800"
        >
          Reset filters
        </button>
        <button
          type="button"
          onClick={onCopyLink}
          className="text-blue-600 underline hover:text-blue-800"
        >
          Share search URL
        </button>

        {copyLinkMessage && (
          <span className="text-gray-600">
            {copyLinkMessage}
          </span>
        )}
      </div>

      {shareUrl && copyLinkMessage && (
        <div className="pt-1">
          <input
            type="url"
            readOnly
            value={shareUrl}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full border border-gray-300 bg-gray-50 px-2 py-1 text-xs text-gray-700"
          />
        </div>
      )}
    </form>
  );
}
