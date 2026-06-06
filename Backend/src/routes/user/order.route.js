import express from "express";
import { orderController } from "../../controllers/order.controller.js";
import { reviewController } from "../../controllers/review.controller.js";

const routerOrder = express.Router();

// Lấy cấu hình tài khoản ngân hàng (Cần để trước /:id để tránh trùng khớp tham số ID)
routerOrder.get("/payment-config", orderController.getPaymentConfig);

// Tạo đơn hàng từ cart
routerOrder.post("/create", orderController.createOrder);

// Lấy danh sách đơn hàng của user
routerOrder.get("/", orderController.getOrders);

// Kiểm tra trạng thái thanh toán chuyển khoản qua Casso
routerOrder.get("/:id/check-payment", orderController.checkPayment);

// Lấy chi tiết đơn hàng
routerOrder.get("/:id", orderController.getOrderDetail);

// Đánh giá đơn hàng
routerOrder.post("/:id/reviews", reviewController.createOrderReview);

export default routerOrder;
