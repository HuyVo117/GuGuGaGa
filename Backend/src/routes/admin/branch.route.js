import { Router } from "express";
import { branchController } from "../../controllers/branch.controller.js";
import { protectRoute } from "../../middleware/auth.middleware.js";
import { checkRole } from "../../middleware/checkRole.midlleware.js";

const router = Router();

router.use(protectRoute, checkRole("ADMIN"));
router.get("/", branchController.getAll);
router.post("/", branchController.create);
router.put("/:id", branchController.update);
router.delete("/:id", branchController.delete);

export default router;

