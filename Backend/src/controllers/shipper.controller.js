import { shipperService } from "../services/shipper.service.js";
import { ApiResponse } from "../configs/apiResponse.js";

export const shipperController = {
  login: async (req, res) => {
    try {
      const { phone, password } = req.body;
      const result = await shipperService.login(phone, password);
      return ApiResponse.success(res, result, "Đăng nhập thành công");
    } catch (error) {
      return ApiResponse.error(res, error, 401);
    }
  },

  getAssignedOrders: async (req, res) => {
    try {
      console.log("getAssignedOrders called. User:", req.user);
      const driverId = req.user.id;
      const orders = await shipperService.getAssignedOrders(driverId);
      return ApiResponse.success(res, orders, "Lấy danh sách đơn hàng thành công");
    } catch (error) {
      return ApiResponse.error(res, error);
    }
  },

  updateOrderStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const driverId = req.user.id;

      const updatedOrder = await shipperService.updateOrderStatus(id, driverId, status);
      return ApiResponse.success(res, updatedOrder, "Cập nhật trạng thái thành công");
    } catch (error) {
      return ApiResponse.error(res, error);
    }
  },

  updateLocation: async (req, res) => {
    try {
      const driverId = req.user.id;
      const { latitude, longitude } = req.body;

      if (!latitude || !longitude) {
        return ApiResponse.error(res, { message: "Thiếu tọa độ" }, 400);
      }

      await shipperService.updateLocation(driverId, latitude, longitude);
      return ApiResponse.success(res, null, "Cập nhật vị trí thành công");
    } catch (error) {
      return ApiResponse.error(res, error);
    }
  },
};
