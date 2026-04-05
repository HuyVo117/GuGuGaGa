import { ApiResponse } from "../configs/apiResponse.js";
import { cartService } from "../services/cart.service.js";
import { orderService } from "../services/order.service.js";

export const orderController = {
	// ADMIN
	async getAllOrders(req, res) {
		try {
			const orders = await orderService.getAll();
			return ApiResponse.success(res, orders, "Lay tat ca don hang thanh cong.");
		} catch (error) {
			return ApiResponse.error(res, error);
		}
	},

	async getAdminOrderDetail(req, res) {
		try {
			const orderId = Number(req.params.id);
			const order = await orderService.getAdminOrderDetail(orderId);
			if (!order) {
				return ApiResponse.error(res, new Error("Don hang khong ton tai."), 404);
			}
			return ApiResponse.success(res, order, "Lay chi tiet don hang thanh cong.");
		} catch (error) {
			return ApiResponse.error(res, error);
		}
	},

	// USER
	async createOrder(req, res) {
		try {
			const userId = req.user.id;
			const { paymentMethod = "COD" } = req.body;

			const cart = await cartService.getCart(userId);
			if (!cart || cart.cartItems.length === 0) {
				return ApiResponse.error(res, new Error("Gio hang trong, khong the tao don hang."), 400);
			}

			const order = await orderService.createOrder(userId, cart, { paymentMethod });
			return ApiResponse.success(res, order, "Dat hang thanh cong.");
		} catch (error) {
			return ApiResponse.error(res, error);
		}
	},

	async getOrders(req, res) {
		try {
			const userId = req.user.id;
			const orders = await orderService.getOrdersByUser(userId);
			return ApiResponse.success(res, orders, "Lay danh sach don hang thanh cong.");
		} catch (error) {
			return ApiResponse.error(res, error);
		}
	},

	async getOrderDetail(req, res) {
		try {
			const orderId = Number(req.params.id);
			const userId = req.user.id;

			const order = await orderService.getOrderDetail(orderId, userId);
			if (!order) {
				return ApiResponse.error(res, new Error("Don hang khong ton tai."), 404);
			}

			return ApiResponse.success(res, order, "Lay chi tiet don hang thanh cong.");
		} catch (error) {
			return ApiResponse.error(res, error);
		}
	},

	async updateStatus(req, res) {
		try {
			const order = await orderService.updateStatus(req.params.id, req.body.status);
			return ApiResponse.success(res, order, "Cap nhat trang thai thanh cong");
		} catch (error) {
			return ApiResponse.error(res, error);
		}
	},

	async assignDriver(req, res) {
		try {
			const { orderId } = req.params;
			const { driverId } = req.body;
			const order = await orderService.assignDriver(orderId, driverId);
			return ApiResponse.success(res, order, "Gan tai xe thanh cong");
		} catch (error) {
			return ApiResponse.error(res, error);
		}
	},
};
