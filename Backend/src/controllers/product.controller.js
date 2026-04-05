import { productService } from "../services/product.service.js";
import { ApiResponse } from "../configs/apiResponse.js";

export const productController = {
  async getAll(req, res) {
    try {
      const { categoryId } = req.query;
      const products = await productService.getAll(categoryId);
      return ApiResponse.success(
        res,
        products,
        "Get all products successfully"
      );
    } catch (err) {
      return ApiResponse.error(res, err, 400);
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const product = await productService.getById(id);
      return ApiResponse.success(res, product, "Get product successfully");
    } catch (err) {
      return ApiResponse.error(res, err, 404);
    }
  },

  async create(req, res) {
    try {
      const productData = req.body;
      const newProduct = await productService.create(productData);
      return ApiResponse.success(
        res,
        newProduct,
        "Product created successfully",
        201
      );
    } catch (err) {
      return ApiResponse.error(res, err, 400);
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const productData = req.body;
      const updatedProduct = await productService.update(id, productData);
      return ApiResponse.success(
        res,
        updatedProduct,
        "Product updated successfully"
      );
    } catch (err) {
      return ApiResponse.error(res, err, 400);
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await productService.delete(id);
      return ApiResponse.success(res, result, "Product deleted successfully");
    } catch (err) {
      return ApiResponse.error(res, err, 400);
    }
  },
};
