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

      const parseDate = (val) => {
        if (!val) return new Date();
        if (typeof val.toDate === "function") return val.toDate();
        if (val.toDateString) return val;
        if (val._seconds) return new Date(val._seconds * 1000);
        return new Date(val);
      };

      // Calculate total revenue (sum of totalAmount in orders with status DELIVERED)
      const deliveredSnap = await db
        .collection("orders")
        .where("status", "==", "DELIVERED")
        .get();

      let totalRevenue = 0;
      let revenueToday = 0;
      let revenueThisWeek = 0;
      let revenueThisMonth = 0;
      let revenueThisYear = 0;

      const now = new Date();
      const todayStr = now.toDateString();

      // Start of week (Monday)
      const startOfWeek = new Date(now);
      const dayOfWeek = now.getDay();
      const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      startOfWeek.setDate(diffToMonday);
      startOfWeek.setHours(0, 0, 0, 0);

      // Start of month
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Start of year
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      deliveredSnap.docs.forEach((doc) => {
        const orderData = doc.data();
        const amount = orderData.totalAmount || 0;
        const orderDate = parseDate(orderData.createdAt);

        totalRevenue += amount;

        if (orderDate.toDateString() === todayStr) {
          revenueToday += amount;
        }
        if (orderDate >= startOfWeek && orderDate <= now) {
          revenueThisWeek += amount;
        }
        if (orderDate >= startOfMonth && orderDate <= now) {
          revenueThisMonth += amount;
        }
        if (orderDate >= startOfYear && orderDate <= now) {
          revenueThisYear += amount;
        }
      });

      // 1. Get recent 5 orders
      const recentOrdersSnap = await db.collection("orders")
        .orderBy("createdAt", "desc")
        .limit(5)
        .get();

      const recentOrders = [];
      for (const doc of recentOrdersSnap.docs) {
        const orderData = doc.data();
        const orderId = doc.id;

        // Get user name
        let customerName = "Khách hàng";
        if (orderData.userId) {
          const userDoc = await db.collection("users").doc(orderData.userId).get();
          if (userDoc.exists) {
            customerName = userDoc.data().name || userDoc.data().email || "Khách hàng";
          }
        }

        // Get product summary from sub-collection orderItems
        const itemsSnap = await db.collection("orders").doc(orderId).collection("orderItems").get();
        const itemNames = [];
        for (const itemDoc of itemsSnap.docs) {
          const itemData = itemDoc.data();
          if (itemData.productId) {
            const prodDoc = await db.collection("products").doc(itemData.productId).get();
            if (prodDoc.exists) {
              itemNames.push(prodDoc.data().name);
            }
          } else if (itemData.comboId) {
            const comboDoc = await db.collection("combos").doc(itemData.comboId).get();
            if (comboDoc.exists) {
              itemNames.push(comboDoc.data().name);
            }
          }
        }
        const productSummary = itemNames.length > 0 ? itemNames.join(" + ") : "Không có món";

        // Map status to match frontend ("completed", "pending", "processing", etc.)
        let frontendStatus = "pending";
        if (orderData.status === "DELIVERED") {
          frontendStatus = "completed";
        } else if (orderData.status === "DRIVER_ASSIGNED") {
          frontendStatus = "processing";
        } else if (orderData.status === "CANCELLED") {
          frontendStatus = "cancelled";
        }

        recentOrders.push({
          id: `#${orderId.substring(orderId.length - 6).toUpperCase()}`,
          rawId: orderId,
          customer: customerName,
          product: productSummary,
          amount: `${(orderData.totalAmount || 0).toLocaleString("vi-VN")}đ`,
          rawAmount: orderData.totalAmount || 0,
          status: frontendStatus,
          createdAt: orderData.createdAt
        });
      }

      // 2. Fetch latest 3 registered users for activities
      const recentUsersSnap = await db.collection("users")
        .orderBy("createdAt", "desc")
        .limit(3)
        .get();

      const activities = [];

      const toDate = (val) => {
        if (!val) return new Date();
        if (typeof val.toDate === "function") return val.toDate();
        if (val.toDateString) return val;
        if (val._seconds) return new Date(val._seconds * 1000);
        return new Date(val);
      };

      // Add user registration activities
      recentUsersSnap.docs.forEach((doc) => {
        const userData = doc.data();
        const time = toDate(userData.createdAt);
        activities.push({
          type: "user",
          message: `${userData.name || "Người dùng"} mới vừa đăng ký`,
          time,
          rawTime: time.getTime()
        });
      });

      // Add order placement activities
      recentOrders.forEach((order) => {
        const time = toDate(order.createdAt);
        activities.push({
          type: "order",
          message: `Đơn hàng mới ${order.id} vừa được tạo`,
          time,
          rawTime: time.getTime()
        });
      });

      // Sort activities by time descending and take top 5
      activities.sort((a, b) => b.rawTime - a.rawTime);
      const topActivities = activities.slice(0, 5).map(act => {
        const diffMs = new Date().getTime() - act.rawTime;
        const diffMins = Math.max(1, Math.floor(diffMs / 60000));
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        let timeStr = `${diffMins} phút trước`;
        if (diffDays > 0) {
          timeStr = `${diffDays} ngày trước`;
        } else if (diffHours > 0) {
          timeStr = `${diffHours} giờ trước`;
        }

        return {
          type: act.type,
          message: act.message,
          time: timeStr
        };
      });

      const stats = {
        totalUsers,
        totalOrders,
        totalProducts,
        totalRevenue,
        revenueToday,
        revenueThisWeek,
        revenueThisMonth,
        revenueThisYear,
        recentOrders,
        activities: topActivities
      };

      return ApiResponse.success(res, stats, "Dashboard stats retrieved successfully");
    } catch (err) {
      return ApiResponse.error(res, err, 500);
    }
  },
};
