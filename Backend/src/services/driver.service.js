import prisma from "../configs/prisma.js";
import bcrypt from "bcrypt";

export const driverService = {
  // Lấy danh sách
  async getAll() {
    return prisma.driver.findMany({
      include: { branch: true },
      orderBy: { createdAt: "desc" },
    });
  },

  // Lấy 1 tài xế
  async getById(id) {
    const driver = await prisma.driver.findUnique({
      where: { id: Number(id) },
      include: { branch: true },
    });

    if (!driver) throw new Error("Không tìm thấy tài xế");

    return driver;
  },

  // Tạo tài xế
  async create(data) {
    const hashed = await bcrypt.hash(data.password, 10);

    return prisma.driver.create({
      data: {
        branchId: Number(data.branchId),
        name: data.name,
        phone: data.phone,
        passwordHash: hashed,
      },
    });
  },

  // Cập nhật tài xế
  async update(id, data) {
    const updateData = {
      name: data.name,
      phone: data.phone,
      branchId: data.branchId ? Number(data.branchId) : undefined,
      status: data.status,
    };

    // Nếu có password → hash lại
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    return prisma.driver.update({
      where: { id: Number(id) },
      data: updateData,
    });
  },

  // Xóa tài xế
  async remove(id) {
    return prisma.driver.delete({
      where: { id: Number(id) },
    });
  },
};
