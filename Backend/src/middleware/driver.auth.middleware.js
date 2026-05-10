import jwt from "jsonwebtoken";
import db from "../configs/firestore.js";
import { config } from "../configs/env.js";

/**
 * Middleware xác thực JWT cho Driver.
 * Nếu hợp lệ -> gán req.user = driver
 */
export const protectDriverRoute = async (req, res, next) => {
  try {
    let token;

    // 1. Lấy token từ header Authorization: Bearer <token>
    console.log("Headers:", req.headers);
    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // 2. Nếu không có header -> lấy từ cookie
    if (!token && req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    // 3. Không có token -> chưa đăng nhập
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No token provided",
      });
    }

    // 4. Verify token
    const decoded = jwt.verify(token, config.jwtSecret);

    // 5. Tìm driver trong DB (Firestore)
    // Token shipper có payload { id: driver.id, role: "DRIVER" }
    const driverId = String(decoded.id);
    const driverDoc = await db.collection("drivers").doc(driverId).get();

    if (!driverDoc.exists) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Driver not found",
      });
    }

    // 6. Gán user vào req (để thống nhất với controller dùng req.user)
    req.user = { id: driverDoc.id, ...driverDoc.data() };

    next(); // Cho phép tiếp tục vào controller
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};
