import prisma from "../configs/prisma.js";

export const branchService = {
	async getAll() {
		return prisma.branch.findMany({
			orderBy: { id: "desc" },
		});
	},
};
