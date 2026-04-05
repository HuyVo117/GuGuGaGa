import express from "express";
import { orderController } from "../../controllers/order.controller.js";
import { protectRoute } from "../../middleware/auth.middleware.js";

const routerOrder = express.Router();

routerOrder.use(protectRoute);
routerOrder.get("/", orderController.getOrders);
routerOrder.get("/:id", orderController.getOrderDetail);
routerOrder.post("/", orderController.createOrder);

export default routerOrder;
