import prisma from "../configs/prisma.js";


export const orderService = {
  // Lấy tất cả đơn hàng (ADMIN)
  async getAll() {
    return await prisma.order.findMany({
      include: {
        orderItem: {
          include: {
            product: { include: { category: true } },
            combo: true,
          },
        },
        user: true,
        branch: true,
        driver: true, // nếu muốn show luôn tài xế
      },
      orderBy: { createdAt: "desc" },
    });
  },
  createOrder: async (userId, cart, body) => {
    const { paymentMethod, deliveryAddress, deliveryPhone, latitude, longitude } = body;

    // Convert cart items -> order items
    const items = cart.cartItem.map((item) => ({
      productId: item.productId,
      comboId: item.comboId,
      quantity: item.quantity,
      price: item.price, // lấy giá từ CartItem
    }));

    // Tính tổng tiền từ cart luôn, không cần map lại
    const totalAmount = cart.totalAmount;

    // Tạo order
    const order = await prisma.order.create({
      data: {
        userId,
        branchId: cart.branchId,
        totalAmount,
        paymentMethod,
        deliveryAddress,
        deliveryPhone,
        latitude,
        longitude,
        orderItem: {
          create: items,
        },
      },
      include: {
        orderItem: true,
      },
    });

    // Xóa cart sau khi tạo order
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    await prisma.cart.delete({
      where: { id: cart.id },
    });

    return order;
  },

  getOrdersByUser: async (userId) => {
    return await prisma.order.findMany({
      where: { userId },
      include: {
        orderItem: {
          include: {
            product: { include: { category: true } },
            combo: true,
          },
        },
        branch: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  getOrderDetail: async (orderId, userId) => {
    return await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        orderItem: {
          include: {
            product: { include: { category: true } },
            combo: true,
          },
        },
        branch: true,
      },
    });
  },

  getAdminOrderDetail: async (orderId) => {
    return await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItem: {
          include: {
            product: { include: { category: true } },
            combo: true,
          },
        },
        branch: true,
        user: true,
        driver: true,
      },
    });
  },

  // Cập nhật trạng thái đơn hàng
  async updateStatus(orderId, status) {
    // Kiểm tra status hợp lệ
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

    // Nếu đơn hàng hoàn thành -> set driver về AVAILABLE
    if (status === "DELIVERED") {
      const currentOrder = await prisma.order.findUnique({
        where: { id: Number(orderId) },
      });
      if (currentOrder && currentOrder.driverId) {
        await prisma.driver.update({
          where: { id: currentOrder.driverId },
          data: { status: "AVAILABLE" },
        });
      }
    }

    // Cập nhật
    const order = await prisma.order.update({
      where: { id: Number(orderId) },
      data: { status },
      include: {
        orderItem: true,
        user: true,
        branch: true,
        driver: true,
      },
    });

    return order;
  },
  // ADMIN gán tài xế
  async assignDriver(orderId, driverId) {
    // Kiểm tra driver tồn tại
    const driver = await prisma.driver.findUnique({
      where: { id: Number(driverId) },
    });
    if (!driver) {
      throw new Error("Driver không tồn tại");
    }

    // Cập nhật trạng thái driver -> ON_DELIVERY
    await prisma.driver.update({
      where: { id: Number(driverId) },
      data: { status: "ON_DELIVERY" },
    });

    // Cập nhật order -> gán driver + status DRIVER_ASSIGNED
    const order = await prisma.order.update({
      where: { id: Number(orderId) },
      data: {
        driverId: Number(driverId),
        status: "DRIVER_ASSIGNED",
      },
      include: {
        orderItem: true,
        user: true,
        branch: true,
        driver: true,
      },
    });

    return order;
  },
};
