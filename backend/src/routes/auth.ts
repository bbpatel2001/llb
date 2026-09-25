import { Router, Request, Response } from 'express';
import { IUser, User } from '../models/User';
import { authenticate, createAccessToken } from '../middleware/auth';

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

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !user.active || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const responseUser = publicUser(user);
    return res.json({ user: responseUser, token: createAccessToken(responseUser) });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
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
