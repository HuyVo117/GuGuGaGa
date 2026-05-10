import db from "../configs/firestore.js";

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
      .orderBy("createdAt", "desc")
      .get();
    const orders = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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

    const updatedDoc = await orderRef.get();
    const order = { id: updatedDoc.id, ...updatedDoc.data() };
    await populateOrder(order);
    return order;
  },
};
