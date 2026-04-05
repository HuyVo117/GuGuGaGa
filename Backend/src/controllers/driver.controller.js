import { ApiResponse } from "../configs/apiResponse.js";
import { driverService } from "../services/driver.service.js";

export const driverController = {
	async getAll(req, res) {
		try {
			const drivers = await driverService.getAll();
			return ApiResponse.success(res, drivers, "Lay danh sach tai xe thanh cong");
		} catch (error) {
			return ApiResponse.error(res, error, 400);
		}
	},
};
