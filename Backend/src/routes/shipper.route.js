import { Router } from "express";
import { shipperController } from "../controllers/shipper.controller.js";
import { protectDriverRoute } from "../middleware/driver.auth.middleware.js";
import shipperAuthRoute from "./shipper/shipper-auth.route.js";

const router = Router();

router.use("/auth", shipperAuthRoute);
router.get("/orders/available", protectDriverRoute, shipperController.getAvailableOrders);
router.post("/orders/:id/accept", protectDriverRoute, shipperController.acceptOrder);
router.get("/orders", protectDriverRoute, shipperController.getMyOrders);
router.patch("/orders/:id/status", protectDriverRoute, shipperController.updateOrderStatus);
router.post("/location", protectDriverRoute, shipperController.updateLocation);

export default router;
