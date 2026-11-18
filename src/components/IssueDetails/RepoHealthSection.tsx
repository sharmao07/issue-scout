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

export default function RepoHealthSection({ loading, error, data, issueRepoUrl }: Props) {
  return (
    <section className="details-section">
      <h4>Repository information</h4>

      {loading ? (
        <p className="details-muted mt-3">Loading repository info…</p>
      ) : data ? (
        <div className="mt-3 space-y-3">
          {data.repository.description && <p>{data.repository.description}</p>}

          <div className="details-surface grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div><span className="details-muted block text-[10px]">Stars</span><b className="text-[var(--ink)]">{data.repository.stars.toLocaleString()}</b></div>
            <div><span className="details-muted block text-[10px]">Forks</span><b className="text-[var(--ink)]">{data.repository.forks.toLocaleString()}</b></div>
            <div><span className="details-muted block text-[10px]">Open issues</span><b className="text-[var(--ink)]">{data.repository.openItems.toLocaleString()}</b></div>
            <div><span className="details-muted block text-[10px]">Last push</span><b className="text-[var(--ink)]">{formatDate(data.repository.pushedAt)}</b></div>
            <div className="col-span-2 sm:col-span-4 border-t border-[var(--line)] pt-2">
              License: <b className="text-[var(--ink)]">{data.repository.license || "None"}</b>
              <span className="mx-2 text-[var(--subtle)]">·</span>
              Default branch: <b className="text-[var(--ink)]">{data.repository.defaultBranch}</b>
            </div>
          </div>

          {(data.repository.archived || data.repository.disabled) && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800">
              Note: This repository is {data.repository.archived ? "archived" : "disabled"}.
            </p>
          )}

          <div>
            <b className="text-[var(--ink)]">Contribution guides</b>
            {data.contributionGuides.length > 0 ? (
              <ul className="mt-1 list-inside list-disc space-y-1">
                {data.contributionGuides.map((guide) => (
                  <li key={guide.path}><a href={guide.url} target="_blank" rel="noreferrer">{guide.path}</a></li>
                ))}
              </ul>
            ) : <p className="details-muted mt-1">No contribution guide found.</p>}
          </div>

          <div className="flex flex-wrap gap-4 pt-1">
            <a href={`${data.repository.url}/blob/${encodeURIComponent(data.repository.defaultBranch)}/README.md`} target="_blank" rel="noreferrer">Read the README ↗</a>
            <a href={issueRepoUrl} target="_blank" rel="noreferrer">Open repository ↗</a>
          </div>
        </div>
      ) : (
        <p className="details-muted mt-3">{error || "Repository info unavailable."}</p>
      )}
    </section>
  );
}
