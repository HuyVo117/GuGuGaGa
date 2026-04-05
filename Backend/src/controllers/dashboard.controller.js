import prisma from "../configs/prisma.js";
import { ApiResponse } from "../configs/apiResponse.js";

export const dashboardController = {
  async getStats(req, res) {
    try {
      const totalUsers = await prisma.user.count();
      const totalOrders = await prisma.order.count();
      const totalProducts = await prisma.product.count();
      
      // Calculate total revenue (sum of totalAmount in orders with status DELIVERED)
      const revenueResult = await prisma.order.aggregate({
        _sum: {
          totalAmount: true,
        },
        where: {
          status: "DELIVERED",
        },
      });
      const totalRevenue = revenueResult._sum.totalAmount || 0;

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
