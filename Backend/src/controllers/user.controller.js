import { ApiResponse } from "../configs/apiResponse.js";
import { userService } from "../services/user.service.js";

export const userController = {
	async getAll(req, res) {
		try {
			const users = await userService.getAll();
			return ApiResponse.success(res, users, "Lay danh sach user thanh cong");
		} catch (error) {
			return ApiResponse.error(res, error, 400);
		}
	},
};
