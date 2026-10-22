"use client";

import type { RepositoryPayload } from "@/types/repository";

type Props = {
  loading: boolean;
  error?: string;
  data: RepositoryPayload | null;
  issueRepoUrl: string;
};

function formatDate(value: string | null): string {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleDateString();
}

export default function RepoHealthSection({
  loading,
  error,
  data,
  issueRepoUrl,
}: Props) {
  return (
    <section className="border-t border-white/10 pt-7">
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-cyan-200">
        [ Repository health ]
      </p>

      <h3 className="mt-2 text-xl font-bold">Repository signals</h3>

      {loading ? (
        <p className="mt-4 text-sm text-slate-400">Loading public repository details…</p>
      ) : data ? (
        <>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            {data.repository.description || "No repository description is available."}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 p-4">
              <p className="text-xs text-slate-500">Stars</p>
              <p className="mt-1 text-lg font-bold tabular-nums">
                {data.repository.stars.toLocaleString()}
              </p>
            </div>

            <div className="rounded-lg border border-white/10 p-4">
              <p className="text-xs text-slate-500">Forks</p>
              <p className="mt-1 text-lg font-bold tabular-nums">
                {data.repository.forks.toLocaleString()}
              </p>
            </div>

            <div className="rounded-lg border border-white/10 p-4">
              <p className="text-xs text-slate-500">Open items</p>
              <p className="mt-1 text-lg font-bold tabular-nums">
                {data.repository.openItems.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                GitHub&apos;s count may include pull requests.
              </p>
            </div>

            <div className="rounded-lg border border-white/10 p-4">
              <p className="text-xs text-slate-500">Last push</p>
              <p className="mt-1 text-sm font-semibold">
                {formatDate(data.repository.pushedAt)}
              </p>
            </div>

            <div className="rounded-lg border border-white/10 p-4">
              <p className="text-xs text-slate-500">License</p>
              <p className="mt-1 text-sm font-semibold">
                {data.repository.license || "Not detected"}
              </p>
            </div>

            <div className="rounded-lg border border-white/10 p-4">
              <p className="text-xs text-slate-500">Default branch</p>
              <p className="mt-1 break-all text-sm font-semibold">
                {data.repository.defaultBranch}
              </p>
            </div>
          </div>

          {(data.repository.archived || data.repository.disabled) && (
            <p className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/4 p-4 text-sm text-amber-100">
              {data.repository.archived
                ? "This repository is archived."
                : "GitHub reports that this repository is disabled."}{" "}
              Verify that it still accepts contributions before starting.
            </p>
          )}

          <div className="mt-5">
            <h4 className="font-semibold">Contribution instructions</h4>

            {data.contributionGuides.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {data.contributionGuides.map((guide) => (
                  <li key={guide.path}>
                    <a
                      href={guide.url}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all text-sm font-semibold text-cyan-200 hover:underline"
                    >
                      {guide.path} ↗
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm leading-6 text-slate-400">
                No CONTRIBUTING.md file was found in the common locations checked. Review the repository README, code of conduct, and pinned project instructions.
              </p>
            )}

            <a
              href={`${data.repository.url}/blob/${encodeURIComponent(data.repository.defaultBranch)}/README.md`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-sm font-semibold text-cyan-200 hover:underline"
            >
              Check repository README ↗
            </a>
          </div>
        </>
      ) : (
        <p className="mt-4 text-sm text-slate-400">
          {error || "Repository health information is currently unavailable."}
        </p>
      )}

      <a
        href={issueRepoUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-5 inline-block text-sm font-semibold text-cyan-200 hover:underline"
      >
        Open repository on GitHub ↗
      </a>
    </section>
  );
}
