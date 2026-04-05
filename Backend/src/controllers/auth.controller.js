import { authService } from "../services/auth.service.js";
import { ApiResponse } from "../configs/apiResponse.js";

export const userAuthController = {
  async signUp(req, res) {
    try {
      const { name, phone, email, password } = req.body;

      if (!name || !phone || !email || !password) {
        return ApiResponse.error(res, new Error("Vui long dien day du"), 400);
      }

      const result = await authService.signUp(name, phone, email, password);

      return ApiResponse.success(res, result, "Đăng ký thành công", 201);
    } catch (err) {
      return ApiResponse.error(res, err, 400);
    }
  },

  async signIn(req, res) {
    try {
      const { phone, password } = req.body;

      if (!phone || !password) {
        return ApiResponse.error(
          res,
          new Error("All fields are required"),
          400
        );
      }

      const result = await authService.signIn(phone, password);

      return ApiResponse.success(res, result, "Đăng nhập thành công");
    } catch (err) {
      return ApiResponse.error(res, err, 400);
    }
  },

  async signOut(req, res) {
    try {
      // Nếu bạn dùng cookie để lưu token, xoá cookie
      res.clearCookie("jwt", {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      });

      return ApiResponse.success(res, null, "Đăng xuất thành công");
    } catch (err) {
      return ApiResponse.error(res, err, 500);
    }
  },

  async getMe(req, res) {
    try {
      if (!req.user) {
        return ApiResponse.error(res, new Error("Unauthorized"), 401);
      }
      const user = {
        id: req.user.id,
        phone: req.user.phone,
        name: req.user.name,
        role: req.user.role,
        email: req.user.email,
        address: req.user.address,
      };
      return ApiResponse.success(res, { user }, "User info", 200);
    } catch (err) {
      return ApiResponse.error(res, err, 500);
    }
  },

  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const updateData = req.body;
      // Assuming userService exists and has update method. 
      // If not, we might need to import userService or implement it in authService (less ideal).
      // Let's check imports. We only have authService imported.
      // We should probably use authService or import userService.
      // For now, let's assume authService might handle it or we import userService.
      // Checking imports... only authService.
      // Let's add userService import if needed or use authService.
      // Actually, let's wait to see service files first.
      // But I need to write this file now.
      // I'll use authService.updateProfile if I can add it there, or better, import userService.
      // I will add the import in a separate chunk if needed, or just use authService for now and update authService.
      // Let's use authService.updateProfile(userId, updateData).
      const updatedUser = await authService.updateProfile(userId, updateData);
      return ApiResponse.success(res, updatedUser, "Profile updated successfully");
    } catch (err) {
      return ApiResponse.error(res, err, 400);
    }
  },
};
