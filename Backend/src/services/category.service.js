import prisma from "../configs/prisma.js";

export const categoryService = {
	async getAll() {
		return prisma.category.findMany({
			orderBy: { id: "desc" },
		});
	},
};
