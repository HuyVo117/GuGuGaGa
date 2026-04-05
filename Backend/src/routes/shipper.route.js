import { Router } from 'express';
import shipperAuthRoute from './shipper/shipper-auth.route.js';
const router = Router();
router.use('/auth', shipperAuthRoute);
export default router;
