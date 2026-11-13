import { Router } from 'express';
import { activeElection, candidates, submitVote } from '../controllers/votingController.js';
import { rateLimit } from 'express-rate-limit';
const router = Router();
router.get('/active-election', activeElection);
router.get('/candidates/:electionId', candidates);
router.post('/submit', rateLimit({ windowMs: 60 * 60 * 1000, limit: 500, standardHeaders: true, legacyHeaders: false }), submitVote);
export default router;
