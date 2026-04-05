import { Router } from "express";
import { cartController } from "../../controllers/cart.controller.js";
import { protectRoute } from "../../middleware/auth.middleware.js";

const router = Router();

router.use(protectRoute);
router.get("/", cartController.getCart);
router.post("/items", cartController.addItem);
router.patch("/items/:itemId", cartController.updateItem);
router.delete("/items/:itemId", cartController.removeItem);

export default router;
