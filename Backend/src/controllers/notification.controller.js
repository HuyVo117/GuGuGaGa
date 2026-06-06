import { notificationService } from "../services/notification.service.js";
import { ApiResponse } from "../configs/apiResponse.js";

export const notificationController = {
  getNotifications: async (req, res) => {
    try {
      const userId = req.user.id;
      const notifications = await notificationService.getNotificationsByUser(userId);
      return ApiResponse.success(res, notifications, "Lấy danh sách thông báo thành công.");
    } catch (error) {
      console.error("[getNotifications]", error);
      return ApiResponse.error(res, error);
    }
  },

  markAsRead: async (req, res) => {
    try {
      const { id } = req.params;
      const notification = await notificationService.markAsRead(id);
      return ApiResponse.success(res, notification, "Đã đọc thông báo.");
    } catch (error) {
      console.error("[markAsRead]", error);
      return ApiResponse.error(res, error);
    }
  },

  markAllAsRead: async (req, res) => {
    try {
      const userId = req.user.id;
      await notificationService.markAllAsRead(userId);
      return ApiResponse.success(res, null, "Đã đọc tất cả thông báo.");
    } catch (error) {
      console.error("[markAllAsRead]", error);
      return ApiResponse.error(res, error);
    }
  },
};
