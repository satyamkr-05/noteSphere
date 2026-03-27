export default function PaginationControls({
  pagination,
  onPageChange,
  itemLabel = "items"
}) {
  if (!pagination || pagination.totalPages <= 1) {
    return null;
  }

  const startItem =
    pagination.totalItems === 0
      ? 0
      : (pagination.currentPage - 1) * pagination.limit + 1;
  const endItem = Math.min(
    pagination.currentPage * pagination.limit,
    pagination.totalItems
  );

  return (
    <div className="pagination-controls glass-card">
      <p className="pagination-controls__summary">
        Showing {startItem}-{endItem} of {pagination.totalItems} {itemLabel}
      </p>

      <div className="pagination-controls__buttons">
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => onPageChange(pagination.currentPage - 1)}
          disabled={!pagination.hasPreviousPage}
        >
          Previous
        </button>
        <span className="pagination-controls__page">
          Page {pagination.currentPage} of {pagination.totalPages}
        </span>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => onPageChange(pagination.currentPage + 1)}
          disabled={!pagination.hasNextPage}
        >
          Next
        </button>
      </div>
    </div>
  );
}
