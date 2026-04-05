import { userService } from "../services/user.service.js";
import { ApiResponse } from "../configs/apiResponse.js";
import bcrypt from "bcryptjs";
export const userController = {
  async getAll(req, res) {
    try {
      const currentUserId = req.user.id;
      const users = await userService.getAllUsers(currentUserId);
      return ApiResponse.success(res, users, "Lấy danh sách user thành công");
    } catch (error) {
      return ApiResponse.error(res, error);
    }
  },

  async getById(req, res) {
    try {
      const user = await userService.getUserById(req.params.id);
      if (!user) throw new Error("User không tồn tại");
      return ApiResponse.success(res, user, "Lấy user thành công");
    } catch (error) {
      return ApiResponse.error(res, error, 404);
    }
  },

  async create(req, res) {
    try {
      let { password, branchId, ...rest } = req.body;

      // Bắt buộc phải có password khi tạo user
      if (!password) {
        return ApiResponse.error(res, "Password is required", 400);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      const data = {
        ...rest,
        passwordHash: hashedPassword,
      };

      // Format branchId
      // Nếu branchId rỗng, null, undefined → KHÔNG thêm vào data
      if (branchId && branchId !== "" && rest.role !== "ADMIN") {
        data.branch = {
          connect: { id: Number(branchId) },
        };
      }

      const newUser = await userService.createUser(data);

      return ApiResponse.success(res, newUser, "Tạo user thành công", 201);
    } catch (error) {
      console.error("Error creating user:", error);
      return ApiResponse.error(res, error.message || "Lỗi hệ thống", 400);
    }
  },
  async delete(req, res) {
    try {
      await userService.deleteUser(req.params.id);
      return ApiResponse.success(res, null, "Xóa user thành công");
    } catch (error) {
      return ApiResponse.error(res, error, 404);
    }
  },

  update: async (req, res) => {
    try {
      const updatedUser = await userService.updateUser(req.params.id, req.body);
      return ApiResponse.success(res, updatedUser, "Cập nhật user thành công");
    } catch (error) {
      console.error("[updateUser]", error);
      return ApiResponse.error(res, error, 400);
    }
  },
};
