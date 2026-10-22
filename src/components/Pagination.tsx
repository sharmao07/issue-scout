"use client";

type Props = {
  page: number;
  totalPages: number;
  totalCount: number;
  availableCount: number;
  onPageChange: (newPage: number) => void;
};

export default function Pagination({
  page,
  totalPages,
  totalCount,
  availableCount,
  onPageChange,
}: Props) {
  return (
    <div className="mt-6 space-y-3">
      {totalPages > 1 && (
        <nav
          aria-label="Issue result pages"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/2 p-4"
        >
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Previous
          </button>

          <span className="text-sm text-slate-400">
            Page {page} of {totalPages}
            <span className="hidden sm:inline"> · Up to 50 per page</span>
          </span>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next →
          </button>
        </nav>
      )}

      <p className="text-xs leading-5 text-slate-500">
        GitHub reports {totalCount.toLocaleString()} matching results. Issue Scout can access up to{" "}
        {availableCount.toLocaleString()} results for this search, with a maximum of 1,000 per query.
      </p>
    </div>
  );
}
