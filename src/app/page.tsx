
"use client";

import { useState, type FormEvent } from "react";
import type { LevelFilter } from "@/types/issue";

export default function Home() {
  const [query, setQuery] = useState("");
  const [label, setLabel] = useState("");
  const [level, setLevel] = useState<LevelFilter>("all");
  const [submitted, setSubmitted] = useState(false);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <main className="min-h-screen bg-[#080b16] text-slate-100">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <header className="flex items-center justify-between border-b border-white/10 pb-6">
          <a href="/" className="text-xl font-black tracking-tight">
            ISSUE<span className="text-cyan-300">SCOUT</span>
          </a>
          <a
            href="https://github.com/sharmao07/issue-scout"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
          >
            GitHub ↗
          </a>
        </header>

        <section className="py-16 sm:py-24">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
            Your next contribution starts here
          </p>

          <h1 className="max-w-4xl text-5xl font-black leading-tight tracking-tight sm:text-7xl">
            Find issues.
            <br />
            Build something <span className="text-cyan-300">real.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
            Discover open-source GitHub issues matched to your
            interests and experience. Spend less time searching
            and more time contributing.
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
                  <option value="good first issue">Good first issue</option>
                  <option value="help wanted">Help wanted</option>
                  <option value="bug">Bug</option>
                  <option value="documentation">Documentation</option>
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
              className="mt-6 w-full rounded-xl bg-cyan-300 px-6 py-4 font-bold text-slate-950 transition hover:bg-cyan-200 sm:w-auto"
            >
              Find issues <span aria-hidden="true">→</span>
            </button>
          </form>

          <section className="mt-10" aria-live="polite">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold">Explore issues</h2>
              <span className="text-xs text-slate-500">
                Open-source discovery
              </span>
            </div>

            <div className="mt-4 rounded-2xl border border-dashed border-white/15 p-8 text-center sm:p-12">
              <div className="text-3xl" aria-hidden="true">⌕</div>
              <h3 className="mt-3 text-lg font-bold">
                {submitted ? "Search interface ready" : "Your next project awaits"}
              </h3>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-400">
                {submitted
                  ? "The next step connects these filters to real GitHub issues."
                  : "Search by topic and choose a skill level. Live GitHub results are coming in the next build step."}
              </p>
            </div>
          </section>
        </section>

        <footer className="border-t border-white/10 py-6 text-sm text-slate-500">
          Issue Scout · Open source, built for contributors.
        </footer>
      </div>
    </main>
  );
}
