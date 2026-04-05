import { Router } from "express";
import { branchController } from "../../controllers/branch.controller.js";
import { protectRoute } from "../../middleware/auth.middleware.js";
import { checkRole } from "../../middleware/checkRole.midlleware.js";

const router = Router();

router.use(protectRoute, checkRole("ADMIN"));
router.get("/", branchController.getAll);

export default router;
