"use client";

import type { AvailabilityPayload } from "@/types/contribution";

type Props = {
  loading: boolean;
  error?: string;
  data: AvailabilityPayload | null;
  originalTitle: string;
  onRefresh: () => void;
};

function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleString();
}

export default function AvailabilitySection({ loading, error, data, originalTitle, onRefresh }: Props) {
  return (
    <section className="details-section" aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4>Live GitHub status</h4>
          <p className="details-muted mt-1">A fresh check of the issue’s current state.</p>
        </div>
        <button type="button" onClick={onRefresh} disabled={loading} className="secondary-button">
          {loading ? "Checking…" : "Refresh"}
        </button>
      </div>

      {loading && <p className="details-muted mt-3">Checking GitHub status…</p>}
      {error && <p className="mt-3 text-red-700">Error: {error}</p>}

      {data && !loading && (
        <div className="details-surface space-y-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>Current state: <b>{data.issue.state}</b>{data.issue.locked ? " · Locked" : ""}</span>
            <span>Comments: <b>{data.issue.commentCount}</b></span>
          </div>

          {data.issue.title !== originalTitle && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800">
              The title has changed on GitHub: <b>{data.issue.title}</b>
            </p>
          )}

          <p className="details-muted">Updated {formatDateTime(data.issue.updatedAt)}
            {data.issue.state === "closed" && ` · Closed ${data.issue.closedAt ? formatDateTime(data.issue.closedAt) : "at an unknown time"}`}
          </p>

          <div>
            <b>Assignees:</b>{" "}
            {data.issue.assignees.length > 0
              ? data.issue.assignees.map((a) => (
                  <a key={a.login} href={a.url} target="_blank" rel="noreferrer" className="mr-2">@{a.login}</a>
                ))
              : <span className="details-muted">None</span>}
          </div>

          <div className="border-t border-[var(--line)] pt-3">
            <b>Recent comments</b>
            {!data.recentCommentsAvailable ? (
              <p className="details-muted mt-1">Comments could not be retrieved.</p>
            ) : data.recentComments.length === 0 ? (
              <p className="details-muted mt-1">No public comments.</p>
            ) : (
              <div className="mt-2 space-y-3">
                {data.recentComments.map((comment) => (
                  <div key={comment.id} className="border-b border-[var(--line)] pb-2 last:border-0">
                    <div className="flex flex-wrap gap-2">
                      <span className="font-semibold text-[var(--ink)]">@{comment.author}</span>
                      <span className="details-muted">{formatDateTime(comment.createdAt)}</span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap">{comment.body?.trim() ? comment.body.slice(0, 200) : "Empty"}{(comment.body?.length ?? 0) > 200 ? "…" : ""}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
