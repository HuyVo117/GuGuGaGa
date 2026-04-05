import prisma from "../configs/prisma.js";

export const driverService = {
	async getAll() {
		return prisma.driver.findMany({
			include: {
				branch: true,
			},
			orderBy: { id: "desc" },
		});
	},
};
