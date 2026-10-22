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
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleDateString();
}

export default function IssueCard({
  issue,
  isSaved,
  onSelect,
  onToggleSaved,
}: Props) {
  return (
    <article className="group relative overflow-hidden rounded-lg border border-white/10 bg-[#0d1220] p-5 transition hover:border-cyan-300/30 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <a
          href={issue.repositoryUrl}
          target="_blank"
          rel="noreferrer"
          className="break-all text-sm font-semibold text-cyan-200 hover:underline"
        >
          {issue.repository}
        </a>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
              issue.state === "open"
                ? "bg-emerald-400/10 text-emerald-300"
                : "bg-slate-400/10 text-slate-300"
            }`}
          >
            {issue.state}
          </span>

          <span className="rounded-full bg-white/5 px-3 py-1 text-xs capitalize text-slate-400">
            {issue.level}
          </span>

          <button
            type="button"
            onClick={() => onToggleSaved(issue)}
            aria-pressed={isSaved}
            className="rounded-md border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-cyan-300/40 hover:text-cyan-200"
          >
            {isSaved ? "★ Saved" : "☆ Save"}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onSelect(issue)}
        className="mt-4 block text-left text-lg font-bold leading-7 transition hover:text-cyan-200 sm:text-xl"
      >
        {issue.title}
        <span className="ml-2 inline-block text-sm text-slate-500">
          #{issue.number}
        </span>
      </button>

      <p className="mt-3 whitespace-pre-wrap wrap-break-words text-sm leading-6 text-slate-400">
        {(issue.body ?? "No description provided.").slice(0, 280)}
        {(issue.body?.length ?? 0) > 280 ? "…" : ""}
      </p>

      {issue.labels.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {issue.labels.slice(0, 6).map((item) => (
            <span
              key={item.name}
              className="rounded-md border border-white/10 bg-white/2 px-2.5 py-1 text-xs text-slate-300"
            >
              {item.name}
            </span>
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/5 pt-4 text-xs text-slate-500">
        <span>by {issue.author}</span>
        <span>{issue.comments} comments</span>
        <span>Created {formatDate(issue.createdAt)}</span>
        <span>Updated {formatDate(issue.updatedAt)}</span>

        <button
          type="button"
          onClick={() => onSelect(issue)}
          className="font-semibold text-cyan-300 hover:underline"
        >
          Preview issue
        </button>

        <a
          href={issue.url}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-cyan-300 hover:underline"
        >
          View on GitHub ↗
        </a>
      </div>
    </article>
  );
}
