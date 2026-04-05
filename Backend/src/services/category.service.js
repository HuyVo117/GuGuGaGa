import prisma from "../configs/prisma.js";

export const categoryService = {
  async getAllCategories() {
    return await prisma.category.findMany();
  },
  async createCategory(name) {
    return await prisma.category.create({
      data: {
        name: name,
      },
    });
  },
  async updateCategory(id, name) {
    // Cập nhật category theo id
    return prisma.category.update({
      where: { id: Number(id) },
      data: { name },
    });
  },

  async deleteCategory(id) {
    return await prisma.category.delete({ where: { id: Number(id) } });
  },
};
