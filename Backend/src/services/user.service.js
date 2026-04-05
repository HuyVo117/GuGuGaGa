import prisma from "../configs/prisma.js";

export const userService = {
  async getAllUsers(currentUserId) {
    return await prisma.user.findMany({
      where: {
        id: { not: currentUserId },
      },
    });
  },

  async getUserById(id) {
    return await prisma.user.findUnique({
      where: { id: Number(id) },
    });
  },

  async createUser(data) {
    return await prisma.user.create({ data });
  },

  async deleteUser(id) {
    return await prisma.user.delete({
      where: { id: Number(id) },
    });
  },
  updateUser: async (id, data) => {
    const updateData = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      role: data.role,
    };

    // Nếu frontend gửi password mới, hash nó
    if (data.password && data.password.trim() !== "") {
      const hashed = await bcrypt.hash(data.password, 10);
      updateData.passwordHash = hashed;
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: updateData,
    });

    return updatedUser;
  },
};
