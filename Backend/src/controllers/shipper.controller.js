import * as shipperServiceModule from "../services/shipper.service.js";
import { ApiResponse } from "../configs/apiResponse.js";

const shipperService = shipperServiceModule.shipperService;

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

  getAvailableOrders: async (req, res) => {
    try {
      const orders = await shipperService.getAvailableOrders();
      return ApiResponse.success(res, orders, "Lấy danh sách đơn có thể nhận thành công");
    } catch (error) {
      return ApiResponse.error(res, error);
    }
  },

  acceptOrder: async (req, res) => {
    try {
      const { id } = req.params;
      const driverId = req.user.id;

      const order = await shipperService.acceptOrder(id, driverId);
      return ApiResponse.success(res, order, "Nhận đơn thành công");
    } catch (error) {
      return ApiResponse.error(res, error);
    }
  },

  getMyOrders: async (req, res) => {
    try {
      const driverId = req.user.id;
      const orders = await shipperService.getMyOrders(driverId);
      return ApiResponse.success(res, orders, "Lấy danh sách đơn của tài xế thành công");
    } catch (error) {
      return ApiResponse.error(res, error);
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
