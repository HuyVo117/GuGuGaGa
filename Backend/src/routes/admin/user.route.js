import { Router } from "express";
import { userController } from "../../controllers/user.controller.js";
import { protectRoute } from "../../middleware/auth.middleware.js";
import { checkRole } from "../../middleware/checkRole.midlleware.js";

const router = Router();

router.use(protectRoute, checkRole("ADMIN"));
router.get("/", userController.getAll);

export default router;
