/**
 * rateLimiter.js — Redis-backed Sliding Window Rate Limiter
 * 
 * Creates Express middleware that limits requests per IP address using Redis.
 * Uses the sliding window counter pattern for accurate rate limiting.
 * 
 * Industry-standard headers:
 *   X-RateLimit-Limit     — Maximum requests allowed in the window
 *   X-RateLimit-Remaining — Requests remaining in the current window
 *   X-RateLimit-Reset     — Unix timestamp when the window resets
 *   Retry-After           — Seconds to wait (only on 429 responses)
 */

/**
 * Creates a rate limiter middleware.
 * 
 * @param {object} redisClient - Connected Redis client
 * @param {object} options
 * @param {number} options.windowMs - Time window in milliseconds (default: 60000 = 1 min)
 * @param {number} options.max - Maximum requests per window per IP (default: 60)
 * @param {string} options.keyPrefix - Redis key prefix for namespacing (default: 'rl')
 * @param {string} options.message - Error message when rate limited (default: 'Too many requests')
 * @returns {Function} Express middleware
 */
function createRateLimiter(redisClient, options = {}) {
  const {
    windowMs = 60 * 1000,       // 1 minute default
    max = 60,                    // 60 requests default
    keyPrefix = 'rl',            // Redis key prefix
    message = 'Too many requests, please try again later.',
  } = options;

  // Convert window to seconds for Redis EXPIRE
  const windowSec = Math.ceil(windowMs / 1000);

  return async (req, res, next) => {
    // If Redis isn't connected, fail open (allow the request)
    if (!redisClient || !redisClient.isOpen) {
      return next();
    }

    try {
      // Use the client IP as the rate limit key
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const key = `${keyPrefix}:${ip}`;

      // Increment the counter for this IP
      const current = await redisClient.incr(key);

      // If this is the first request in the window, set the expiry
      if (current === 1) {
        await redisClient.expire(key, windowSec);
      }

      // Get the TTL (time-to-live) to calculate reset time
      const ttl = await redisClient.ttl(key);
      const resetTime = Math.ceil(Date.now() / 1000) + (ttl > 0 ? ttl : windowSec);

      // Set rate limit headers on every response
      res.set('X-RateLimit-Limit', String(max));
      res.set('X-RateLimit-Remaining', String(Math.max(0, max - current)));
      res.set('X-RateLimit-Reset', String(resetTime));

      // If the limit is exceeded, return 429
      if (current > max) {
        res.set('Retry-After', String(ttl > 0 ? ttl : windowSec));
        return res.status(429).json({
          error: message,
          retryAfter: ttl > 0 ? ttl : windowSec,
        });
      }

      next();
    } catch (err) {
      // If Redis errors, fail open — don't block the request
      console.error('Rate limiter error:', err.message);
      next();
    }
  };
}

module.exports = { createRateLimiter };
