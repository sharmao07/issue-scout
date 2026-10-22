"use client";

import type { FormEvent } from "react";
import type { IssueAgeFilter, IssueStatusFilter, LevelFilter } from "@/types/issue";

const LANGUAGES = [
  "Python", "TypeScript", "JavaScript", "Java", "C", "C++", "C#", "Go", "Rust",
  "Swift", "Kotlin", "PHP", "Ruby", "Dart", "Elixir", "Erlang", "Haskell", "Julia",
  "Lua", "MATLAB", "Perl", "PowerShell", "R", "Scala", "Shell", "SQL", "HTML",
  "CSS", "Objective-C", "Clojure", "F#", "OCaml", "Fortran", "Assembly",
];

const SELECT_CLASS =
  "w-full min-w-0 rounded-xl border border-white/10 bg-[#101626] px-4 py-3.5 text-sm text-slate-100 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/10";

const LABEL_CLASS = "mb-2.5 block text-sm font-semibold text-slate-300";

type QuickStartPreset = {
  query: string;
  language: string;
  label: string;
  level: LevelFilter;
};

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
  onQuickStart: (preset: QuickStartPreset) => void;
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
  onQuickStart,
  onCopyLink,
  onReset,
  copyLinkMessage,
  shareUrl,
}: Props) {
  return (
    <form
      onSubmit={onSubmit}
      className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-[#0d1220] shadow-2xl shadow-black/20"
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
              onChange={(e) => setQuery(e.target.value)}
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
          <span className="mr-1 text-xs font-medium text-slate-500">Quick start:</span>

          <button
            type="button"
            onClick={() =>
              onQuickStart({
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
              onQuickStart({
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
              onQuickStart({
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
              onQuickStart({
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
            <h2 className="font-bold text-slate-100">Refine your search</h2>
            <p className="mt-1 text-xs text-slate-500">
              Combine filters to find relevant issues.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onCopyLink}
              className="rounded-lg border border-cyan-300/30 px-3 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-300/10"
            >
              Copy search link ↗
            </button>

            <button
              type="button"
              onClick={onReset}
              className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-white/5 hover:text-cyan-200"
            >
              Reset filters
            </button>
          </div>
        </div>

        {copyLinkMessage && (
          <div
            role="status"
            className="mb-5 rounded-lg border border-white/10 bg-white/2 p-4"
          >
            <p className="text-sm text-slate-300">{copyLinkMessage}</p>

            {shareUrl && (
              <input
                type="url"
                aria-label="Shareable search URL"
                readOnly
                value={shareUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="mt-3 w-full min-w-0 rounded-lg border border-white/10 bg-[#101626] px-3 py-3 text-sm text-cyan-200 outline-none focus:border-cyan-300"
              />
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <div className="min-w-0">
            <label htmlFor="language" className={LABEL_CLASS}>
              Programming language
            </label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
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
              onChange={(e) => setLabel(e.target.value)}
              className={SELECT_CLASS}
            >
              <option value="">Any label</option>
              <option value="good first issue">Good first issue</option>
              <option value="help wanted">Help wanted</option>
              <option value="bug">Bug</option>
              <option value="documentation">Documentation</option>
            </select>
          </div>

          <div className="min-w-0">
            <label htmlFor="level" className={LABEL_CLASS}>
              Suggested skill level
            </label>
            <select
              id="level"
              value={level}
              onChange={(e) => setLevel(e.target.value as LevelFilter)}
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
              onChange={(e) => setAge(e.target.value as IssueAgeFilter)}
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
              <option value="older">Older: 3 months–1 year</option>
            </select>
          </div>

          <div className="min-w-0">
            <label htmlFor="status" className={LABEL_CLASS}>
              Issue status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as IssueStatusFilter)}
              className={SELECT_CLASS}
            >
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="all">Any</option>
            </select>
          </div>
        </div>

        <p className="mt-5 text-xs leading-5 text-slate-500">
          Search results come from GitHub. Skill levels are estimates based on labels and issue text, not guarantees.
        </p>
      </div>
    </form>
  );
}
