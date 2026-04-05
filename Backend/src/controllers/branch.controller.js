import { branchService } from "../services/branch.service.js";
import { ApiResponse } from "../configs/apiResponse.js";

export const branchController = {
  async getAll(req, res) {
    try {
      const branches = await branchService.getAll();
      return ApiResponse.success(res, branches, "Get all branches successfully");
    } catch (err) {
      return ApiResponse.error(res, err, 400);
    }
  },

  async create(req, res) {
    try {
      const { name, phone, address, latitude, longitude } = req.body;
      const branch = await branchService.create({
        name,
        phone,
        address,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      });
      return ApiResponse.success(res, branch, "Create branch successfully");
    } catch (err) {
      return ApiResponse.error(res, err, 400);
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, phone, address, latitude, longitude } = req.body;
      const branch = await branchService.update(id, {
        name,
        phone,
        address,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      });
      return ApiResponse.success(res, branch, "Update branch successfully");
    } catch (err) {
      return ApiResponse.error(res, err, 400);
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      await branchService.delete(id);
      return ApiResponse.success(res, null, "Delete branch successfully");
    } catch (err) {
      return ApiResponse.error(res, err, 400);
    }
  },
};
