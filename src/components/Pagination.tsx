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
  onPageChange,
}: Props) {
  return (
    <div className="mt-4 pt-2 border-t border-gray-300 text-xs">
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 py-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="border border-gray-400 bg-gray-100 px-3 py-1 text-gray-800 hover:bg-gray-200 disabled:opacity-40"
          >
            Previous
          </button>

          <span className="text-gray-700">
            Page {page} of {totalPages}
          </span>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="border border-gray-400 bg-gray-100 px-3 py-1 text-gray-800 hover:bg-gray-200 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      <p className="mt-1 text-gray-500">
        Found {totalCount.toLocaleString()} issues.
      </p>
    </div>
  );
}
