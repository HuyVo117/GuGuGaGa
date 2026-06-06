import express from "express";
import { orderController } from "../../controllers/order.controller.js";

const routerOrder = express.Router();
routerOrder.get("/", orderController.getAllOrders);
routerOrder.get("/:id", orderController.getAdminOrderDetail);
// Update status
routerOrder.patch("/:id/status", orderController.updateStatus);

// 🆕 ADMIN chọn tài xế giao hàng
routerOrder.patch("/:orderId/assign-driver", orderController.assignDriver);

export default routerOrder;
