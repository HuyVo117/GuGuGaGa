import prisma from "../configs/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../configs/env.js";

export const shipperService = {
  login: async (phone, password) => {
    const driver = await prisma.driver.findUnique({
      where: { phone },
      include: { branch: true },
    });

    if (!driver) {
      throw new Error("Tài xế không tồn tại");
    }

    const isMatch = await bcrypt.compare(password, driver.passwordHash);
    if (!isMatch) {
      throw new Error("Mật khẩu không đúng");
    }

    const token = jwt.sign(
      { id: driver.id, role: "DRIVER" },
      config.jwtSecret,
      { expiresIn: "7d" }
    );

    return { driver, token };
  },

  getAvailableOrders: async () => {
    return await prisma.order.findMany({
      where: {
        driverId: null,
        status: "ACCEPTED",
      },
      include: {
        branch: true,
        user: true,
        orderItem: {
          include: {
            product: true,
            combo: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  acceptOrder: async (orderId, driverId) => {
    const order = await prisma.order.findUnique({
      where: { id: Number(orderId) },
    });

    if (!order) {
      throw new Error("Đơn hàng không tồn tại");
    }

    if (order.driverId) {
      throw new Error("Đơn hàng đã có tài xế nhận");
    }

    if (order.status !== "ACCEPTED") {
      throw new Error("Đơn hàng chưa sẵn sàng để nhận");
    }

    await prisma.driver.update({
      where: { id: driverId },
      data: { status: "ON_DELIVERY" },
    });

    return await prisma.order.update({
      where: { id: Number(orderId) },
      data: {
        driverId,
        status: "DRIVER_ASSIGNED",
      },
      include: {
        branch: true,
        user: true,
        orderItem: {
          include: {
            product: true,
            combo: true,
          },
        },
      },
    });
  },

  getMyOrders: async (driverId) => {
    return await prisma.order.findMany({
      where: { driverId },
      include: {
        branch: true,
        user: true,
        orderItem: {
          include: {
            product: true,
            combo: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  getAssignedOrders: async (driverId) => {
    return await prisma.order.findMany({
      where: {
        driverId: driverId,
        status: "DRIVER_ASSIGNED",
      },
      include: {
        branch: true,
        user: true,
        orderItem: {
          include: {
            product: true,
            combo: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  updateOrderStatus: async (orderId, driverId, status) => {
    const order = await prisma.order.findFirst({
      where: { id: Number(orderId), driverId: driverId },
    });

    if (!order) {
      throw new Error("Đơn hàng không tồn tại hoặc không thuộc về bạn");
    }

    const updatedOrder = await prisma.order.update({
      where: { id: Number(orderId) },
      data: { status },
    });

    if (status === "DELIVERED") {
      await prisma.driver.update({
        where: { id: driverId },
        data: { status: "AVAILABLE" },
      });
    }

    return updatedOrder;
  },

  updateLocation: async (driverId, latitude, longitude) => {
    return await prisma.driver.update({
      where: { id: driverId },
      data: {
        latitude,
        longitude,
      },
    });
  },
};
