import db from "../configs/firestore.js";
import { ApiResponse } from "../configs/apiResponse.js";

export const dashboardController = {
  async getStats(req, res) {
    try {
      const usersSnap = await db.collection("users").count().get();
      const ordersSnap = await db.collection("orders").count().get();
      const productsSnap = await db.collection("products").count().get();

      const totalUsers = usersSnap.data().count;
      const totalOrders = ordersSnap.data().count;
      const totalProducts = productsSnap.data().count;

      // Calculate total revenue (sum of totalAmount in orders with status DELIVERED)
      const deliveredSnap = await db
        .collection("orders")
        .where("status", "==", "DELIVERED")
        .get();

      let totalRevenue = 0;
      deliveredSnap.docs.forEach((doc) => {
        totalRevenue += doc.data().totalAmount || 0;
      });

      const stats = {
        totalUsers,
        totalOrders,
        totalProducts,
        totalRevenue,
      };

      return ApiResponse.success(res, stats, "Dashboard stats retrieved successfully");
    } catch (err) {
      return ApiResponse.error(res, err, 500);
    }
  },
};
