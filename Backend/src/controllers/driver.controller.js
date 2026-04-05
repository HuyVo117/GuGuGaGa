import { driverService } from "../services/driver.service.js";
import { ApiResponse } from "../configs/apiResponse.js";

export const driverController = {
  async getAll(req, res) {
    try {
      const data = await driverService.getAll();
      return ApiResponse.success(res, data, "Lấy danh sách tài xế thành công");
    } catch (err) {
      return ApiResponse.error(res, err);
    }
  },

  async getById(req, res) {
    try {
      const data = await driverService.getById(req.params.id);
      return ApiResponse.success(res, data, "Lấy tài xế thành công");
    } catch (err) {
      return ApiResponse.error(res, err);
    }
  },

  async create(req, res) {
    try {
      const data = await driverService.create(req.body);
      return ApiResponse.success(res, data, "Tạo tài xế thành công", 201);
    } catch (err) {
      return ApiResponse.error(res, err);
    }
  },

  async update(req, res) {
    try {
      const data = await driverService.update(req.params.id, req.body);
      return ApiResponse.success(res, data, "Cập nhật tài xế thành công");
    } catch (err) {
      return ApiResponse.error(res, err);
    }
  },

  async remove(req, res) {
    try {
      const data = await driverService.remove(req.params.id);
      return ApiResponse.success(res, data, "Xóa tài xế thành công");
    } catch (err) {
      return ApiResponse.error(res, err);
    }
  },
};
