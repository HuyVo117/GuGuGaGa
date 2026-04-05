import prisma from "../configs/prisma.js";
import { deleteImageService } from "./upload.service.js";

const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  try {
    const regex = /\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  } catch (e) {
    return null;
  }
};

export const comboService = {
  async getAll(categoryId) {
    const where = categoryId ? { categoryId: Number(categoryId) } : {};
    return await prisma.combo.findMany({
      where,
      include: {
        category: true,
        comboItems: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });
  },

  async getById(id) {
    return await prisma.combo.findUnique({
      where: { id: Number(id) },
      include: {
        category: true,
        comboItems: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });
  },

  async create(data) {
    const { name, price, categoryId, desc, image, comboItems } = data;

    // Verify category
    const category = await prisma.category.findUnique({
      where: { id: Number(categoryId) },
    });
    if (!category) throw new Error("Category not found");

    // Create combo with items
    return await prisma.combo.create({
      data: {
        name,
        price: Number(price),
        categoryId: Number(categoryId),
        desc,
        image,
        comboItems: {
          create: comboItems.map((item) => ({
            productId: Number(item.productId),
            quantity: Number(item.quantity),
          })),
        },
      },
      include: {
        comboItems: true,
      },
    });
  },

  async update(id, data) {
    const { name, price, categoryId, desc, image, comboItems } = data;

    const combo = await prisma.combo.findUnique({
      where: { id: Number(id) },
    });
    if (!combo) throw new Error("Combo not found");

    // Handle image deletion
    if (image && combo.image && image !== combo.image) {
      const publicId = getPublicIdFromUrl(combo.image);
      if (publicId) {
        await deleteImageService(publicId);
      }
    }

    // Update combo
    // For comboItems, we delete existing and recreate (simplest approach for now)
    // Or use transaction to update. Let's use deleteMany then create.
    
    return await prisma.$transaction(async (tx) => {
      // Delete existing items
      if (comboItems) {
        await tx.comboItem.deleteMany({
          where: { comboId: Number(id) },
        });
      }

      const updatedCombo = await tx.combo.update({
        where: { id: Number(id) },
        data: {
          name,
          price: price !== undefined ? Number(price) : undefined,
          categoryId: categoryId ? Number(categoryId) : undefined,
          desc,
          image,
          comboItems: comboItems
            ? {
                create: comboItems.map((item) => ({
                  productId: Number(item.productId),
                  quantity: Number(item.quantity),
                })),
              }
            : undefined,
        },
        include: {
          comboItems: true,
        },
      });
      return updatedCombo;
    });
  },

  async delete(id) {
    const combo = await prisma.combo.findUnique({
      where: { id: Number(id) },
    });
    if (!combo) throw new Error("Combo not found");

    if (combo.image) {
      const publicId = getPublicIdFromUrl(combo.image);
      if (publicId) {
        await deleteImageService(publicId);
      }
    }

    // ComboItems are usually deleted via cascade if configured in schema, 
    // but to be safe/explicit or if cascade isn't set:
    // await prisma.comboItem.deleteMany({ where: { comboId: Number(id) } }); 
    // Assuming schema handles cascade or we rely on prisma to handle it if defined.
    // Let's assume cascade delete is configured in DB or Prisma schema.
    
    await prisma.combo.delete({ where: { id: Number(id) } });
    return { message: "Combo deleted successfully" };
  },
};
