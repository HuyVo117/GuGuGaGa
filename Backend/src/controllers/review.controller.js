import { reviewService } from "../services/review.service.js";
import { ApiResponse } from "../configs/apiResponse.js";

export const reviewController = {
  createOrderReview: async (req, res) => {
    try {
      const userId = req.user.id;
      const orderId = req.params.id;
      const { driverRating, driverComment, productRatings } = req.body;

      if (!orderId) {
        return ApiResponse.error(res, new Error("Thiếu mã đơn hàng."), 400);
      }

      if (!Array.isArray(productRatings) || productRatings.length === 0) {
        return ApiResponse.error(res, new Error("Cần ít nhất một đánh giá sản phẩm."), 400);
      }

      const review = await reviewService.createReview(userId, orderId, {
        driverRating,
        driverComment,
        productRatings,
      });

      return ApiResponse.success(res, review, "Gửi đánh giá thành công.");
    } catch (error) {
      console.error("[createOrderReview Error]:", error);
      return ApiResponse.error(res, error);
    }
  },

  getProductReviews: async (req, res) => {
    try {
      const productId = req.params.id;
      if (!productId) {
        return ApiResponse.error(res, new Error("Thiếu mã sản phẩm."), 400);
      }

      const reviews = await reviewService.getProductReviews(productId);
      return ApiResponse.success(res, reviews, "Lấy danh sách đánh giá sản phẩm thành công.");
    } catch (error) {
      console.error("[getProductReviews Error]:", error);
      return ApiResponse.error(res, error);
    }
  },

  getDriverReviews: async (req, res) => {
    try {
      const driverId = req.params.id;
      if (!driverId) {
        return ApiResponse.error(res, new Error("Thiếu mã tài xế."), 400);
      }

      const reviews = await reviewService.getDriverReviews(driverId);
      return ApiResponse.success(res, reviews, "Lấy danh sách đánh giá tài xế thành công.");
    } catch (error) {
      console.error("[getDriverReviews Error]:", error);
      return ApiResponse.error(res, error);
    }
  },
};
