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

export default function AvailabilitySection({
  loading,
  error,
  data,
  originalTitle,
  onRefresh,
}: Props) {
  return (
    <section className="border-t border-white/10 pt-7" aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-cyan-200">
            [ Issue status ]
          </p>
          <h3 className="mt-2 text-xl font-bold">Check before you contribute</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Refresh the issue directly from GitHub before starting work.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:border-cyan-300/40 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Checking GitHub..." : "Refresh from GitHub ↻"}
        </button>
      </div>

      {loading && (
        <div
          role="status"
          className="mt-5 rounded-lg border border-white/10 bg-white/2 p-5 text-sm text-slate-400"
        >
          Fetching the latest issue status from GitHub...
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-5 rounded-lg border border-red-400/20 bg-red-400/5 p-5"
        >
          <p className="font-semibold text-red-200">Could not refresh issue status</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">{error}</p>
          <p className="mt-2 text-sm text-slate-400">
            Open the original GitHub issue to verify its current state.
          </p>
        </div>
      )}

      {data && !loading && (
        <div className="mt-5 space-y-4">
          <div className="rounded-lg border border-white/10 bg-white/2 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  data.issue.state === "open"
                    ? "bg-emerald-400/10 text-emerald-300"
                    : "bg-amber-400/10 text-amber-200"
                }`}
              >
                {data.issue.state.toUpperCase()}
              </span>

              {data.issue.locked && (
                <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200">
                  LOCKED
                </span>
              )}
            </div>

            {data.issue.title !== originalTitle && (
              <p className="mt-4 text-sm leading-6 text-amber-100">
                The issue title has changed since these search results were loaded. Current GitHub title:{" "}
                <span className="font-semibold">{data.issue.title}</span>
              </p>
            )}

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-white/10 p-4">
                <p className="text-xs text-slate-500">Last updated on GitHub</p>
                <p className="mt-1 text-sm font-semibold">
                  {formatDateTime(data.issue.updatedAt)}
                </p>
              </div>

              <div className="rounded-lg border border-white/10 p-4">
                <p className="text-xs text-slate-500">Public comment count</p>
                <p className="mt-1 text-sm font-semibold tabular-nums">
                  {data.issue.commentCount}
                </p>
              </div>
            </div>

            {data.issue.state === "closed" && (
              <div
                role="alert"
                className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/5 p-4"
              >
                <p className="font-semibold text-amber-100">This issue is closed.</p>
                {data.issue.stateReason && (
                  <p className="mt-2 text-sm text-slate-300">
                    GitHub close reason: {data.issue.stateReason.replace(/_/g, " ")}
                  </p>
                )}
                {data.issue.closedAt && (
                  <p className="mt-2 text-sm text-slate-400">
                    Closed on {formatDateTime(data.issue.closedAt)}.
                  </p>
                )}
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Review the discussion and linked pull requests before investing time in a solution.
                </p>
              </div>
            )}

            {data.issue.locked && (
              <div
                role="status"
                className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/5 p-4"
              >
                <p className="font-semibold text-amber-100">This discussion is locked.</p>
                {data.issue.activeLockReason && (
                  <p className="mt-2 text-sm text-slate-300">
                    Lock reason: {data.issue.activeLockReason}
                  </p>
                )}
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  You may be unable to comment on this issue.
                </p>
              </div>
            )}

            <div className="mt-5">
              <h4 className="font-semibold text-slate-100">Assigned contributors</h4>
              {data.issue.assignees.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {data.issue.assignees.map((assignee) => (
                    <a
                      key={assignee.login}
                      href={assignee.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-cyan-200 hover:border-cyan-300/40 hover:underline"
                    >
                      @{assignee.login} ↗
                    </a>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  No assignee is listed on GitHub. This does not guarantee that the issue is unclaimed.
                </p>
              )}
            </div>

            {data.issue.labels.length > 0 && (
              <div className="mt-5">
                <h4 className="font-semibold text-slate-100">Current GitHub labels</h4>
                <div className="mt-3 flex flex-wrap gap-2">
                  {data.issue.labels.map((label) => (
                    <span
                      key={label.name}
                      className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300"
                    >
                      {label.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <a
              href={data.issue.url}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-block text-sm font-semibold text-cyan-200 hover:underline"
            >
              Verify current issue on GitHub ↗
            </a>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/2 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-semibold text-slate-100">Recent discussion</h4>
              <span className="text-xs text-slate-500">Latest 3 comments</span>
            </div>

            {!data.recentCommentsAvailable ? (
              <p className="mt-3 text-sm leading-6 text-slate-400">
                The current issue status loaded, but recent comments could not be retrieved. Check the original issue on GitHub.
              </p>
            ) : data.recentComments.length === 0 ? (
              <p className="mt-3 text-sm leading-6 text-slate-400">
                No public comments were returned for this issue.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {data.recentComments.map((comment) => {
                  const body = comment.body?.trim() ?? "";
                  return (
                    <article key={comment.id} className="rounded-lg border border-white/10 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <a
                          href={comment.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-cyan-200 hover:underline"
                        >
                          @{comment.author} ↗
                        </a>
                        <span className="text-xs text-slate-500">
                          {formatDateTime(comment.createdAt)}
                        </span>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap wrap-break-words text-sm leading-6 text-slate-300">
                        {body ? `${body.slice(0, 280)}${body.length > 280 ? "…" : ""}` : "This comment has no text content."}
                      </p>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
