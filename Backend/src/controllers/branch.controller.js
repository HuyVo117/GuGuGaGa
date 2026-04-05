import { ApiResponse } from "../configs/apiResponse.js";
import { branchService } from "../services/branch.service.js";

export const branchController = {
	async getAll(req, res) {
		try {
			const branches = await branchService.getAll();
			return ApiResponse.success(res, branches, "Lay danh sach chi nhanh thanh cong");
		} catch (error) {
			return ApiResponse.error(res, error, 400);
		}
	},
};
