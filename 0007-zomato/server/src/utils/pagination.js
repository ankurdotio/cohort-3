// Reads ?page and ?limit from the query string and returns safe numbers.
function getPagination(query, defaultLimit = 10, maxLimit = 50) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), maxLimit);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

module.exports = getPagination;
