import { Router } from "express";
import { categoryController } from "../../controllers/category.controller.js";
import { protectRoute } from "../../middleware/auth.middleware.js";
import { checkRole } from "../../middleware/checkRole.midlleware.js";

const router = Router();

router.use(protectRoute, checkRole("ADMIN"));
router.get("/", categoryController.getAll);

export default router;
