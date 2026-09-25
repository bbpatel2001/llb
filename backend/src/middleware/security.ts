import { randomUUID } from 'node:crypto';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { AuditLog } from '../models/AuditLog';

const buckets = new Map<string, { count: number; resetAt: number }>();

export function requestContext(req: Request, _res: Response, next: NextFunction): void {
  req.requestId = req.header('x-request-id')?.slice(0, 120) || randomUUID();
  next();
}

export function rateLimit(options: { windowMs: number; max: number; name: string; key?: (req: Request) => string }): RequestHandler {
  return (req, res, next) => {
    const now = Date.now();
    const key = `${options.name}:${options.key ? options.key(req) : req.ip}`;
    const current = buckets.get(key);
    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      res.setHeader('X-RateLimit-Limit', options.max);
      next();
      return;
    }
    current.count += 1;
    res.setHeader('X-RateLimit-Limit', options.max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, options.max - current.count));
    res.setHeader('Retry-After', Math.ceil((current.resetAt - now) / 1000));
    if (current.count > options.max) {
      res.status(429).json({ error: 'Too many requests', retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000) });
      return;
    }
    next();
  };
}

export function validatePaginationQuery(req: Request, res: Response, next: NextFunction): void {
  for (const key of ['skip', 'limit']) {
    if (req.query[key] === undefined) continue;
    const value = Number(req.query[key]);
    if (!Number.isInteger(value) || value < 0 || (key === 'limit' && value > 500)) {
      res.status(400).json({ error: `${key} must be a non-negative integer${key === 'limit' ? ' no greater than 500' : ''}` });
      return;
    }
  }
  next();
}

export function auditPrivilegedMutation(req: Request, res: Response, next: NextFunction): void {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }
  res.on('finish', () => {
    void AuditLog.create({
      actorId: req.user?.id,
      action: `${req.method} ${req.path}`,
      resourceType: 'admin-api',
      resourceId: req.params.syllabusId || req.params.batchId || req.params.questionId,
      result: res.statusCode < 400 ? 'success' : 'failure',
      requestId: req.requestId,
      ip: req.ip,
      userAgent: req.get('user-agent')?.slice(0, 500),
      metadata: { statusCode: res.statusCode },
    }).catch(() => undefined);
  });
  next();
}

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}
