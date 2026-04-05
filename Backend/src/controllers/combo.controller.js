import { comboService } from "../services/combo.service.js";
import { ApiResponse } from "../configs/apiResponse.js";

export const comboController = {
  async getAll(req, res) {
    try {
      const { categoryId } = req.query;
      const combos = await comboService.getAll(categoryId);
      return ApiResponse.success(res, combos, "Get all combos successfully");
    } catch (err) {
      return ApiResponse.error(res, err, 400);
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const combo = await comboService.getById(id);
      if (!combo) {
        return ApiResponse.error(res, new Error("Combo not found"), 404);
      }
      return ApiResponse.success(res, combo, "Get combo successfully");
    } catch (err) {
      return ApiResponse.error(res, err, 400);
    }
  },
  async create(req, res) {
    try {
      const comboData = req.body;
      const newCombo = await comboService.create(comboData);
      return ApiResponse.success(
        res,
        newCombo,
        "Combo created successfully",
        201
      );
    } catch (err) {
      return ApiResponse.error(res, err, 400);
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const comboData = req.body;
      const updatedCombo = await comboService.update(id, comboData);
      return ApiResponse.success(
        res,
        updatedCombo,
        "Combo updated successfully"
      );
    } catch (err) {
      return ApiResponse.error(res, err, 400);
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await comboService.delete(id);
      return ApiResponse.success(res, result, "Combo deleted successfully");
    } catch (err) {
      return ApiResponse.error(res, err, 400);
    }
  },
};
