import { Router, Request, Response } from 'express';
import { Feedback } from '../models/Feedback';
import { verifyTurnstile } from '../middleware/turnstile';

const router = Router();
const categories = new Set(['general', 'bug', 'content', 'suggestion', 'account']);

router.post('/', async (req: Request, res: Response): Promise<any> => {
  if (!(await verifyTurnstile(req, req.body.turnstileToken))) return res.status(400).json({ error: 'CAPTCHA verification failed' });

  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const category = typeof req.body.category === 'string' ? req.body.category : 'general';
  const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';

  if (name.length < 2 || name.length > 120) return res.status(400).json({ error: 'Name must be between 2 and 120 characters' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'A valid email is required' });
  if (!categories.has(category)) return res.status(400).json({ error: 'Invalid feedback category' });
  if (message.length < 10 || message.length > 5000) return res.status(400).json({ error: 'Message must be between 10 and 5000 characters' });

  const feedback = await Feedback.create({ name, email, category, message, userId: req.user?.id });
  return res.status(201).json({ message: 'Thank you. Your feedback has been submitted.', id: feedback._id });
});

export default router;
