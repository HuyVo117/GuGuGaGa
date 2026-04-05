import prisma from "../configs/prisma.js";

export const branchService = {
  async getAll() {
    return await prisma.branch.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  async create(data) {
    return await prisma.branch.create({
      data,
    });
  },

  async update(id, data) {
    return await prisma.branch.update({
      where: { id: parseInt(id) },
      data,
    });
  },

  async delete(id) {
    return await prisma.branch.delete({
      where: { id: parseInt(id) },
    });
  },
};
