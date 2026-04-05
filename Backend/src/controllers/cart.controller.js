import { ApiResponse } from "../configs/apiResponse.js";
import { cartService } from "../services/cart.service.js";

export const cartController = {
	async getCart(req, res) {
		try {
			const cart = await cartService.getOrCreateCart(req.user.id);
			return ApiResponse.success(res, cart, "Lay gio hang thanh cong");
		} catch (error) {
			return ApiResponse.error(res, error, 400);
		}
	},

	async addItem(req, res) {
		try {
			const { productId, quantity = 1 } = req.body || {};
			if (!productId) {
				return ApiResponse.error(res, new Error("productId is required"), 400);
			}

			const item = await cartService.addItem(req.user.id, productId, quantity);
			return ApiResponse.success(res, item, "Them san pham vao gio hang thanh cong", 201);
		} catch (error) {
			return ApiResponse.error(res, error, 400);
		}
	},

	async updateItem(req, res) {
		try {
			const { quantity } = req.body || {};
			if (!quantity || Number(quantity) < 1) {
				return ApiResponse.error(res, new Error("quantity must be >= 1"), 400);
			}

			const item = await cartService.updateItemQuantity(req.user.id, req.params.itemId, quantity);
			return ApiResponse.success(res, item, "Cap nhat so luong thanh cong");
		} catch (error) {
			return ApiResponse.error(res, error, 400);
		}
	},

	async removeItem(req, res) {
		try {
			const result = await cartService.removeItem(req.user.id, req.params.itemId);
			return ApiResponse.success(res, result, "Xoa san pham khoi gio hang thanh cong");
		} catch (error) {
			return ApiResponse.error(res, error, 400);
		}
	},
};
