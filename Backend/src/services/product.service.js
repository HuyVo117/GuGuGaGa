import prisma from "../configs/prisma.js";
import { deleteImageService } from "./upload.service.js";

const getPublicIdFromUrl = (url) => {
	if (!url) return null;
	try {
		const regex = /\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/;
		const match = url.match(regex);
		return match ? match[1] : null;
	} catch {
		return null;
	}
};

export const productService = {
	async getAll(categoryId) {
		const where = categoryId ? { categoryId: Number(categoryId) } : {};
		return prisma.product.findMany({
			where,
			include: { category: true },
			orderBy: { id: "desc" },
		});
	},

	async getById(id) {
		const product = await prisma.product.findUnique({
			where: { id: Number(id) },
			include: { category: true },
		});
		if (!product) throw new Error("Product not found");
		return product;
	},

	async create({ name, price, categoryId }) {
		if (!name || price === undefined || !categoryId) {
			throw new Error("name, price, categoryId are required");
		}

		const category = await prisma.category.findUnique({
			where: { id: Number(categoryId) },
		});
		if (!category) throw new Error("Category not found");

		return prisma.product.create({
			data: {
				name,
				price: Number(price),
				categoryId: Number(categoryId),
			},
			include: { category: true },
		});
	},

	async update(id, { name, price, categoryId, image }) {
		const product = await prisma.product.findUnique({
			where: { id: Number(id) },
		});
		if (!product) throw new Error("Product not found");

		if (categoryId) {
			const category = await prisma.category.findUnique({
				where: { id: Number(categoryId) },
			});
			if (!category) throw new Error("Category not found");
		}

		// Keep this image cleanup hook for when Product model includes image field.
		if (image && product.image && image !== product.image) {
			const publicId = getPublicIdFromUrl(product.image);
			if (publicId) {
				await deleteImageService(publicId);
			}
		}

		const updatedProduct = await prisma.product.update({
			where: { id: Number(id) },
			data: {
				...(name ? { name } : {}),
				...(price !== undefined ? { price: Number(price) } : {}),
				...(categoryId ? { categoryId: Number(categoryId) } : {}),
			},
			include: { category: true },
		});
		return updatedProduct;
	},

	async delete(id) {
		const product = await prisma.product.findUnique({
			where: { id: Number(id) },
		});
		if (!product) throw new Error("Product not found");

		if (product.image) {
			const publicId = getPublicIdFromUrl(product.image);
			if (publicId) {
				await deleteImageService(publicId);
			}
		}

		await prisma.product.delete({ where: { id: Number(id) } });
		return { message: "Product deleted successfully" };
	},
};
