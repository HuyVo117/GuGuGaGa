import express from "express";
import { orderController } from "../../controllers/order.controller.js";

const routerOrder = express.Router();

// Tạo đơn hàng từ cart
routerOrder.post("/create", orderController.createOrder);

// Lấy danh sách đơn hàng của user
routerOrder.get("/", orderController.getOrders);

// Lấy chi tiết đơn hàng
routerOrder.get("/:id", orderController.getOrderDetail);

export default routerOrder;
