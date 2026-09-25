import jwt from 'jsonwebtoken';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { User, UserRole } from '../models/User';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'change_this_to_secure_random_string') {
    throw new Error('JWT_SECRET is not configured securely');
  }
  return secret;
}

export function createAccessToken(user: AuthenticatedUser): string {
  const expiresIn = (process.env.JWT_EXPIRE || '7d') as jwt.SignOptions['expiresIn'];
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    jwtSecret(),
    { expiresIn }
  );
}

export const authenticate: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authorization = req.header('authorization');
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length).trim()
      : undefined;

    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret());
    if (typeof decoded !== 'object' || !decoded.sub || typeof decoded.sub !== 'string') {
      res.status(401).json({ error: 'Invalid authentication token' });
      return;
    }

    const user = await User.findById(decoded.sub).select('_id name email role active').lean();
    if (!user || !user.active) {
      res.status(401).json({ error: 'User account is unavailable' });
      return;
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Authentication token expired' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid authentication token' });
      return;
    }
    next(error);
  }
};

export function requireRole(...roles: UserRole[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

export function isPrivileged(user: AuthenticatedUser | undefined): boolean {
  return user?.role === 'admin' || user?.role === 'instructor';
}
