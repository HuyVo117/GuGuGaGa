import { Router } from 'express';
const router = Router();
router.get('/health', (req, res) => res.json({ scope: 'public', ok: true }));
export default router;
