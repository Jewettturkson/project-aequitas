function parseNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getClientIp(req) {
  if (req.ip) {
    return req.ip;
  }

  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }

  return req.socket?.remoteAddress || 'unknown';
}

function createIpRateLimiter({
  windowMs,
  maxRequests,
  errorCode = 'RATE_LIMITED',
  message = 'Too many requests. Please retry later.',
} = {}) {
  const resolvedWindowMs = parseNumber(windowMs, 60_000);
  const resolvedMaxRequests = parseNumber(maxRequests, 30);
  const buckets = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = getClientIp(req);

    const existing = buckets.get(key);
    if (!existing || now >= existing.resetAt) {
      buckets.set(key, {
        count: 1,
        resetAt: now + resolvedWindowMs,
      });
      return next();
    }

    if (existing.count >= resolvedMaxRequests) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((existing.resetAt - now) / 1000)
      );
      res.setHeader('Retry-After', String(retryAfterSeconds));
      return res.status(429).json({
        success: false,
        errorCode,
        message,
        retryAfterSeconds,
      });
    }

    existing.count += 1;
    return next();
  };
}

module.exports = {
  createIpRateLimiter,
};
