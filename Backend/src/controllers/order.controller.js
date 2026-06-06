import { orderService } from "../services/order.service.js";
import { cartService } from "../services/cart.service.js";
import { ApiResponse } from "../configs/apiResponse.js";

export const orderController = {
  // Lấy tất cả đơn hàng (ADMIN)
  getAllOrders: async (req, res) => {
    try {
      const orders = await orderService.getAll();
      return ApiResponse.success(
        res,
        orders,
        "Lấy tất cả đơn hàng thành công."
      );
    } catch (error) {
      console.error("[getAllOrders]", error);
      return ApiResponse.error(res, error);
    }
  },
  getAdminOrderDetail: async (req, res) => {
    try {
      const orderId = req.params.id;
      const order = await orderService.getAdminOrderDetail(orderId);
      if (!order) {
        return ApiResponse.error(res, { message: "Đơn hàng không tồn tại." }, 404);
      }
      return ApiResponse.success(res, order, "Lấy chi tiết đơn hàng thành công.");
    } catch (error) {
      console.error("[getAdminOrderDetail]", error);
      return ApiResponse.error(res, error);
    }
  },
  createOrder: async (req, res) => {
    try {
      const userId = req.user.id;
      const { branchId, paymentMethod, deliveryAddress, deliveryPhone } =
        req.body;

      console.log(`[createOrder] userId=${userId}, branchId=${branchId}`);

      if (!branchId || !paymentMethod || !deliveryAddress || !deliveryPhone) {
        return ApiResponse.error(
          res,
          { message: "Thiếu thông tin đặt hàng." },
          400
        );
      }

      const cart = await cartService.getCart(userId, branchId);
      console.log(`[createOrder] cart.id=${cart?.id}, items=${cart?.cartItem?.length}`);

      if (!cart || !cart.cartItem || cart.cartItem.length === 0) {
        return ApiResponse.error(
          res,
          { message: "Giỏ hàng trống, không thể tạo đơn hàng." },
          400
        );
      }

      const order = await orderService.createOrder(userId, cart, req.body);

      return ApiResponse.success(res, order, "Đặt hàng thành công.");
    } catch (error) {
      console.error("[createOrder]", error);
      return ApiResponse.error(res, error);
    }
  },

  getOrders: async (req, res) => {
    try {
      const userId = req.user.id;
      const orders = await orderService.getOrdersByUser(userId);

      return ApiResponse.success(
        res,
        orders,
        "Lấy danh sách đơn hàng thành công."
      );
    } catch (error) {
      console.error("[getOrders]", error);
      return ApiResponse.error(res, error);
    }
  },

  getOrderDetail: async (req, res) => {
    try {
      const orderId = req.params.id;
      const userId = req.user.id;

      const order = await orderService.getOrderDetail(orderId, userId);

      if (!order) {
        return ApiResponse.error(
          res,
          { message: "Đơn hàng không tồn tại." },
          404
        );
      }

      return ApiResponse.success(
        res,
        order,
        "Lấy chi tiết đơn hàng thành công."
      );
    } catch (error) {
      console.error("[getOrderDetail]", error);
      return ApiResponse.error(res, error);
    }
  },
  async updateStatus(req, res) {
    try {
      const order = await orderService.updateStatus(
        req.params.id,
        req.body.status
      );

      return ApiResponse.success(res, order, "Cập nhật trạng thái thành công");
    } catch (error) {
      return ApiResponse.error(res, error);
    }
  },
  async assignDriver(req, res) {
    try {
      const { orderId } = req.params;
      const { driverId } = req.body;

      const order = await orderService.assignDriver(orderId, driverId);

      return ApiResponse.success(res, order, "Gán tài xế thành công");
    } catch (error) {
      return ApiResponse.error(res, error);
    }
  },
  getPaymentConfig: async (req, res) => {
    try {
      const bankId = process.env.BANK_ID || "MB";
      const accountNo = process.env.BANK_ACCOUNT_NO || "1234567890";
      const accountName = process.env.BANK_ACCOUNT_NAME || "GUGUGAGA FOOD STORE";
      
      return ApiResponse.success(res, {
        bankId,
        accountNo,
        accountName,
      }, "Lấy cấu hình thanh toán thành công.");
    } catch (error) {
      console.error("[getPaymentConfig]", error);
      return ApiResponse.error(res, error);
    }
  },
  checkPayment: async (req, res) => {
    try {
      const orderId = req.params.id;
      const force = req.query.force === "true";
      const result = await orderService.checkPayment(orderId, force);
      return ApiResponse.success(res, result, "Kiểm tra thanh toán thành công.");
    } catch (error) {
      console.error("[checkPayment]", error);
      return ApiResponse.error(res, error);
    }
  },
  cassoWebhook: async (req, res) => {
    try {
      console.log("[Casso Webhook Received]:", JSON.stringify(req.body));
      const result = await orderService.handleCassoWebhook(req.body);
      return res.status(200).json(result);
    } catch (error) {
      console.error("[cassoWebhook Error]:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  },
};
