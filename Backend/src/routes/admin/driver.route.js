import { Router } from "express";
import { driverController } from "../../controllers/driver.controller.js";
import { protectRoute } from "../../middleware/auth.middleware.js";
import { checkRole } from "../../middleware/checkRole.midlleware.js";

const router = Router();

router.use(protectRoute, checkRole("ADMIN"));
router.get("/", driverController.getAll);

export default router;
