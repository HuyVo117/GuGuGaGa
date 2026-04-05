import prisma from "../configs/prisma.js";

export const userService = {
	async getAll() {
		return prisma.user.findMany({
			select: {
				id: true,
				name: true,
				email: true,
				phone: true,
				role: true,
				createdAt: true,
			},
			orderBy: { id: "desc" },
		});
	},
};
