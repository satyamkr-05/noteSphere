function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

export function parsePagination(query, { defaultLimit = 12, maxLimit = 48 } = {}) {
  return {
    page: parsePositiveInteger(query.page, 1),
    limit: Math.min(parsePositiveInteger(query.limit, defaultLimit), maxLimit)
  };
}

export function buildPagination(requestedPagination, totalItems) {
  const totalPages = totalItems > 0 ? Math.ceil(totalItems / requestedPagination.limit) : 1;
  const currentPage = Math.min(requestedPagination.page, totalPages);

  return {
    currentPage,
    limit: requestedPagination.limit,
    totalItems,
    totalPages,
    hasPreviousPage: currentPage > 1,
    hasNextPage: currentPage < totalPages,
    skip: (currentPage - 1) * requestedPagination.limit
  };
}

export function serializePagination(pagination) {
  const { skip, ...responsePagination } = pagination;
  return responsePagination;
}
