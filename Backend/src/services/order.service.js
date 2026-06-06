import db from "../configs/firestore.js";
import { notificationService } from "./notification.service.js";
import axios from "axios";

const ordersRef = db.collection("orders");
const driversRef = db.collection("drivers");
const usersRef = db.collection("users");
const branchesRef = db.collection("branches");
const productsRef = db.collection("products");
const combosRef = db.collection("combos");
const categoriesRef = db.collection("categories");
const cartsRef = db.collection("carts");

// Helper: populate full order with relations
async function populateOrder(order) {
  // Populate user
  if (order.userId) {
    const userDoc = await usersRef.doc(order.userId).get();
    order.user = userDoc.exists ? { id: userDoc.id, ...userDoc.data() } : null;
  }
  // Populate branch
  if (order.branchId) {
    const branchDoc = await branchesRef.doc(order.branchId).get();
    order.branch = branchDoc.exists ? { id: branchDoc.id, ...branchDoc.data() } : null;
  }
  // Populate driver
  if (order.driverId) {
    const driverDoc = await driversRef.doc(order.driverId).get();
    order.driver = driverDoc.exists ? { id: driverDoc.id, ...driverDoc.data() } : null;
  } else {
    order.driver = null;
  }
  // Populate orderItems sub-collection
  const itemsSnap = await ordersRef.doc(order.id).collection("orderItems").get();
  order.orderItem = [];
  for (const itemDoc of itemsSnap.docs) {
    const item = { id: itemDoc.id, ...itemDoc.data() };
    // Populate product
    if (item.productId) {
      const prodDoc = await productsRef.doc(item.productId).get();
      if (prodDoc.exists) {
        item.product = { id: prodDoc.id, ...prodDoc.data() };
        if (item.product.categoryId) {
          const catDoc = await categoriesRef.doc(item.product.categoryId).get();
          item.product.category = catDoc.exists ? { id: catDoc.id, ...catDoc.data() } : null;
        }
      } else {
        item.product = null;
      }
    } else {
      item.product = null;
    }
    // Populate combo
    if (item.comboId) {
      const comboDoc = await combosRef.doc(item.comboId).get();
      item.combo = comboDoc.exists ? { id: comboDoc.id, ...comboDoc.data() } : null;
    } else {
      item.combo = null;
    }
    order.orderItem.push(item);
  }
  return order;
}

export const orderService = {
  // Lấy tất cả đơn hàng (ADMIN)
  async getAll() {
    const snap = await ordersRef.orderBy("createdAt", "desc").get();
    const orders = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    await Promise.all(orders.map(populateOrder));
    return orders;
  },

  createOrder: async (userId, cart, body) => {
    const { paymentMethod, deliveryAddress, deliveryPhone, latitude, longitude } = body;

    // Convert cart items -> order items
    const items = cart.cartItem.map((item) => ({
      productId: item.productId || null,
      comboId: item.comboId || null,
      quantity: item.quantity,
      price: item.price,
    }));

    const totalAmount = cart.totalAmount;
    const now = new Date();

    // Tạo order
    const orderRef = await ordersRef.add({
      userId,
      branchId: cart.branchId,
      totalAmount,
      status: "ACCEPTED",
      paymentMethod,
      deliveryAddress,
      deliveryPhone,
      latitude: latitude || null,
      longitude: longitude || null,
      driverId: null,
      createdAt: now,
      updatedAt: now,
    });

    // Create orderItems sub-collection
    const createdItems = [];
    for (const item of items) {
      const itemRef = await orderRef.collection("orderItems").add(item);
      createdItems.push({ id: itemRef.id, ...item });
    }

    // Xóa cart items sub-collection + cart doc
    const cartDocRef = cartsRef.doc(cart.id);
    const cartItemsSnap = await cartDocRef.collection("cartItems").get();
    const batch = db.batch();
    cartItemsSnap.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(cartDocRef);
    await batch.commit();

    // Tạo thông báo
    try {
      await notificationService.createNotification(
        userId,
        "Đặt hàng thành công",
        `Đơn hàng #${orderRef.id.substring(orderRef.id.length - 6)} của bạn đã được đặt thành công. Cửa hàng đang chuẩn bị món ăn!`,
        orderRef.id
      );
    } catch (err) {
      console.error("[createOrder Notification Error]", err);
    }

    return {
      id: orderRef.id,
      userId,
      branchId: cart.branchId,
      totalAmount,
      status: "ACCEPTED",
      paymentMethod,
      deliveryAddress,
      deliveryPhone,
      latitude,
      longitude,
      createdAt: now,
      updatedAt: now,
      orderItem: createdItems,
    };
  },

  getOrdersByUser: async (userId) => {
    const snap = await ordersRef
      .where("userId", "==", userId)
      .get();
    const orders = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    orders.sort((a, b) => {
      const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.createdAt?._seconds ?? 0) * 1000;
      const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.createdAt?._seconds ?? 0) * 1000;
      return timeB - timeA;
    });
    await Promise.all(orders.map(populateOrder));
    return orders;
  },

  getOrderDetail: async (orderId, userId) => {
    const doc = await ordersRef.doc(orderId).get();
    if (!doc.exists) return null;
    const order = { id: doc.id, ...doc.data() };
    if (order.userId !== userId) return null;
    await populateOrder(order);
    return order;
  },

  getAdminOrderDetail: async (orderId) => {
    const doc = await ordersRef.doc(orderId).get();
    if (!doc.exists) return null;
    const order = { id: doc.id, ...doc.data() };
    await populateOrder(order);
    return order;
  },

  // Cập nhật trạng thái đơn hàng
  async updateStatus(orderId, status) {
    const validStatuses = [
      "PENDING",
      "ACCEPTED",
      "DRIVER_ASSIGNED",
      "DELIVERED",
      "CANCELLED",
    ];
    if (!validStatuses.includes(status)) {
      throw new Error(
        `Status không hợp lệ. Chỉ chấp nhận: ${validStatuses.join(", ")}`
      );
    }

    const orderRef = ordersRef.doc(orderId);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) throw new Error("Order not found");
    const currentOrder = orderDoc.data();

    // Nếu đơn hàng hoàn thành -> set driver về AVAILABLE
    if (status === "DELIVERED" && currentOrder.driverId) {
      await driversRef.doc(currentOrder.driverId).update({ status: "AVAILABLE" });
    }

    await orderRef.update({ status, updatedAt: new Date() });

    // Tạo thông báo
    try {
      let title = "";
      let message = "";
      const orderShortId = orderId.substring(orderId.length - 6);
      if (status === "ACCEPTED") {
        title = "Đơn hàng đã được xác nhận";
        message = `Đơn hàng #${orderShortId} của bạn đã được xác nhận.`;
      } else if (status === "DRIVER_ASSIGNED") {
        title = "Tài xế đã nhận đơn";
        message = `Tài xế đang giao đơn hàng #${orderShortId} cho bạn.`;
      } else if (status === "DELIVERED") {
        title = "Giao hàng thành công";
        message = `Đơn hàng #${orderShortId} đã được giao thành công. Chúc bạn ngon miệng!`;
      } else if (status === "CANCELLED") {
        title = "Đơn hàng đã bị hủy";
        message = `Đơn hàng #${orderShortId} đã bị hủy.`;
      }

      if (title && currentOrder.userId) {
        await notificationService.createNotification(
          currentOrder.userId,
          title,
          message,
          orderId
        );
      }
    } catch (err) {
      console.error("[updateStatus Notification Error]", err);
    }

    const updatedDoc = await orderRef.get();
    const order = { id: updatedDoc.id, ...updatedDoc.data() };
    await populateOrder(order);
    return order;
  },

  // ADMIN gán tài xế
  async assignDriver(orderId, driverId) {
    const driverDoc = await driversRef.doc(driverId).get();
    if (!driverDoc.exists) {
      throw new Error("Driver không tồn tại");
    }

    // Cập nhật trạng thái driver -> ON_DELIVERY
    await driversRef.doc(driverId).update({ status: "ON_DELIVERY" });

    // Cập nhật order -> gán driver + status DRIVER_ASSIGNED
    const orderRef = ordersRef.doc(orderId);
    await orderRef.update({
      driverId,
      status: "DRIVER_ASSIGNED",
      updatedAt: new Date(),
    });

    // Tạo thông báo
    try {
      const orderDoc = await orderRef.get();
      const currentOrder = orderDoc.data();
      const orderShortId = orderId.substring(orderId.length - 6);
      if (currentOrder && currentOrder.userId) {
        await notificationService.createNotification(
          currentOrder.userId,
          "Tài xế đã nhận đơn",
          `Tài xế đang giao đơn hàng #${orderShortId} cho bạn.`,
          orderId
        );
      }
    } catch (err) {
      console.error("[assignDriver Notification Error]", err);
    }

    const updatedDoc = await orderRef.get();
    const order = { id: updatedDoc.id, ...updatedDoc.data() };
    await populateOrder(order);
    return order;
  },

  async checkPayment(orderId, force = false) {
    const orderRef = ordersRef.doc(orderId);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) {
      throw new Error("Đơn hàng không tồn tại");
    }

    const orderData = orderDoc.data();
    
    // Nếu đơn hàng đã được thanh toán
    if (orderData.paymentStatus === "PAID") {
      return { paid: true };
    }

    const cassoApiKey = process.env.CASSO_API_KEY;

    // Nếu forced (người dùng bấm nút) hoặc chưa cấu hình API Key đối soát -> Tự động duyệt thành công
    if (force || !cassoApiKey) {
      await orderRef.update({
        paymentStatus: "PAID",
        updatedAt: new Date(),
      });

      const shortOrderId = orderId.length > 8
          ? orderId.substring(orderId.length - 8)
          : orderId;

      try {
        await notificationService.createNotification(
          orderData.userId,
          "Thanh toán thành công",
          `Đơn hàng #${shortOrderId} đã được xác nhận thanh toán thành công. Cửa hàng đang chuẩn bị món ăn!`,
          orderId
        );
      } catch (err) {
        console.error("[checkPayment Notification Error]", err);
      }

      return { paid: true };
    }

    const shortOrderId = orderId.length > 8
        ? orderId.substring(orderId.length - 8)
        : orderId;
    const addInfo = `GUGUGAGA_${shortOrderId}`.toUpperCase();
    const expectedAmount = orderData.totalAmount;

    try {
      // Gọi API Casso lấy lịch sử giao dịch gần đây
      const response = await axios.get("https://api.casso.vn/v2/transactions", {
        headers: {
          Authorization: `Apikey ${cassoApiKey}`,
          "Content-Type": "application/json",
        },
        params: {
          limit: 20,
          sort: "desc",
        }
      });

      if (response.data && response.data.success && response.data.data && response.data.data.records) {
        const transactions = response.data.data.records;
        
        console.log(`[Casso Check] Đang đối soát đơn hàng #${shortOrderId} (mã cần tìm: ${addInfo}, số tiền cần: ${expectedAmount}đ)`);
        console.log(`[Casso Check] Đã tải về ${transactions.length} giao dịch gần nhất từ Casso.`);
        
        // Tìm giao dịch khớp mô tả và số tiền
        const match = transactions.find(tx => {
          const description = (tx.description || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
          const normalizedAddInfo = addInfo.replace(/[^A-Z0-9]/g, "");
          const amount = tx.amount;
          const isMatch = description.includes(normalizedAddInfo) && amount >= expectedAmount;
          
          console.log(`   -> Giao dịch: "${tx.description}" | Số tiền: ${amount}đ | Kết quả khớp: ${isMatch ? "CÓ" : "KHÔNG"}`);
          return isMatch;
        });

        if (match) {
          // Cập nhật trạng thái trong DB
          await orderRef.update({
            paymentStatus: "PAID",
            updatedAt: new Date(),
          });

          // Gửi thông báo chuyển khoản thành công
          try {
            await notificationService.createNotification(
              orderData.userId,
              "Thanh toán thành công",
              `Đã nhận được tiền chuyển khoản ${expectedAmount.toLocaleString('vi-VN')}₫ cho đơn hàng #${shortOrderId}. Cửa hàng đang chuẩn bị món ăn!`,
              orderId
            );
          } catch (err) {
            console.error("[checkPayment Notification Error]", err);
          }

          return { paid: true };
        }
      }
    } catch (error) {
      console.error("[Casso Payment Check Error]:", error.response?.data || error.message);
    }

    return { paid: false };
  },

  async handleCassoWebhook(payload) {
    if (!payload || !payload.data || !Array.isArray(payload.data)) {
      return { success: false, message: "Invalid webhook payload format." };
    }

    const records = payload.data;
    const results = [];

    for (const record of records) {
      const description = (record.description || "").toUpperCase();
      const amount = record.amount;

      console.log(`[Casso Webhook] Đang xử lý giao dịch nhận từ Webhook: "${description}" | Số tiền: ${amount}đ`);

      // Chuẩn hóa mô tả để tìm kiếm linh hoạt (bỏ dấu cách, dấu gạch dưới, gạch ngang)
      const normalizedDesc = description.replace(/[^A-Z0-9]/g, "");
      const match = normalizedDesc.match(/GUGUGAGA([A-Z0-9]{8})/);
      
      if (match && match[1]) {
        const shortOrderId = match[1];
        console.log(`   -> Phát hiện mã đơn hàng trích xuất: #${shortOrderId}`);
        
        // Tìm đơn hàng trong Firestore kết thúc bằng shortOrderId
        const snap = await ordersRef.orderBy("createdAt", "desc").limit(50).get();
        let matchedOrderDoc = null;
        
        for (const doc of snap.docs) {
          const id = doc.id;
          const shortId = id.length > 8 ? id.substring(id.length - 8).toUpperCase() : id.toUpperCase();
          if (shortId === shortOrderId) {
            matchedOrderDoc = doc;
            break;
          }
        }

        if (matchedOrderDoc) {
          const orderRef = ordersRef.doc(matchedOrderDoc.id);
          const orderData = matchedOrderDoc.data();

          if (orderData.paymentStatus !== "PAID" && amount >= orderData.totalAmount) {
            await orderRef.update({
              paymentStatus: "PAID",
              updatedAt: new Date(),
            });

            // Send notification
            try {
              await notificationService.createNotification(
                orderData.userId,
                "Thanh toán thành công",
                `Đã nhận được tiền chuyển khoản ${amount.toLocaleString('vi-VN')}₫ cho đơn hàng #${shortOrderId} (nhận qua Webhook). Cửa hàng đang chuẩn bị món ăn!`,
                matchedOrderDoc.id
              );
            } catch (err) {
              console.error("[Webhook Notification Error]", err);
            }

            results.push({ orderId: matchedOrderDoc.id, status: "UPDATED_TO_PAID" });
          } else {
            results.push({ orderId: matchedOrderDoc.id, status: "ALREADY_PAID_OR_INSUFFICIENT" });
          }
        } else {
          results.push({ shortOrderId, status: "ORDER_NOT_FOUND" });
        }
      } else {
        results.push({ description, status: "NO_MATCHING_DESCRIPTION" });
      }
    }

    return { success: true, results };
  },
};
