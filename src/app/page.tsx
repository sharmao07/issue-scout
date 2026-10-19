
"use client";

import { useState, type FormEvent } from "react";
import type { LevelFilter, ScoutIssue } from "@/types/issue";
import Link from "next/link";

type SearchResponse = {
  total_count: number;
  returned_count: number;
  issues: ScoutIssue[];
};

type SearchError = {
  error?: string;
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [label, setLabel] = useState("");
  const [level, setLevel] = useState<LevelFilter>("all");
  const [issues, setIssues] = useState<ScoutIssue[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setSearched(true);
    setIssues([]);
    setTotalCount(0);

    try {
      const params = new URLSearchParams({
        q: query.trim(),
        label,
        level,
      });

      const response = await fetch(
        `/api/issues?${params.toString()}`,
        {
          headers: { Accept: "application/json" },
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
    } catch (reason) {
      setIssues([]);
      setTotalCount(0);

      setError(
        reason instanceof Error
          ? reason.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#080b16] text-slate-100">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <header className="flex items-center justify-between border-b border-white/10 pb-6">
          <Link
            href="/"
            aria-label="Issue Scout home"
            className="text-xl font-black tracking-tight"
          >
            ISSUE<span className="text-cyan-300">SCOUT</span>
          </Link>

          <a
            href="https://github.com/sharmao07/issue-scout"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-white/20 px-4 py-2 text-sm transition hover:bg-white/10"
          >
            GitHub ↗
          </a>
        </header>

        <section className="py-14 sm:py-20">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
            Your next contribution starts here
          </p>

          <h1 className="max-w-4xl text-5xl font-black leading-tight tracking-tight sm:text-7xl">
            Find issues.
            <br />
            Build something{" "}
            <span className="text-cyan-300">real.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
            Discover open-source GitHub issues that match your
            interests and experience. Find opportunities to learn,
            contribute, and build real software.
          </p>

          <form
            onSubmit={handleSearch}
            className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-7"
          >
            <label
              htmlFor="query"
              className="mb-2 block text-sm font-semibold text-slate-300"
            >
              What do you want to work on?
            </label>

            <input
              id="query"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try Python, documentation, bug fixes..."
              className="w-full rounded-xl border border-white/15 bg-[#101626] px-4 py-4 text-base outline-none placeholder:text-slate-500 focus:border-cyan-300"
            />

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="label"
                  className="mb-2 block text-sm font-semibold text-slate-300"
                >
                  Issue label
                </label>

                <select
                  id="label"
                  value={label}
                  onChange={(event) => setLabel(event.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-[#101626] px-4 py-3 outline-none focus:border-cyan-300"
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

              <div>
                <label
                  htmlFor="level"
                  className="mb-2 block text-sm font-semibold text-slate-300"
                >
                  Suggested skill level
                </label>

                <select
                  id="level"
                  value={level}
                  onChange={(event) =>
                    setLevel(event.target.value as LevelFilter)
                  }
                  className="w-full rounded-xl border border-white/15 bg-[#101626] px-4 py-3 outline-none focus:border-cyan-300"
                >
                  <option value="all">Any level</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-cyan-300 px-6 py-4 font-bold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
            >
              {loading ? "Searching..." : "Find issues"}
              {!loading && <span aria-hidden="true"> →</span>}
            </button>
          </form>

          <section className="mt-10" aria-live="polite">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-xl font-bold">Explore issues</h2>

              {searched && !loading && !error && (
                <span className="text-sm text-slate-400">
                  {issues.length} shown
                  {totalCount > 0
                    ? ` · ${totalCount} GitHub matches before skill filtering`
                    : ""}
                </span>
              )}
            </div>

            {loading ? (
              <div className="mt-4 rounded-2xl border border-white/10 p-8 text-center text-slate-300">
                Searching public GitHub issues...
              </div>
            ) : error ? (
              <div
                role="alert"
                className="mt-4 rounded-2xl border border-red-400/30 bg-red-400/5 p-6 text-red-200"
              >
                <p className="font-semibold">
                  We couldn&apos;t load issues
                </p>
                <p className="mt-2 text-sm">{error}</p>

                <button
                  type="button"
                  onClick={() => setError("")}
                  className="mt-4 rounded-lg border border-red-200/30 px-3 py-2 text-sm hover:bg-red-200/10"
                >
                  Dismiss
                </button>
              </div>
            ) : issues.length > 0 ? (
              <div className="mt-4 grid gap-4">
                {issues.map((issue) => (
                  <article
                    key={issue.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-cyan-300/40"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <a
                        href={issue.repositoryUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-cyan-300 hover:underline"
                      >
                        {issue.repository}
                      </a>

                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs capitalize text-slate-300">
                        Suggested: {issue.level}
                      </span>
                    </div>

                    <a
                      href={issue.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 block text-lg font-bold hover:text-cyan-300"
                    >
                      {issue.title}
                    </a>

                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-400">
                      {(issue.body ?? "No description provided.").slice(
                        0,
                        280,
                      )}
                      {(issue.body?.length ?? 0) > 280 ? "…" : ""}
                    </p>

                    {issue.labels.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {issue.labels.slice(0, 6).map((item) => (
                          <span
                            key={item.name}
                            className="rounded-md border border-white/10 px-2 py-1 text-xs text-slate-300"
                          >
                            {item.name}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-500">
                      <span>#{issue.number}</span>
                      <span>by {issue.author}</span>
                      <span>{issue.comments} comments</span>
                      <span>
                        Updated{" "}
                        {new Date(issue.updatedAt).toLocaleDateString()}
                      </span>

                      <a
                        href={issue.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-300 hover:underline"
                      >
                        View original issue ↗
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-white/15 p-8 text-center sm:p-12">
                <div className="text-3xl" aria-hidden="true">
                  ⌕
                </div>

                <h3 className="mt-3 text-lg font-bold">
                  {searched
                    ? "No matching issues found"
                    : "Your next project awaits"}
                </h3>

                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-400">
                  {searched
                    ? "Try another keyword or remove a filter. Labels can vary between repositories."
                    : "Search by topic, choose an issue label and skill level, and explore public repositories."}
                </p>
              </div>
            )}

            <p className="mt-4 text-xs leading-5 text-slate-500">
              Skill levels are estimated from issue labels, not guarantees.
              Always review the original issue and repository contribution
              guidelines before starting.
            </p>
          </section>
        </section>

        <footer className="border-t border-white/10 py-6 text-sm text-slate-500">
          Issue Scout · Open source, built for contributors.
        </footer>
      </div>
    </main>
  );
}
