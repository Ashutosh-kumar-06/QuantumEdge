/**
 * paginate.js — Reusable Pagination Helper
 * 
 * Parses `page` and `limit` query parameters from the request,
 * applies defaults and bounds, and returns values ready for Mongoose queries.
 * 
 * Usage:
 *   const { page, limit, skip } = parsePagination(req.query);
 *   const results = await Model.find().skip(skip).limit(limit);
 */

/**
 * Parse pagination parameters from query string.
 * 
 * @param {object} query - Express req.query object
 * @param {object} defaults - Optional overrides for default values
 * @param {number} defaults.defaultLimit - Default items per page (default: 10)
 * @param {number} defaults.maxLimit - Maximum allowed items per page (default: 50)
 * @returns {{ page: number, limit: number, skip: number }}
 */
function parsePagination(query, defaults = {}) {
  const { defaultLimit = 10, maxLimit = 50 } = defaults;

  // Parse page — minimum 1
  let page = parseInt(query.page, 10);
  if (isNaN(page) || page < 1) page = 1;

  // Parse limit — minimum 1, maximum maxLimit
  let limit = parseInt(query.limit, 10);
  if (isNaN(limit) || limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;

  // Calculate skip for Mongoose .skip()
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Build a pagination metadata object for the response.
 * 
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total number of matching documents
 * @returns {object} Pagination metadata
 */
function buildPaginationMeta(page, limit, total) {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

module.exports = { parsePagination, buildPaginationMeta };
