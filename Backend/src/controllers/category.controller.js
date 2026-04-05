import { ApiResponse } from "../configs/apiResponse.js";
import { categoryService } from "../services/category.service.js";

export const categoryController = {
	async getAll(req, res) {
		try {
			const categories = await categoryService.getAll();
			return ApiResponse.success(res, categories, "Lay danh sach category thanh cong");
		} catch (error) {
			return ApiResponse.error(res, error, 400);
		}
	},
};
