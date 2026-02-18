import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import type { Request } from 'express';

// General API rate limiter - 100 requests per 15 minutes per IP
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests, please try again later',
  },
});

// SDK log ingestion limiter - 1000 requests per minute per API key
export const sdkLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => (req.headers['x-api-key'] as string) || ipKeyGenerator(req),
  message: {
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many SDK requests, please slow down',
  },
});

// Auth rate limiter - 10 login attempts per minute per IP
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many login attempts, please try again later',
  },
});
