"use client";

import type { ScoutIssue } from "@/types/issue";

type Props = {
  issue: ScoutIssue;
  isSaved: boolean;
  onSelect: (issue: ScoutIssue) => void;
  onToggleSaved: (issue: ScoutIssue) => void;
};

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString();
}

export default function IssueCard({
  issue,
  isSaved,
  onSelect,
  onToggleSaved,
}: Props) {
  const updatedDate = formatDate(issue.updatedAt);

  return (
    <article className="border-b border-gray-200 py-2.5 text-xs text-gray-800">
      <div className="space-y-1">
        {/* Title row */}
        <div className="flex flex-wrap items-baseline gap-2">
          <span
            className={
              issue.state === "open"
                ? "font-semibold text-green-700"
                : "font-semibold text-gray-500"
            }
          >
            [{issue.state}]
          </span>

          <a
            href={issue.url}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-blue-600 underline hover:text-blue-800"
          >
            {issue.title}
          </a>

          <span className="text-gray-500">#{issue.number}</span>

          <span className="text-gray-400">in</span>

          <a
            href={issue.repositoryUrl}
            target="_blank"
            rel="noreferrer"
            className="text-gray-700 underline hover:text-gray-900"
          >
            {issue.repository}
          </a>

          {issue.level && issue.level !== "unspecified" && (
            <span className="text-gray-500">({issue.level})</span>
          )}
        </div>

        {/* Labels row */}
        {issue.labels.length > 0 && (
          <div className="text-gray-600">
            <span>Labels: </span>
            <span>
              {issue.labels
                .slice(0, 5)
                .map((l) => l.name)
                .join(", ")}
            </span>
          </div>
        )}

        {/* Info & action links */}
        <div className="flex flex-wrap items-center gap-3 text-gray-500">
          {updatedDate && <span>Updated: {updatedDate}</span>}

          <button
            type="button"
            onClick={() => onToggleSaved(issue)}
            className="text-blue-600 underline hover:text-blue-800"
          >
            {isSaved ? "Saved" : "Save"}
          </button>

          <button
            type="button"
            onClick={() => onSelect(issue)}
            className="text-blue-600 underline hover:text-blue-800"
          >
            Details
          </button>

          <a
            href={issue.url}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
          >
            Open on GitHub
          </a>
        </div>
      </div>
    </article>
  );
}
