"use client";

type Props = {
  page: number;
  totalPages: number;
  totalCount: number;
  availableCount: number;
  onPageChange: (newPage: number) => void;
};

export default function Pagination({ page, totalPages, totalCount, onPageChange }: Props) {
  return (
    <div className="pagination">
      <span>
        Found <strong>{totalCount.toLocaleString()}</strong> issues
      </span>

      {totalPages > 1 && (
        <div className="pagination-controls">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="pagination-button"
          >
            ← Previous
          </button>
          <span>Page <strong>{page}</strong> of {totalPages}</span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="pagination-button"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
