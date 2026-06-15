const rateLimit = require('express-rate-limit');

// ─── Auth Rate Limiter ─────────────────────────────────────────────────────────
// Strict: max 5 login/register attempts per 15 minutes (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,  // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts from this IP. Please try again after 15 minutes.',
  },
  skipSuccessfulRequests: false,
  skip: (req) => {
    if (process.env.NODE_ENV === 'test') {
      return !req.headers['x-test-rate-limit'];
    }
    if (process.env.NODE_ENV !== 'production') {
      return true; // Bypass in dev/local
    }
    return false;
  },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  },
});

// ─── General API Rate Limiter ──────────────────────────────────────────────────
// Lenient: max 200 requests per 15 minutes for general API usage
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.',
  },
  skip: (req) => {
    if (process.env.NODE_ENV === 'test') {
      return !req.headers['x-test-rate-limit'];
    }
    if (process.env.NODE_ENV !== 'production') {
      return true; // Bypass in dev/local
    }
    return false;
  },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  },
});

// ─── Report Download Rate Limiter ──────────────────────────────────────────────
// Prevent abuse of heavy PDF/CSV generation endpoints
const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many report generation requests. Please wait before generating more reports.',
  },
  skip: (req) => {
    if (process.env.NODE_ENV === 'test') {
      return !req.headers['x-test-rate-limit'];
    }
    if (process.env.NODE_ENV !== 'production') {
      return true; // Bypass in dev/local
    }
    return false;
  },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  },
});

module.exports = { authLimiter, generalLimiter, reportLimiter };

