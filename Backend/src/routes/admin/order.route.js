import express from "express";
import { orderController } from "../../controllers/order.controller.js";
import { protectRoute } from "../../middleware/auth.middleware.js";
import { checkRole } from "../../middleware/checkRole.midlleware.js";

const routerOrder = express.Router();

routerOrder.use(protectRoute, checkRole("ADMIN"));
routerOrder.get("/", orderController.getAllOrders);
routerOrder.get("/:id", orderController.getAdminOrderDetail);
routerOrder.patch("/:id/status", orderController.updateStatus);
routerOrder.patch("/:orderId/assign-driver", orderController.assignDriver);

export default routerOrder;
