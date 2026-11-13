import { Router } from 'express';
import { login, logout, me } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { rateLimit } from 'express-rate-limit';
const router = Router();
router.post('/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false }), login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);
export default router;
