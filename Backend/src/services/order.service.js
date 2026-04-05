import prisma from "../configs/prisma.js";

export const orderService = {
	async getAll() {
		return prisma.order.findMany({
			include: {
				orderItems: {
					include: {
						product: { include: { category: true } },
						combo: true,
					},
				},
				user: true,
				branch: true,
				driver: true,
				bill: true,
			},
			orderBy: { id: "desc" },
		});
	},

	async createOrder(userId, cart, body) {
		const { paymentMethod = "COD" } = body;

		// Demo fallback branch: use branch id 1 if cart has no branch context.
		const branchId = 1;

		const productIds = cart.cartItems.map((item) => item.productId);
		const products = await prisma.product.findMany({
			where: { id: { in: productIds } },
		});
		const productMap = new Map(products.map((p) => [p.id, p]));

		const items = cart.cartItems.map((item) => {
			const product = productMap.get(item.productId);
			if (!product) {
				throw new Error(`Product ${item.productId} not found`);
			}
			return {
				productId: item.productId,
				quantity: item.quantity,
				price: product.price,
			};
		});

		const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

		const order = await prisma.$transaction(async (tx) => {
			const created = await tx.order.create({
				data: {
					userId,
					branchId,
					paymentMethod,
					orderItems: {
						create: items,
					},
				},
				include: {
					orderItems: true,
				},
			});

			await tx.bill.create({
				data: {
					orderId: created.id,
					total: totalAmount,
				},
			});

			await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

			return tx.order.findUnique({
				where: { id: created.id },
				include: {
					orderItems: { include: { product: true, combo: true } },
					bill: true,
					branch: true,
				},
			});
		});

		return order;
	},

	async getOrdersByUser(userId) {
		return prisma.order.findMany({
			where: { userId },
			include: {
				orderItems: {
					include: {
						product: { include: { category: true } },
						combo: true,
					},
				},
				branch: true,
				bill: true,
			},
			orderBy: { id: "desc" },
		});
	},

	async getOrderDetail(orderId, userId) {
		return prisma.order.findFirst({
			where: { id: orderId, userId },
			include: {
				orderItems: {
					include: {
						product: { include: { category: true } },
						combo: true,
					},
				},
				branch: true,
				bill: true,
			},
		});
	},

	async getAdminOrderDetail(orderId) {
		return prisma.order.findUnique({
			where: { id: orderId },
			include: {
				orderItems: {
					include: {
						product: { include: { category: true } },
						combo: true,
					},
				},
				branch: true,
				user: true,
				driver: true,
				bill: true,
			},
		});
	},

	async updateStatus(orderId, status) {
		const validStatuses = [
			"PENDING",
			"CONFIRMED",
			"PREPARING",
			"DELIVERING",
			"DELIVERED",
			"CANCELED",
		];
		if (!validStatuses.includes(status)) {
			throw new Error(`Status khong hop le. Chi chap nhan: ${validStatuses.join(", ")}`);
		}

		if (status === "DELIVERED") {
			const currentOrder = await prisma.order.findUnique({
				where: { id: Number(orderId) },
			});
			if (currentOrder?.driverId) {
				await prisma.driver.update({
					where: { id: currentOrder.driverId },
					data: { statusDriver: "ONLINE" },
				});
			}
		}

		return prisma.order.update({
			where: { id: Number(orderId) },
			data: { statusOrder: status },
			include: {
				orderItems: true,
				user: true,
				branch: true,
				driver: true,
				bill: true,
			},
		});
	},

	async assignDriver(orderId, driverId) {
		const driver = await prisma.driver.findUnique({
			where: { id: Number(driverId) },
		});
		if (!driver) {
			throw new Error("Driver khong ton tai");
		}

		await prisma.driver.update({
			where: { id: Number(driverId) },
			data: { statusDriver: "BUSY" },
		});

		return prisma.order.update({
			where: { id: Number(orderId) },
			data: {
				driverId: Number(driverId),
				statusOrder: "DELIVERING",
			},
			include: {
				orderItems: true,
				user: true,
				branch: true,
				driver: true,
				bill: true,
			},
		});
	},
};
