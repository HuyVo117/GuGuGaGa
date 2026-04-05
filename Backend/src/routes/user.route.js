import { Router } from 'express';
import userAuthRoute from './user/user-auth.route.js';
import cartRoute from './user/cart.route.js';
import orderRoute from './user/order.route.js';
const router = Router();
router.use('/auth', userAuthRoute);
router.use('/cart', cartRoute);
router.use('/orders', orderRoute);
export default router;
