import express from "express";
import { shipperController } from "../../controllers/shipper.controller.js";
import { protectDriverRoute } from "../../middleware/driver.auth.middleware.js";

const router = express.Router();

router.post("/login", shipperController.login);
router.get("/orders", protectDriverRoute, shipperController.getAssignedOrders);
router.put(
  "/orders/:id/status",
  protectDriverRoute,
  shipperController.updateOrderStatus
);

router.put("/location", protectDriverRoute, shipperController.updateLocation);

export default router;
