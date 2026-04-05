import jwt from "jsonwebtoken";
import prisma from "../configs/prisma.js";
import { config } from "../configs/env.js";

/**
 * Middleware xác thực JWT.
 * Nếu hợp lệ → gán req.user = { id, name, phone, email, role }
 */
export const protectRoute = async (req, res, next) => {
  try {
    let token;
    console.log("ProtectRoute middleware called");

    // 1. Lấy token từ header Authorization: Bearer <token>
    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // 2. Nếu không có header → lấy từ cookie
    if (!token && req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    // 3. Không có token → chưa đăng nhập
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No token provided",
      });
    }

    // 4. Verify token
    const decoded = jwt.verify(token, config.jwtSecret);

    // 5. Tìm user trong DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not found",
      });
    }

    // 6. Gán user vào req
    req.user = user;

    next(); // Cho phép tiếp tục vào controller
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};
