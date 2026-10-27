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
    <section className="border-t border-gray-300 pt-3 text-xs">
      <h4 className="font-bold text-gray-800">Repository Information</h4>

      {loading ? (
        <p className="mt-1 text-gray-500">Loading repository info…</p>
      ) : data ? (
        <div className="mt-2 space-y-2">
          {data.repository.description && (
            <p className="text-gray-700">{data.repository.description}</p>
          )}

          <div className="border border-gray-300 p-2 space-y-1 text-gray-700">
            <p>Stars: <b>{data.repository.stars.toLocaleString()}</b> · Forks: <b>{data.repository.forks.toLocaleString()}</b> · Open issues: <b>{data.repository.openItems.toLocaleString()}</b></p>
            <p>License: <b>{data.repository.license || "None"}</b> · Default branch: <b>{data.repository.defaultBranch}</b> · Last push: <b>{formatDate(data.repository.pushedAt)}</b></p>
          </div>

          {(data.repository.archived || data.repository.disabled) && (
            <p className="text-amber-800 font-medium">
              Note: This repository is {data.repository.archived ? "archived" : "disabled"}.
            </p>
          )}

          <div className="space-y-1">
            <b>Contributing guides:</b>
            {data.contributionGuides.length > 0 ? (
              <ul className="list-disc list-inside">
                {data.contributionGuides.map((guide) => (
                  <li key={guide.path}>
                    <a
                      href={guide.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline"
                    >
                      {guide.path}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">None found.</p>
            )}
          </div>

          <div className="flex gap-3 text-xs pt-1">
            <a
              href={`${data.repository.url}/blob/${encodeURIComponent(data.repository.defaultBranch)}/README.md`}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline"
            >
              README
            </a>
            <a
              href={issueRepoUrl}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline"
            >
              Open repo on GitHub
            </a>
          </div>
        </div>
      ) : (
        <p className="mt-1 text-gray-500">
          {error || "Repository info unavailable."}
        </p>
      )}
    </section>
  );
}
