import { Router, Request, Response } from 'express';
import { createHash, randomBytes } from 'node:crypto';
import { IUser, User } from '../models/User';
import { authenticate, createAccessToken } from '../middleware/auth';
import { sendPasswordResetEmail } from '../services/emailService';

const router = Router();

function publicUser(user: Pick<IUser, '_id' | 'name' | 'email' | 'role' | 'verified'>) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    verified: user.verified,
  };
}

function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validPassword(password: string): boolean {
  return typeof password === 'string' && password.length >= 8 && password.length <= 128;
}

function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

router.post('/register', async (req: Request, res: Response): Promise<any> => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = req.body.password;

    if (name.length < 2 || name.length > 120) {
      return res.status(400).json({ error: 'Name must be between 2 and 120 characters' });
    }
    if (!validEmail(email)) {
      return res.status(400).json({ error: 'A valid email is required' });
    }
    if (!validPassword(password)) {
      return res.status(400).json({ error: 'Password must be between 8 and 128 characters' });
    }

    const existing = await User.findOne({ email }).select('_id').lean();
    if (existing) return res.status(409).json({ error: 'An account with this email already exists' });

    // Public registration can only create students. Privileged roles require a controlled admin flow.
    const user = await User.create({ name, email, passwordHash: password, role: 'student' });
    const responseUser = publicUser(user);
    return res.status(201).json({ user: responseUser, token: createAccessToken(responseUser) });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/login', async (req: Request, res: Response): Promise<any> => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = req.body.password;

    if (!validEmail(email) || typeof password !== 'string') {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = await User.findOne({ email }).select('+passwordHash +loginFailureCount +lockedUntil');
    if (user?.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(429).json({ error: 'Too many failed attempts. Try again later.' });
    }

    if (!user || !user.active || !(await user.comparePassword(password))) {
      if (user && user.active) {
        user.loginFailureCount = (user.loginFailureCount || 0) + 1;
        if (user.loginFailureCount >= 5) {
          user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
          user.loginFailureCount = 0;
        }
        await user.save();
      }
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    user.loginFailureCount = 0;
    user.lockedUntil = undefined;
    user.lastLoginAt = new Date();
    await user.save();

    const responseUser = publicUser(user);
    return res.json({ user: responseUser, token: createAccessToken(responseUser) });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/forgot-password', async (req: Request, res: Response): Promise<any> => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const genericResponse = { message: 'If an account exists for that email, a password reset link has been sent.' };
  if (!validEmail(email)) return res.json(genericResponse);

  try {
    const user = await User.findOne({ email }).select('+passwordResetTokenHash +passwordResetExpiresAt');
    if (!user || !user.active) return res.json(genericResponse);

    const token = randomBytes(32).toString('hex');
    user.passwordResetTokenHash = hashResetToken(token);
    user.passwordResetExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    const appUrl = (process.env.APP_URL || process.env.CORS_ORIGIN || 'http://localhost:6001').replace(/\/$/, '');
    await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl: `${appUrl}/reset-password?token=${token}` });
    return res.json(genericResponse);
  } catch (error) {
    return res.json(genericResponse);
  }
});

router.post('/reset-password', async (req: Request, res: Response): Promise<any> => {
  const token = typeof req.body.token === 'string' ? req.body.token.trim() : '';
  const password = req.body.password;
  if (!token || !validPassword(password)) return res.status(400).json({ error: 'A valid reset token and password are required' });

  try {
    const user = await User.findOne({ passwordResetTokenHash: hashResetToken(token) }).select('+passwordResetTokenHash +passwordResetExpiresAt +loginFailureCount');
    if (!user || !user.active || !user.passwordResetExpiresAt || user.passwordResetExpiresAt <= new Date()) {
      return res.status(400).json({ error: 'This password reset link is invalid or expired' });
    }

    user.passwordHash = password;
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;
    user.loginFailureCount = 0;
    user.lockedUntil = undefined;
    await user.save();
    return res.json({ message: 'Password reset successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to reset password' });
  }
});

router.get('/me', authenticate, async (req: Request, res: Response): Promise<any> => {
  return res.json({ user: req.user });
});

router.post('/logout', authenticate, (_req: Request, res: Response) => {
  // Access tokens are stateless in this MVP; the client removes its token.
  return res.json({ success: true });
});

export default router;
