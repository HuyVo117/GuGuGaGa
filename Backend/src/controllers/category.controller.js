import { ApiResponse } from "../configs/apiResponse.js";
import { categoryService } from "../services/category.service.js";

export const categoryController = {
  async getAllCategories(req, res) {
    try {
      const categories = await categoryService.getAllCategories();
      console.log(categories);
      return ApiResponse.success(
        res,
        categories,
        "Lay danh sach category thanh cong!"
      );
    } catch (error) {
      return ApiResponse.error(res, error);
    }
  },
  async createCategory(req, res) {
    try {
      const { name } = req.body;
      const newCategory = await categoryService.createCategory(name);
      return ApiResponse.success(
        res,
        newCategory,
        "Tạo category thành công",
        201
      );
    } catch (error) {
      return ApiResponse.error(res, error, 400);
    }
  },
  async updateCategory(req, res) {
    try {
      const { name } = req.body;
      const updatedCategory = await categoryService.updateCategory(
        req.params.id,
        name
      );
      return ApiResponse.success(
        res,
        updatedCategory,
        "Cập nhật category thành công"
      );
    } catch (error) {
      return ApiResponse.error(res, error, 400);
    }
  },
  async deleteCategory(req, res) {
    try {
      await categoryService.deleteCategory(req.params.id);
      return ApiResponse.success(res, null, "Xóa category thành công");
    } catch (error) {
      return ApiResponse.error(res, error, 404);
    }
  },
};
