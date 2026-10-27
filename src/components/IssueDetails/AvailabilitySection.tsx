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
    <section className="border-t border-gray-300 pt-3 text-xs" aria-live="polite">
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-bold text-gray-800">Live GitHub Status</h4>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="border border-gray-400 bg-gray-100 px-2 py-0.5 text-xs text-gray-800 hover:bg-gray-200 disabled:opacity-50"
        >
          {loading ? "Checking…" : "Refresh"}
        </button>
      </div>

      {loading && (
        <p className="mt-1 text-gray-500">Checking GitHub status…</p>
      )}

      {error && (
        <p className="mt-1 text-red-600">Error: {error}</p>
      )}

      {data && !loading && (
        <div className="mt-2 space-y-2 border border-gray-300 p-2.5">
          <p>
            Current state: <b>[{data.issue.state}]</b> {data.issue.locked ? "(Locked)" : ""}
          </p>

          {data.issue.title !== originalTitle && (
            <p className="text-amber-800">
              Title changed on GitHub: <b>{data.issue.title}</b>
            </p>
          )}

          <p>Updated: {formatDateTime(data.issue.updatedAt)} · Comments: {data.issue.commentCount}</p>

          {data.issue.state === "closed" && (
            <p className="text-gray-700">
              Closed at: {data.issue.closedAt ? formatDateTime(data.issue.closedAt) : "unknown"}
            </p>
          )}

          <div>
            <b>Assignees:</b>{" "}
            {data.issue.assignees.length > 0
              ? data.issue.assignees.map((a) => (
                  <a
                    key={a.login}
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mr-2 text-blue-600 underline"
                  >
                    @{a.login}
                  </a>
                ))
              : "None"}
          </div>

          {/* Recent Comments */}
          <div className="border-t border-gray-200 pt-2 mt-2">
            <b>Recent comments:</b>
            {!data.recentCommentsAvailable ? (
              <p className="text-gray-500">Comments could not be retrieved.</p>
            ) : data.recentComments.length === 0 ? (
              <p className="text-gray-500">No public comments.</p>
            ) : (
              <div className="mt-1 space-y-1.5">
                {data.recentComments.map((comment) => (
                  <div key={comment.id} className="border-b border-gray-100 pb-1">
                    <span className="font-medium text-gray-700">@{comment.author}</span>{" "}
                    <span className="text-gray-400">({formatDateTime(comment.createdAt)}):</span>
                    <p className="text-gray-600">
                      {comment.body?.trim() ? comment.body.slice(0, 200) : "Empty"}
                      {(comment.body?.length ?? 0) > 200 ? "…" : ""}
                    </p>
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
