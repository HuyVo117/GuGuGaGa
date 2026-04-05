import { authService } from "../services/auth.service.js";
import { ApiResponse } from "../configs/apiResponse.js";

export const adminAuthController = {
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

      if (result.user.role !== "ADMIN") {
        console.log("From AdminAuthController", result.user);
        return ApiResponse.error(
          res,
          new Error("Bạn không có quyền truy cập"),
          403
        );
      }
      // console.log("From AdminAuthController", result.user);
      // console.log("Setting cookie for admin user", result.token);
      res.cookie("jwt", result.token, {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
        httpOnly: true, // Không cho frontend JS đọc (ngăn XSS)
        sameSite: "strict", // Chỉ gửi cookie cùng domain, chống CSRF cơ bản
        secure: process.env.NODE_ENV === "production", // Chỉ gửi cookie qua HTTPS trong production
      });
      // console.log(result.data);
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
      // Kiểm tra user được gán từ protectRoute
      if (!req.user) {
        console.log("No user found in request");
        return ApiResponse.error(res, new Error("Unauthorized"), 401);
      }

      // Trả thông tin user
      const user = {
        id: req.user.id,
        phone: req.user.phone,
        name: req.user.name,
        role: req.user.role,
      };
      return ApiResponse.success(res, { user }, "User info", 200);
    } catch (err) {
      console.error("Error in getMe:", err);
      return ApiResponse.error(res, err, 500);
    }
  },
};
